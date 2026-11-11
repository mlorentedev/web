/**
 * The Lab's changelog (#592): every row in `src/data/lab-changelog.ts` is a
 * real date, names one kubelab pull request, and carries both locales; rows run
 * newest first; and the page renders exactly the rows, or no section at all.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(site, 'src/data/lab-changelog.ts'), 'utf8');
const start = source.search(/labChangelog:\s*LabChange\[\]\s*=\s*\[/);
assert.notEqual(start, -1, 'labChangelog declaration not found in lab-changelog.ts');
const list = source.slice(start);
const rows = [...list.matchAll(/\{([\s\S]*?)\}/g)].map(([, body]) => ({
  date: body.match(/date:\s*'([^']*)'/)?.[1],
  pr: Number(body.match(/pr:\s*(\d+)/)?.[1]),
  summary: body.match(/summary:\s*(['"`])([\s\S]*?)\1/)?.[2],
  summaryEs: body.match(/summaryEs:\s*(['"`])([\s\S]*?)\1/)?.[2],
}));

test('every row is a real date, one kubelab PR and both locales, newest first', () => {
  // A parse that lost rows would make every check below vacuous (#631 review).
  assert.equal(rows.length, (list.match(/\bdate:/g) ?? []).length, 'rows were lost in parsing: keep summaries free of { and }');
  for (const row of rows) {
    assert.match(row.date ?? '', /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(`${row.date}T00:00:00Z`).toISOString().slice(0, 10), row.date, `${row.date} is not a day`);
    assert.ok(Number.isInteger(row.pr) && row.pr > 0, `row ${row.date} has no PR number`);
    assert.ok(row.summary?.trim() && row.summaryEs?.trim(), `row ${row.date} lacks a summary in a locale`);
  }
  assert.deepEqual(rows.map((r) => r.date), rows.map((r) => r.date).toSorted().reverse(), 'rows are not newest first');
  assert.equal(new Set(rows.map((r) => r.pr)).size, rows.length, 'a PR appears twice');
});

for (const page of ['lab', 'es/lab']) {
  test(`/${page}/ renders one entry per row, linked to its kubelab PR, or no section`, () => {
    const file = join(site, 'dist', page, 'index.html');
    assert.ok(existsSync(file), 'run the build first');
    const block = readFileSync(file, 'utf8').match(/<section[^>]*data-lab-changelog[\s\S]*?<\/section>/)?.[0];
    if (rows.length === 0) return assert.equal(block, undefined, 'an empty changelog renders a section');
    const hrefs = [...block.matchAll(/href="([^"]+)"/g)].map(([, h]) => h);
    assert.deepEqual(hrefs, rows.map((r) => `https://github.com/mlorentedev/kubelab/pull/${r.pr}`));
  });
}
