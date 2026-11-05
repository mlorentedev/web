/**
 * The site ships no client JavaScript, on every page (WEB-179).
 *
 * The only `<script>` in `dist/` is structured data (`application/ld+json`),
 * which no browser runs. This held for every page, but was asserted for `/ai/`
 * alone, so a script added anywhere else passed every check.
 *
 * A page runs code four ways, and each is refused here, naming the page:
 * - a `<script>` whose own `type` is not `application/ld+json` (read from the
 *   element's attribute, so a JSON-LD string that mentions the type does not count);
 * - an inline event handler (`onclick="…"`, any `on*` attribute);
 * - a `javascript:` URL in an `href`, `src` or `action`;
 * - a `.js` or `.mjs` file anywhere in `dist/`.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parse } from 'parse5';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

// `data` is <object>'s URL. SVG's `xlink:href` needs no entry: the parser
// reads it as `href` in the xlink namespace.
const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'data']);

// The browser's own reading of the page. An HTML5 parser settles what a regex
// over the markup kept getting wrong: a repeated attribute keeps its first
// value, entities in a value are decoded, a `>` or `<script>` inside a quoted
// value is text, and a script body is not markup.
// A `<template>`'s content is scanned too, on purpose: it is inert only until a
// script clones it, and a handler waiting there is code the site meant to run.
const elements = (node) => [
  ...(node.attrs ? [node] : []),
  ...(node.childNodes ?? []).flatMap(elements),
  ...(node.content ? elements(node.content) : []),
];

/** A URL the way the browser reads its scheme: leading spaces and every tab or newline dropped. */
const scheme = (value) => value.replace(/[\t\n\r]/g, '').replace(/^[\x00-\x20]+/, '');

/** Every way the HTML would run code in a browser, as a short description. */
function clientCode(html) {
  const found = [];
  for (const el of elements(parse(html))) {
    const type = el.attrs.find((a) => a.name === 'type')?.value.trim().toLowerCase();
    if (el.nodeName === 'script' && type !== 'application/ld+json') {
      found.push(`<script${el.attrs.map((a) => ` ${a.name}="${a.value}"`).join('')}>`);
    }
    for (const { name, value } of el.attrs) {
      if (name.startsWith('on')) found.push(`${name} handler`);
      if (URL_ATTRS.has(name) && /^javascript:/i.test(scheme(value))) found.push(`javascript: ${name}`);
      // An iframe's `srcdoc` is a whole document, run same-origin: read it the same way.
      if (name === 'srcdoc') found.push(...clientCode(value).map((what) => `srcdoc: ${what}`));
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

test('the detector reads a URL and a repeated attribute the way the browser does', () => {
  assert.deepEqual(clientCode('<a href="&#106;avascript:alert(1)">a</a>'), ['javascript: href']);
  assert.deepEqual(clientCode('<a href="&#x6A;avascript&colon;x()">a</a>'), ['javascript: href']);
  assert.deepEqual(clientCode('<a href="java\nscript:x()">a</a>'), ['javascript: href']);
  assert.deepEqual(clientCode('<svg><a xlink:href="javascript:x()"><text>x</text></a></svg>'), ['javascript: href']);
  assert.deepEqual(clientCode('<object data="javascript:y()"></object>'), ['javascript: data']);
  assert.deepEqual(clientCode('<a href="javascript:x()" href="/safe/">a</a>'), ['javascript: href']);
  assert.deepEqual(clientCode('<a href="/safe/" href="javascript:x()">a</a>'), []);
  assert.deepEqual(clientCode('<script type="text/javascript" type="application/ld+json">x()</script>'), ['<script type="text/javascript">']);
  assert.deepEqual(clientCode('<a href="/notes/?a=1&amp;b=2">a</a>'), []);
  assert.deepEqual(clientCode('<script type=>alert(1)</script>'), ['<script type="">']);
  assert.deepEqual(clientCode('<iframe srcdoc="&lt;script&gt;x()&lt;/script&gt;"></iframe>'), ['srcdoc: <script>']);
  assert.deepEqual(clientCode('<iframe srcdoc="&lt;p&gt;text&lt;/p&gt;"></iframe>'), []);
  // After a bare `=` the next word is the value: this href is `onclick="x()"`, and no handler exists.
  assert.deepEqual(clientCode('<a href= onclick="x()">a</a>'), []);
  assert.deepEqual(clientCode('<div data-code="<script>">a</div><button onclick="x()">b</button><script type="application/ld+json">{}</script>'), ['onclick handler']);
});

/** Every script, handler, `javascript:` URL or JS file under `root`, named by its path. */
function violations(root) {
  const all = files(root);
  const found = all
    .filter((file) => file.endsWith('.html'))
    .flatMap((file) => clientCode(readFileSync(file, 'utf8')).map((what) => `/${relative(root, file)}: ${what}`));
  const bundles = all.filter((file) => /\.m?js$/.test(file)).map((file) => `/${relative(root, file)}`);
  return [...found, ...bundles];
}

test('the scan descends into every directory and names each file it refuses', () => {
  const root = mkdtempSync(join(tmpdir(), 'no-client-js-'));
  try {
    mkdirSync(join(root, 'a', 'b'), { recursive: true });
    writeFileSync(join(root, 'index.html'), '<p>fine</p>');
    writeFileSync(join(root, 'a', 'b', 'index.html'), '<button onclick="x()">b</button>');
    writeFileSync(join(root, 'a', 'app.mjs'), 'x()');
    writeFileSync(join(root, 'a', 'data.json'), '{}');
    assert.deepEqual(violations(root), ['/a/b/index.html: onclick handler', '/a/app.mjs']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('no page ships client JavaScript', () => {
  assert.ok(existsSync(DIST), 'no dist/: run the build first');
  assert.ok(files(DIST).some((file) => file.endsWith('.html')), 'no pages in dist: run the build first');
  assert.deepEqual(violations(DIST), [], 'the site is static: no script, handler, javascript: URL or JS file ships');
});
