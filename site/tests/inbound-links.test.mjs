/**
 * Every built page is linked from another page (WEB-061).
 *
 * `/projects` was built, listed in the sitemap and reachable from nothing: no
 * nav item, no card, no footer link. A page only the sitemap knows about is one
 * a visitor never finds. This reads every page in `dist/` and fails on any page
 * no other page links to, unless it is listed in EXCLUDED with its reason.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const ORIGIN = 'https://mlorente.dev';

/** Pages nobody links to on purpose. */
const EXCLUDED = new Map([
  ['/404.html', 'served by nginx for a missing path, never linked'],
  ['/es/404/', 'the Spanish 404 body, served the same way'],
]);

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

const route = (file) => `/${relative(DIST, file).replace(/index\.html$/, '')}`;

/** A same-site href as the route it lands on, or null for anything else. */
function target(href) {
  const path = (href.startsWith(ORIGIN) ? href.slice(ORIGIN.length) || '/' : href).split(/[?#]/)[0];
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path.endsWith('/') || path.endsWith('.html') ? path : `${path}/`;
}

/** Every built route, and every route some other page links to. */
function scan() {
  const pages = files(DIST);
  const linked = new Set();
  for (const file of pages) {
    const from = route(file);
    for (const [, href] of readFileSync(file, 'utf8').matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
      const to = target(href);
      if (to && to !== from) linked.add(to);
    }
  }
  return { built: pages.map(route), linked };
}

test('a same-site href resolves to the route it lands on', () => {
  assert.deepEqual(
    ['/projects', '/es/projects/#top', 'https://mlorente.dev/lab?x=1', 'https://mlorente.dev', '//cdn.example', 'mailto:a@b', '#main'].map(target),
    ['/projects/', '/es/projects/', '/lab/', '/', null, null, null],
  );
});

test('every page has an inbound link from another page', () => {
  const { built, linked } = scan();
  assert.ok(built.length > 0, 'no pages in dist: run the build first');
  const orphans = built.filter((page) => !linked.has(page) && !EXCLUDED.has(page));
  assert.deepEqual(orphans, [], 'pages no other page links to: link them, or list them in EXCLUDED with the reason');
});

test('every exclusion names a page that is built and still has no inbound link', () => {
  const { built, linked } = scan();
  for (const page of EXCLUDED.keys()) {
    assert.ok(built.includes(page), `${page} is excluded but not built`);
    assert.ok(!linked.has(page), `${page} is excluded but now linked: drop the exclusion`);
  }
});
