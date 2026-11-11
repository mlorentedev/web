/**
 * The /ai review ledger (#593) counts what the pinned triage comments say.
 *
 *   npm run build && npm test
 *
 * The expected rows below were read by hand from the comments in
 * `src/data/review-triage.json`; a change to the counting rule or to the
 * pinned comments that moves any number fails here. Regenerating the JSON
 * means re-reading the new comments and updating this table with them.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { cells, classify, ledgerRow, reviewerRows } from '../src/lib/review-ledger.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const triage = JSON.parse(readFileSync(join(siteRoot, 'src/data/review-triage.json'), 'utf8'));

/** [pr, reviewed by, applied, declined], read from the comments. */
const EXPECTED = [
  [640, ['PR-Agent'], 2, 3],
  [634, ['PR-Agent'], 0, 2],
  [633, ['PR-Agent'], 1, 2],
  [632, ['PR-Agent'], 1, 2],
  [631, ['PR-Agent'], 1, 1],
  [630, ['PR-Agent', 'CodeRabbit'], 1, 1],
  [629, ['PR-Agent', 'CodeRabbit'], 1, 0],
  [628, ['PR-Agent'], 0, 0],
  [627, ['PR-Agent'], 0, 0],
  [626, ['PR-Agent'], 0, 1],
];

test('a disposition counts only when it decides a finding', () => {
  assert.equal(classify('**Applied** in `a838d3d`.'), 'applied');
  assert.equal(classify('apply'), 'applied');
  assert.equal(classify('skip'), 'declined');
  assert.equal(classify('declined, with the claim corrected'), 'declined');
  assert.equal(classify('no change needed: branch protection'), 'declined');
  for (const other of ['none needed', 'noted', 'resolved', 'not reviewed', 'declared: the last review']) {
    assert.equal(classify(other), null, other);
  }
});

test('reviewer rows are found by the Disposition column, whatever the table shape', () => {
  const body = '## Review triage\n\n| Source | Finding | Disposition |\n|---|---|---|\n| CI | green | none needed |\n| PR-Agent | x | applied |\n';
  assert.deepEqual(reviewerRows(body), [{ reviewer: 'PR-Agent', disposition: 'applied' }]);
});

test('a pipe inside inline code or escaped does not split a cell', () => {
  assert.deepEqual(cells('| PR-Agent | `a | b` and a\\|b | skip |'), ['PR-Agent', '`a | b` and a|b', 'skip']);
});

test('a table without its separator line fails loudly instead of miscounting', () => {
  assert.throws(() => reviewerRows('| Reviewer | Disposition |\n| PR-Agent | applied |\n'), /separator/);
});

test('every pinned comment is a triage comment from a merged pull request of this repo', () => {
  assert.equal(triage.repo, 'mlorentedev/web');
  for (const pull of triage.pulls) {
    assert.ok(pull.comments.length > 0, `#${pull.number} has no triage comment`);
    for (const c of pull.comments) {
      assert.match(c.body, /^## Review triage/);
      assert.equal(c.url, `https://github.com/mlorentedev/web/pull/${pull.number}#issuecomment-${c.id}`);
    }
  }
});

test('the ledger matches the counts read by hand from the comments', () => {
  const rows = triage.pulls.map(ledgerRow).map((r) => [r.number, r.reviewedBy, r.applied, r.declined]);
  assert.deepEqual(rows, EXPECTED);
});

for (const path of ['ai', 'es/ai']) {
  const file = join(siteRoot, 'dist', path, 'index.html');
  test(`/${path} renders one ledger row per pull request, linked to its triage`, { skip: !existsSync(file) }, () => {
    const html = readFileSync(file, 'utf8');
    const table = html.match(/<table data-review-ledger[\s\S]*?<\/table>/)?.[0];
    assert.ok(table, 'no ledger table');
    const prs = [...table.matchAll(/<tr data-pr="(\d+)"/g)].map((m) => Number(m[1]));
    assert.deepEqual(prs, EXPECTED.map(([n]) => n));
    for (const pull of triage.pulls) {
      assert.ok(table.includes(pull.comments.at(-1).url), `#${pull.number}: triage link missing`);
    }
  });
}
