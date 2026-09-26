/**
 * No count on the Lab and AI pages is typed into copy (WEB-141 AC2; #133, #355).
 *
 * The homelab had 9, 8 or 5 machines depending on where you looked, because each
 * surface held its own copy of a number that changes. A count of machines,
 * nodes, clusters, services or providers is rendered from `platform.json`, in an
 * element marked `data-count`, and nowhere else:
 *
 *   - a digit before a count noun must sit inside a `data-count` element, where a
 *     component put it from the data;
 *   - a count spelled as a word ("eight machines", "tres clústeres") fails
 *     anywhere, inside `data-count` too: a template that types "the three
 *     clusters" around its placeholders is the same defect in a derived-looking
 *     slot.
 *
 * `<pre>`, `<code>` and `<svg>` are skipped: quoted files and diagrams are not
 * the page's own claims (see `es-no-english.test.mjs`).
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readableNodes } from './lib/audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

const PAGES = ['lab', 'ai', 'lab/idp', 'lab/idp/architecture'].flatMap((path) => [path, `es/${path}`]);

const NOUN = String.raw`(?:machines?|nodes?|clusters?|services?|providers?|servers?|máquinas?|nodos?|clústeres|clúster|servicios?|proveedores?|servidores?)`;
const WORD = String.raw`(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)`;
/** A number, then up to three words ("single-node K3s"), then a count noun. */
const counted = (number) => new RegExp(String.raw`(?<![\p{L}\d])${number}(?:\s+[\p{L}\d-]+){0,3}?\s+${NOUN}(?![\p{L}])`, 'giu');
const DIGITS = counted(String.raw`\d+\+?`);
const WORDS = counted(WORD);

const quoted = (tag) => ['pre', 'code', 'svg'].includes(tag);

function read(path) {
  const file = join(dist, path, 'index.html');
  assert.ok(existsSync(file), `${file} not found — run \`npm run build\` first`);
  return readFileSync(file, 'utf8');
}

for (const path of PAGES) {
  test(`/${path}: no count typed into copy`, () => {
    const html = read(path);
    const outside = readableNodes(html, (tag, attributes) => quoted(tag) || /\sdata-count\b/.test(attributes));
    const everywhere = readableNodes(html, quoted);

    const hits = [
      ...outside.flatMap((node) => [...node.matchAll(DIGITS)].map((m) => `typed digit: "${m[0]}" in "${node}"`)),
      ...everywhere.flatMap((node) => [...node.matchAll(WORDS)].map((m) => `spelled count: "${m[0]}" in "${node}"`)),
    ];
    assert.deepEqual(hits, [], `/${path}:\n  ${hits.join('\n  ')}`);
  });
}

test('the Lab renders its machine count from the data, in both locales', () => {
  for (const path of ['lab', 'es/lab']) {
    const slots = [...read(path).matchAll(/<[^>]*\sdata-count\b[^>]*>([^<]*\d[^<]*)</g)];
    assert.ok(slots.length > 0, `/${path} has no data-count slot holding a number: the check above would pass vacuously`);
  }
});
