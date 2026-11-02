/**
 * The header tells a screen reader where the visitor is (#358).
 *
 * Colour and weight are not announced. `page` is for the link to this very page.
 * A note sits under `/notes/`, so that link marks the section with `true`: it
 * does not lead to the page being read.
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

for (const [path, expected] of [
  ['/lab/', [['/lab/', 'page']]],
  ['/es/lab/', [['/es/lab/', 'page']]],
  ['/notes/', [['/notes/', 'page']]],
  ['/es/contact/', [['/es/contact/', 'page']]],
  ['/notes/building-a-homelab-idp/', [['/notes/', 'true']]],
  ['/', [['/', 'page']]],
  ['/es/', [['/es/', 'page']]],
]) {
  test(`header on ${path} marks ${expected[0].join(' as ')}`, () => {
    assert.deepEqual(current(header(path)), expected);
  });
}
