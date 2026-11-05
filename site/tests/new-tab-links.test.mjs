/**
 * A link that opens a new tab says so (WEB-167).
 *
 * External links opened a new tab by default, 349 of them across the built site,
 * and none said so. The decision recorded on the ticket is to open nothing in a
 * new tab (WCAG G200: only when necessary), so today no page has one. This holds
 * the rule for the next one: a link whose `target` opens a new tab must announce
 * it in its accessible name, through its text (visible or `sr-only`) or its
 * `aria-label` (WCAG G201), in either locale.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parse } from 'parse5';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const ANNOUNCED = /new (tab|window)|nueva (pestaña|ventana)/i;
// Any other target opens a new browsing context: `_blank`, and a name no frame
// carries, which the browser creates as a new tab (HTML, "rules for choosing a
// navigable"). An empty target is the same tab.
const SAME_TAB = new Set(['', '_self', '_parent', '_top']);

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

const elements = (node) => [...(node.attrs ? [node] : []), ...(node.childNodes ?? []).flatMap(elements)];
const attr = (el, name) => el.attrs.find((a) => a.name === name)?.value;
const text = (node) => (node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join(''));

/** The new-tab links in `html` whose accessible name does not say they open one. */
function silentNewTabs(html) {
  return elements(parse(html))
    .filter((el) => el.nodeName === 'a' && attr(el, 'target') !== undefined && !SAME_TAB.has(attr(el, 'target').trim().toLowerCase()))
    .filter((el) => !ANNOUNCED.test(`${attr(el, 'aria-label') ?? ''} ${text(el)}`))
    .map((el) => attr(el, 'href'));
}

test('the detector flags an unannounced new-tab link and passes an announced one', () => {
  assert.deepEqual(silentNewTabs('<a href="https://x.dev" target="_blank">x</a>'), ['https://x.dev']);
  assert.deepEqual(silentNewTabs('<a href="https://x.dev" target="_BLANK" rel="noopener">x</a>'), ['https://x.dev']);
  assert.deepEqual(silentNewTabs('<a href="https://x.dev" target="_blank">x <span class="sr-only">(opens in a new tab)</span></a>'), []);
  assert.deepEqual(silentNewTabs('<a href="https://x.dev" target="_blank" aria-label="x (se abre en una nueva pestaña)">x</a>'), []);
  assert.deepEqual(silentNewTabs('<a href="https://x.dev" target="docs">x</a>'), ['https://x.dev']);
  assert.deepEqual(silentNewTabs('<a href="https://x.dev">x</a><a href="/y/" target="_self">y</a><a href="/z/" target="_TOP">z</a>'), []);
});

test('every link that opens a new tab says so', () => {
  assert.ok(existsSync(DIST), 'no dist/: run the build first');
  const pages = files(DIST).filter((file) => file.endsWith('.html'));
  assert.ok(pages.length > 0, 'no pages in dist: run the build first');
  const silent = pages.flatMap((file) => silentNewTabs(readFileSync(file, 'utf8')).map((href) => `/${relative(DIST, file)}: ${href}`));
  assert.deepEqual(silent, [], 'a new-tab link must say so in its name, or open in the same tab');
});
