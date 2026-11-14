/**
 * The Lab's figures as stat tiles (WEB-172, ADR-060).
 *
 * ADR-060 gives `/lab` one platform idiom for its figures: a tile with a large
 * mono number and its unit, built from the data, with no new figure. Its
 * Consequences ask for a test tying each drawn number to the file that sources
 * it, as `career-loop.test.mjs` does for the loop. This is that test.
 *
 * The counts are recomputed here from `platform.json` with the rule
 * `data/platform.ts` states (a `standby` node is a reserve, not a machine), and
 * the spend from `cloud-spend.json`. A tile that kept its number while the data
 * changed would fail.
 *
 * Reads the built site: `npm run build && npm test`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(siteRoot, p), 'utf8'));

const platform = read('src/data/platform.json');
const spend = read('src/data/cloud-spend.json');
const machines = platform.nodes.filter((n) => n.status !== 'standby');
const expected = {
  machines: machines.length,
  k8s: machines.filter((n) => n.runtime === 'k3s').length,
  reserve: platform.nodes.length - machines.length,
};
const total = spend.providers.reduce((sum, p) => sum + p.amount, 0);

/** Every tile on a page: its key, the number it draws and the text around it. */
const tiles = (html) =>
  [...html.matchAll(/<li[^>]*data-stat-tile="([\w-]+)"[^>]*>([\s\S]*?)<\/li>/g)].map(([, key, inner]) => ({
    key,
    // The value can hold markup of its own (the spend is a `data-figure` span),
    // so it is read as text up to the unit.
    value: /data-stat-value[^>]*>([\s\S]*?)<[^>]*data-stat-unit/.exec(inner)?.[1].replace(/<[^>]+>/g, '').trim(),
    text: inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  }));

for (const [built, lang] of [['lab/index.html', 'en'], ['es/lab/index.html', 'es']]) {
  const file = join(siteRoot, 'dist', built);

  test(`dist/${built}: the fleet tiles draw the counts platform.json gives`, () => {
    assert.ok(existsSync(file), `dist/${built} must exist: run the build first`);
    const drawn = Object.fromEntries(tiles(readFileSync(file, 'utf8')).map((t) => [t.key, t]));
    for (const [key, n] of Object.entries(expected)) {
      assert.ok(drawn[key], `no "${key}" tile`);
      assert.equal(drawn[key].value, String(n), `the "${key}" tile`);
      assert.match(drawn[key].text, /\p{L}/u, `the "${key}" tile has no unit word`);
    }
  });

  test(`dist/${built}: the spend tile draws the sum of cloud-spend.json`, () => {
    const tile = tiles(readFileSync(file, 'utf8')).find((t) => t.key === 'spend');
    assert.ok(tile, 'no spend tile');
    const digits = (s) => s.replace(/[^\d]/g, '');
    const want = new Intl.NumberFormat(lang, { style: 'currency', currency: spend.currency }).format(total);
    assert.equal(digits(tile.value), digits(want), `drawn ${tile.value}, cloud-spend.json sums to ${want}`);
  });
}
