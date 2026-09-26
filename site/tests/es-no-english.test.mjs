/**
 * The Spanish Lab and AI pages carry no English copy (WEB-141 AC4, the Lab and AI
 * part of #354).
 *
 * ## What counts as untranslated
 *
 * A piece of text that reads the same on `/es/<page>` as on `/<page>`. That needs
 * no dictionary of English words, which would only catch the words it already
 * knows: whatever the next component forgets to translate is identical in both
 * locales, so it fails here the day it lands.
 *
 * ## What is exempt, and how it is marked
 *
 * Exemptions are structural, in the markup, so they show up in review as a diff
 * of the component rather than as a line in this test:
 *
 *   - `translate="no"`, the HTML attribute for "this is a name": products,
 *     hosts, machines, file paths, tech tags. It goes on the slot that renders
 *     a name, never on a sentence.
 *   - `<pre>` and `<code>`: quoted files stay in the words of the file (the /ai
 *     artifact cards, `ai-artifact-excerpts.test.mjs`).
 *   - `<svg>`: every generated diagram is English-only in both locales. Whether
 *     they gain Spanish labels or say they are English is its own decision
 *     (#354 AC3), not this test's.
 *   - `data-i18n-pending="platform"`: values that arrive in English from
 *     `platform.json`, which the kubelab exporter produces. Translating them by
 *     hand here would be the hand-written copy WEB-141 phase 2 removes; the
 *     exporter gains the locale, or the page formats plain data. The count per
 *     page is pinned below so a new one cannot appear unnoticed.
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

/**
 * Each page, with how many `platform.json` values it renders while they wait for
 * the exporter. `/lab`, `/lab/idp` and `/lab/idp/architecture` join in the next
 * change; they are listed here as they pass, never before.
 */
const PAGES = [{ path: 'ai', pending: 0 }];

const exempt = (tag, attributes) =>
  ['pre', 'code', 'svg'].includes(tag) || /\stranslate="no"/.test(attributes) || /\sdata-i18n-pending=/.test(attributes);

function read(path) {
  assert.ok(existsSync(path), `${path} not found — run \`npm run build\` first`);
  return readFileSync(path, 'utf8');
}

for (const { path, pending } of PAGES) {
  test(`/es/${path} has no text that reads the same as /${path}`, () => {
    // The English side is read whole: exempting it too would let a name that lost
    // its marker on the Spanish page match nothing, and pass.
    const en = new Set(readableNodes(read(join(dist, path, 'index.html'))));
    const esNodes = readableNodes(read(join(dist, 'es', path, 'index.html')), exempt);
    assert.ok(esNodes.length > 20, `only ${esNodes.length} readable nodes on /es/${path}: is the page empty?`);

    const same = [...new Set(esNodes.filter((node) => /\p{L}{3}/u.test(node) && en.has(node)))];
    assert.deepEqual(same, [], `untranslated on /es/${path} (${same.length}):\n  ${same.join('\n  ')}`);
  });

  test(`/es/${path} marks exactly ${pending} value(s) as waiting for the exporter`, () => {
    const found = read(join(dist, 'es', path, 'index.html')).match(/\sdata-i18n-pending="platform"/g)?.length ?? 0;
    assert.equal(found, pending);
  });
}
