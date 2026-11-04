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
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const conf = readFileSync(join(site, 'nginx.conf'), 'utf8')
  .split('\n')
  .map((line) => line.replace(/#.*$/, ''))
  .join('\n');

/** The `map $uri $cache_control { … }` entries, in order, as `[pattern, value]`. */
function cachePolicy() {
  const body = conf.match(/^map\s+\$uri\s+\$cache_control\s*\{([^}]*)\}/m)?.[1];
  assert.ok(body, 'nginx.conf has no `map $uri $cache_control` block');
  return [...body.matchAll(/^\s*(\S+)\s+"([^"]*)"\s*;/gm)].map((m) => [m[1], m[2]]);
}

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
    // @beoe's `file` strategy names each SVG by a base-36 hash of its content.
    ['beoe', /^[0-9a-z]{5,}\.svg$/],
  ]) {
    const path = join(site, 'dist', dir);
    if (!existsSync(path)) continue;
    const unhashed = readdirSync(path).filter((name) => !hashed.test(name));
    assert.deepEqual(unhashed, [], `dist/${dir}/ holds files whose names do not change with their content`);
  }
});
