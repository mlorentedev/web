/**
 * No measurement on the Lab and AI pages is typed into copy (WEB-141 AC2, AC9; #417).
 *
 * `lab-counts.test.mjs` did this for counts. A percentage, a duration or an
 * amount of money is a measurement too, and each one that reached these pages by
 * hand carried no method and no date: a "<30s" drift loop, a "67–82%" context
 * reduction, an SLO table, and a monthly spend that added euros to dollars.
 *
 * A figure is rendered from data, in an element marked `data-figure` that says
 * how it was obtained (`data-method`) and when (`data-date`, ISO `YYYY-MM` or
 * `YYYY-MM-DD`), and nowhere else. The date is also visible: the page shows the
 * month of every figure it carries, formatted in its own locale (#417 AC2).
 *
 * The monthly spend has one currency and a total that is the sum of its parts
 * (#417 AC1, AC3). This file recomputes that total from `cloud-spend.json` and
 * compares it with what the pages render, so neither can drift from the other.
 *
 * `<pre>`, `<code>` and `<svg>` are skipped, as in `lab-counts.test.mjs`.
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
const site = join(here, '..');
const dist = join(site, 'dist');

const PAGES = ['lab', 'ai', 'lab/idp', 'lab/idp/architecture'].flatMap((path) => [path, `es/${path}`]);
/** The pages that publish the spend, which must therefore hold at least one figure. */
const SPEND_PAGES = ['lab', 'es/lab', 'lab/idp', 'es/lab/idp'];

const UNIT = String.raw`(?:%|€|\$|USD|EUR|ms|s|secs?|seconds?|segundos?|min|minutes?|minutos?|h|hours?|horas?|d|days?|días?|weeks?|semanas?)`;
/**
 * A number with a unit, a comparator optional: "<30s", "67–82%", "100 %",
 * "90-Day", "~$6", "15,59 US$". A digit glued to a letter ("K3s", "K8s") is a
 * name, not a measurement, so the number may not follow a letter.
 */
const FIGURE = new RegExp(
  String.raw`(?<![\p{L}\d.,])(?:[<>~≈≤≥]\s*)?(?:(?:US)?[$€]\s*\d[\d.,]*|\d[\d.,]*(?:\s*[–-]\s*\d[\d.,]*)?(?:\s|-)?${UNIT}(?![\p{L}\d]))`,
  'giu',
);
const DATE = /^\d{4}-\d{2}(?:-\d{2})?$/;

const quoted = (tag) => ['pre', 'code', 'svg'].includes(tag);
const lang = (path) => (path.startsWith('es/') ? 'es' : 'en');

function read(path) {
  const file = join(dist, path, 'index.html');
  assert.ok(existsSync(file), `${file} not found — run \`npm run build\` first`);
  return readFileSync(file, 'utf8');
}

/** Every element carrying `data-figure`: its attributes and its text. */
function figures(html) {
  return [...html.matchAll(/<([a-z]+)\b([^>]*\sdata-figure\b[^>]*)>([^<]*)</g)].map(([, tag, attributes, text]) => ({
    tag,
    method: attributes.match(/\sdata-method="([^"]*)"/)?.[1],
    date: attributes.match(/\sdata-date="([^"]*)"/)?.[1],
    text: text.trim(),
  }));
}

function month(date, locale) {
  const [year, number] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, number - 1, 1)),
  );
}

for (const path of PAGES) {
  test(`/${path}: no measurement typed into copy`, () => {
    const outside = readableNodes(read(path), (tag, attributes) => quoted(tag) || /\sdata-figure\b/.test(attributes));
    const hits = outside.flatMap((node) => [...node.matchAll(FIGURE)].map((m) => `"${m[0]}" in "${node}"`));
    assert.deepEqual(hits, [], `/${path}:\n  ${hits.join('\n  ')}`);
  });

  test(`/${path}: every figure says how and when it was measured, and shows the month`, () => {
    const html = read(path);
    const text = readableNodes(html, quoted).join(' ');
    for (const figure of figures(html)) {
      assert.ok(figure.method?.trim(), `/${path}: figure "${figure.text}" has no data-method`);
      assert.match(figure.date ?? '', DATE, `/${path}: figure "${figure.text}" has no ISO data-date`);
      const shown = month(figure.date, lang(path));
      assert.ok(text.includes(shown), `/${path}: figure "${figure.text}" is dated ${figure.date}, but "${shown}" is not on the page`);
    }
  });
}

function readSpend() {
  const file = join(site, 'src/data/cloud-spend.json');
  assert.ok(existsSync(file), `${file} not found: the spend has no data source`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

test('the cloud spend has one currency, and every provider says how and when it was measured', () => {
  const spend = readSpend();
  assert.match(spend.currency, /^[A-Z]{3}$/, 'cloud-spend.json needs an ISO 4217 `currency`');
  assert.match(spend.month, /^\d{4}-\d{2}$/, 'cloud-spend.json needs the `month` its figures belong to');
  assert.ok(spend.providers.length > 0, 'cloud-spend.json lists no provider');
  for (const provider of spend.providers) {
    assert.equal(provider.currency ?? spend.currency, spend.currency, `${provider.id} is in another currency`);
    assert.ok(Number.isFinite(provider.amount) && provider.amount >= 0, `${provider.id} has no amount`);
    assert.ok(['list-price', 'billed'].includes(provider.basis), `${provider.id}: basis is list-price or billed`);
    assert.ok(provider.method?.trim(), `${provider.id} has no method`);
    assert.match(provider.measured ?? '', DATE, `${provider.id} has no ISO \`measured\` date`);
  }
});

test('each page renders the spend total as the sum of the providers, in one currency', () => {
  const spend = readSpend();
  const cents = spend.providers.reduce((sum, provider) => sum + Math.round(provider.amount * 100), 0);
  for (const path of SPEND_PAGES) {
    const expected = new Intl.NumberFormat(lang(path), { style: 'currency', currency: spend.currency }).format(cents / 100);
    const shown = figures(read(path)).map((figure) => figure.text);
    assert.ok(shown.length > 0, `/${path} has no data-figure slot: the checks above would pass vacuously`);
    assert.ok(shown.includes(expected), `/${path} does not render the total ${expected}; it renders ${JSON.stringify(shown)}`);
  }
});
