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

// One attribute, and one opening tag, read with their quotes: a `>` or an
// `onclick=` inside a quoted value is part of the value, not markup.
const VALUE = String.raw`(?:"[^"]*"|'[^']*'|[^\s"'=<>\x60]+)`;
const ATTR = new RegExp(String.raw`([^\s"'<>/=]+)(?:\s*=\s*(${VALUE}))?`, 'g');
const TAG = new RegExp(String.raw`<([a-zA-Z][\w-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*${VALUE})?)*)\s*/?>`, 'g');
const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction']);

/** Every way the HTML would run code in a browser, as a short description. */
function clientCode(html) {
  const found = [];
  // A comment runs nothing, and a script body is text, not tags: keep only the
  // script's opening tag. An unclosed script keeps its tag too, so it is read.
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(new RegExp(String.raw`(<script\b(?:${VALUE}|[^"'>])*>)[\s\S]*?(</script>)`, 'gi'), '$1$2');
  for (const [tag, name, attrs] of markup.matchAll(TAG)) {
    const values = new Map([...attrs.matchAll(ATTR)].map(([, key, value = '']) => [key.toLowerCase(), value.replace(/^["']|["']$/g, '')]));
    if (name.toLowerCase() === 'script' && values.get('type')?.toLowerCase() !== 'application/ld+json') found.push(tag);
    for (const [key, value] of values) {
      if (key.startsWith('on')) found.push(`${key} handler`);
      if (URL_ATTRS.has(key) && /^\s*javascript:/i.test(value)) found.push(`javascript: ${key}`);
    }
  }
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

test('the detector reads attributes with their quotes, and an unclosed script still counts', () => {
  assert.deepEqual(clientCode('<script src="https://cdn.example/x.js">'), ['<script src="https://cdn.example/x.js">']);
  assert.deepEqual(clientCode('<img alt="a > b" onclick="x()">'), ['onclick handler']);
  assert.deepEqual(clientCode('<a title="a > b" href="javascript:x()">a</a>'), ['javascript: href']);
  assert.deepEqual(clientCode('<span data-note="use onclick= here">a</span>'), []);
  assert.deepEqual(clientCode('<a title="href= javascript: void" href="/x/">a</a>'), []);
  assert.deepEqual(clientCode('<!-- <script>x()</script><b onclick="y()"> -->'), []);
  assert.deepEqual(clientCode('<script type="application/ld+json" data-x="a > b">{"a":"<i onload=1>"}</script>'), []);
});

test('no page ships client JavaScript', () => {
  const all = files(DIST);
  const pages = all.filter((file) => file.endsWith('.html'));
  assert.ok(pages.length > 0, 'no pages in dist: run the build first');
  const found = pages.flatMap((file) => clientCode(readFileSync(file, 'utf8')).map((what) => `/${relative(DIST, file)}: ${what}`));
  const bundles = all.filter((file) => /\.m?js$/.test(file)).map((file) => `/${relative(DIST, file)}`);
  assert.deepEqual([...found, ...bundles], [], 'the site is static: no script, handler, javascript: URL or JS file ships');
});
