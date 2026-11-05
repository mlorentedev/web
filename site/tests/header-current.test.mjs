/**
 * The header tells a screen reader where the visitor is (#358).
 *
 * Colour and weight are not announced. `page` is for the link to this very page.
 * A note sits under `/notes/`, so that link marks the section with `true`: it
 * does not lead to the page being read.
 *
 * The nav is rendered twice, as the row from sm up and as the menu below it
 * (WEB-042), and only one is displayed. Each copy is checked with the rest of
 * the header, so a mark missing from either one fails.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const header = (path) =>
  readFileSync(new URL(`../dist${path}index.html`, import.meta.url), 'utf8').match(/<header[\s\S]*?<\/header>/)[0];

const current = (html) =>
  [...html.matchAll(/<a\b[^>]*aria-current="([^"]+)"[^>]*href="([^"]+)"|<a\b[^>]*href="([^"]+)"[^>]*aria-current="([^"]+)"/g)].map(
    (m) => [m[2] ?? m[3], m[1] ?? m[4]],
  );

const ROW = /<div data-header-links[\s\S]*?<\/div>/;
const MENU = /<details data-header-menu[\s\S]*?<\/details>/;

/** The header as each visitor gets it: the rest of it plus the row, and the rest of it plus the menu. */
const copies = (html) => {
  const row = html.match(ROW)?.[0];
  const menu = html.match(MENU)?.[0];
  assert.ok(row && menu, 'the header has both the row and the menu');
  const rest = html.replace(ROW, '').replace(MENU, '');
  return { row: rest + row, menu: rest + menu };
};

for (const [path, expected] of [
  ['/lab/', [['/lab/', 'page']]],
  ['/es/lab/', [['/es/lab/', 'page']]],
  ['/ai/', [['/ai/', 'page']]],
  ['/notes/', [['/notes/', 'page']]],
  ['/es/contact/', [['/es/contact/', 'page']]],
  ['/notes/building-a-homelab-idp/', [['/notes/', 'true']]],
  ['/', [['/', 'page']]],
  ['/es/', [['/es/', 'page']]],
]) {
  test(`header on ${path} marks ${expected[0].join(' as ')}`, () => {
    const { row, menu } = copies(header(path));
    assert.deepEqual(current(row), expected, 'the row');
    assert.deepEqual(current(menu), expected, 'the menu');
  });
}
