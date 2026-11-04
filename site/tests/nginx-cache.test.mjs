/**
 * `site/nginx.conf` sends one `Cache-Control` per response, and `immutable`
 * only for files whose name changes with their content (#328).
 *
 * The asset block sent `expires 1y` and `add_header Cache-Control "public,
 * immutable"`, so every asset answered with TWO `Cache-Control` headers, and
 * `/fonts/*.woff2` and `/images/*`, whose names never change, were promised to
 * a browser as never changing for a year. A new font would not reach a
 * returning visitor until the year ran out. HTML sent no `Cache-Control` at all.
 *
 * The policy is now one `map $uri $cache_control` and one server-level
 * `add_header`, so no location sets a header of its own and none can drop the
 * security set (see nginx-security-headers.test.mjs). The live check that each
 * response carries exactly one header is `tests/nginx-cache-probe.mjs`, run
 * against the container.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { xxh32 } from '@node-rs/xxhash';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const conf = readFileSync(join(site, 'nginx.conf'), 'utf8')
  .split('\n')
  .map((line) => line.replace(/#.*$/, ''))
  .join('\n');

/** The entries of `map <source> <target> { … }`, in order, as `[pattern, value]`, quotes dropped. */
function mapEntries(source, target) {
  const body = conf.match(new RegExp(`^map\\s+\\${source}\\s+\\${target}\\s*\\{([^}]*)\\}`, 'm'))?.[1];
  assert.ok(body, `nginx.conf has no \`map ${source} ${target}\` block`);
  return [...body.matchAll(/^\s*(\S+)\s+("[^"]*"|\S+)\s*;/gm)].map((m) => [m[1], m[2].replace(/^"|"$/g, '')]);
}

/** The policy by path, before the response status is known. */
const cachePolicy = () => mapEntries('$uri', '$path_cache_control');

/** The value the map gives a URI: exact keys first, then regexes in order, then `default`. */
function policyFor(uri) {
  const entries = cachePolicy();
  const exact = entries.find(([key]) => key === uri);
  if (exact) return exact[1];
  for (const [key, value] of entries) {
    if (!key.startsWith('~')) continue;
    const insensitive = key.startsWith('~*');
    if (new RegExp(key.slice(insensitive ? 2 : 1), insensitive ? 'i' : '').test(uri)) return value;
  }
  return entries.find(([key]) => key === 'default')?.[1];
}

test('Cache-Control is set once, at the server level, from the map', () => {
  const sets = [...conf.matchAll(/add_header\s+Cache-Control\s+(\S+)/g)].map((m) => m[1]);
  assert.deepEqual(sets, ['$cache_control'], 'a second Cache-Control would be sent beside the first');
  // `expires` emits its own Cache-Control, which is how assets got two.
  assert.doesNotMatch(conf, /^\s*expires\s/m, '`expires` adds a second Cache-Control header');
});

test('every URI the map can produce gets a value, and the fallback revalidates', () => {
  assert.equal(policyFor('/no/such/path'), 'no-cache');
  for (const [, value] of cachePolicy()) assert.ok(value.length > 0, 'an empty value sends no header');
});

test('only content-hashed paths are immutable; the rest expire or revalidate', () => {
  for (const [key, value] of cachePolicy()) {
    if (value.includes('immutable')) {
      assert.ok(['~^/_astro/', '~^/beoe/'].includes(key), `${key} is immutable but its file names are not hashes`);
      continue;
    }
    assert.ok(value === 'no-cache' || /max-age=\d+/.test(value), `${key}: "${value}" neither expires nor revalidates`);
    const age = Number(value.match(/max-age=(\d+)/)?.[1] ?? 0);
    assert.ok(age <= 7 * 86400, `${key}: a stable name cached for ${age}s keeps a changed file away from returning visitors`);
  }
});

test('an error response revalidates, whatever its path', () => {
  // Only 403 and 404 have an `error_page`. Any other error keeps the asset's
  // URI, so the path map alone sent a 405 or a 500 for a hashed name as
  // immutable, and a cache could keep the error for a year.
  assert.deepEqual(mapEntries('$status', '$cache_control'), [
    ['~^[45]', 'no-cache'],
    ['default', '$path_cache_control'],
  ]);
});

test('pages, fonts, images and the release marker get the policy their names allow', () => {
  assert.equal(policyFor('/'), 'no-cache');
  assert.equal(policyFor('/notes/some-note/'), 'no-cache');
  assert.equal(policyFor('/version.json'), 'no-cache');
  assert.match(policyFor('/_astro/index.BkF2x9Qa.css'), /immutable/);
  assert.doesNotMatch(policyFor('/fonts/Roboto-Regular.woff2'), /immutable/);
  assert.doesNotMatch(policyFor('/images/og-image.png'), /immutable/);
});

test('every file the immutable paths serve has a content hash in its name', { skip: !existsSync(join(site, 'dist', '_astro')) }, () => {
  // Immutable is a promise about the name: the bytes behind it never change.
  // A file here without a hash would make that promise falsely.
  for (const [dir, hashed] of [
    ['_astro', /\.[\w-]{8}\.\w+$/],
    // @beoe's `file` strategy names each SVG `xxh32(svg).toString(36)`, which
    // is 1 to 7 characters of [0-9a-z]: `banner.svg` has that shape too, so
    // the name is checked against the bytes, not against a pattern.
    ['beoe', (name, bytes) => name === `${xxh32(bytes).toString(36)}.svg`],
  ]) {
    const path = join(site, 'dist', dir);
    if (!existsSync(path)) continue;
    const check = typeof hashed === 'function' ? hashed : (name) => hashed.test(name);
    const unhashed = readdirSync(path).filter((name) => !check(name, readFileSync(join(path, name), 'utf8')));
    assert.deepEqual(unhashed, [], `dist/${dir}/ holds files whose names do not change with their content`);
  }
});
