/**
 * The Lab's changelog (#592), generated from kubelab: every pinned row in
 * `src/data/lab-changelog.json` is a real day, one kubelab PR and a title the
 * filter accepts; one row per day, newest first; and both locales render exactly the
 * rows, titles verbatim and kept from translation.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const pinned = JSON.parse(readFileSync(join(site, 'src/data/lab-changelog.json'), 'utf8'));
const { rows } = pinned;

// The filter the fetch script applies, restated: a `feat(<scope>): ` title
// whose scope is not spec, docs or staging.
const ACCEPTED = /^feat\((?!(?:spec|docs|staging)\))[a-z0-9-]+\): /;

test('the pinned file holds twelve rows from kubelab, with the filter it was fetched with', () => {
  assert.equal(pinned.repo, 'mlorentedev/kubelab');
  assert.equal(rows.length, 12);
  assert.match(pinned.fetchedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.ok(readFileSync(join(site, 'scripts/fetch-lab-changelog.sh'), 'utf8').includes(pinned.filter),
    'the pinned filter is not the one the fetch script applies');
});

test('every row is a real day, one PR and an accepted title, newest first, no PR or day twice', () => {
  for (const row of rows) {
    assert.equal(new Date(`${row.date}T00:00:00Z`).toISOString().slice(0, 10), row.date, `${row.date} is not a day`);
    assert.ok(Number.isInteger(row.pr) && row.pr > 0, `row ${row.date} has no PR number`);
    assert.match(row.title, ACCEPTED, `kubelab#${row.pr} is not a feature title the filter accepts`);
  }
  assert.deepEqual(rows.map((r) => r.date), rows.map((r) => r.date).toSorted().reverse(), 'rows are not newest first');
  assert.equal(new Set(rows.map((r) => r.pr)).size, rows.length, 'a PR appears twice');
  assert.equal(new Set(rows.map((r) => r.date)).size, rows.length, 'a day appears twice');
});

test('the filter keeps a feature and drops specs, docs, deploys and other types', () => {
  assert.match('feat(api): count the days', ACCEPTED);
  for (const title of ['feat(spec): archive X', 'feat(docs): y', 'feat(staging): z', 'chore(staging): deploy web sha-1', 'fix(api): w']) {
    assert.doesNotMatch(title, ACCEPTED, title);
  }
});

/** Decode the entities Astro writes in text. */
const text = (html) => html.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

for (const page of ['lab', 'es/lab']) {
  test(`/${page}/ renders each row's title verbatim, linked to its PR, outside translation`, () => {
    const file = join(site, 'dist', page, 'index.html');
    assert.ok(existsSync(file), 'run the build first');
    const block = readFileSync(file, 'utf8').match(/<section[^>]*data-lab-changelog[\s\S]*?<\/section>/)?.[0];
    assert.ok(block, 'no changelog section');
    assert.match(block, /<ol[^>]*translate="no"/, 'the titles are not kept from translation');
    const hrefs = [...block.matchAll(/href="([^"]+)"/g)].map(([, h]) => h);
    assert.deepEqual(hrefs, rows.map((r) => `https://github.com/mlorentedev/kubelab/pull/${r.pr}`));
    for (const row of rows) assert.ok(text(block).includes(row.title), `kubelab#${row.pr}'s title is not shown verbatim`);
  });
}
