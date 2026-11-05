/**
 * The site ships no client JavaScript, on every page (WEB-179).
 *
 * The only `<script>` in `dist/` is structured data (`application/ld+json`),
 * which no browser runs. This held for every page, but was asserted for `/ai/`
 * alone, so a script added anywhere else passed every check.
 *
 * A page runs code four ways, and each is refused here, naming the page:
 * - a `<script>` whose own `type` is not `application/ld+json` (read from the
 *   opening tag, so a JSON-LD string that mentions the type does not count);
 * - an inline event handler (`onclick="…"`, any `on*` attribute);
 * - a `javascript:` URL in an `href`, `src` or `action`;
 * - a `.js` or `.mjs` file anywhere in `dist/`.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

/** Every way the HTML would run code in a browser, as a short description. */
function clientCode(html) {
  const found = [];
  const markup = html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (_, attrs) => {
    const type = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type !== 'application/ld+json') found.push(`<script${attrs}>`);
    return '';
  });
  for (const [, name] of markup.matchAll(/<[a-z][\w-]*\b[^>]*?\s(on[a-z]+)\s*=/gi)) found.push(`${name.toLowerCase()} handler`);
  for (const [, attr] of markup.matchAll(/\s(href|src|action)\s*=\s*["']?\s*javascript:/gi)) found.push(`javascript: ${attr.toLowerCase()}`);
  return found;
}

test('the detector finds each way a page runs code, and passes structured data', () => {
  assert.deepEqual(clientCode('<script type="application/ld+json">{"x":"<b onclick=1>"}</script>'), []);
  assert.deepEqual(clientCode('<script type=\'application/ld+json\'>{"type":"application/ld+json"}</script>'), []);
  assert.deepEqual(clientCode('<script>alert(1)</script>'), ['<script>']);
  assert.deepEqual(clientCode('<script type="module" src="/a.js"></script>'), ['<script type="module" src="/a.js">']);
  assert.deepEqual(clientCode('<script data-note="application/ld+json">x()</script>'), ['<script data-note="application/ld+json">']);
  assert.deepEqual(clientCode('<button ONCLICK="x()">a</button>'), ['onclick handler']);
  assert.deepEqual(clientCode('<a href=" javascript:void(0)">a</a>'), ['javascript: href']);
  assert.deepEqual(clientCode('<p>Use onclick= in JavaScript: it runs.</p><a href="/js/">js</a>'), []);
});

test('no page ships client JavaScript', () => {
  const all = files(DIST);
  const pages = all.filter((file) => file.endsWith('.html'));
  assert.ok(pages.length > 0, 'no pages in dist: run the build first');
  const found = pages.flatMap((file) => clientCode(readFileSync(file, 'utf8')).map((what) => `/${relative(DIST, file)}: ${what}`));
  const bundles = all.filter((file) => /\.m?js$/.test(file)).map((file) => `/${relative(DIST, file)}`);
  assert.deepEqual([...found, ...bundles], [], 'the site is static: no script, handler, javascript: URL or JS file ships');
});
