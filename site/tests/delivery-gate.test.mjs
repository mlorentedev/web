/**
 * The suite gates the image production ships (#343).
 *
 * Until #343 the tests ran on pull requests only. With `strict: false` a PR may
 * merge against a stale base, so the merge commit — the one `release.yml`
 * builds into `sha-<short>`, dispatches to staging and later re-tags for prod
 * by digest (ADR-055) — had never had a test run against it. Every job was
 * green because none that could be red was asked.
 *
 * The fix is structural, so this file asserts the structure: which jobs call
 * the suite, and which jobs cannot start until it passes. It was verified once
 * by mutation (a deliberately failing test on a dispatched run, `build`
 * skipped, no image published); this is what keeps that true after the next
 * edit to a workflow, which the one-off run cannot do.
 *
 * The workflows are read as text. No YAML parser is a direct dependency of
 * `site/`, and importing a transitive one would make this guard's green depend
 * on a lockfile it does not own. The helpers below understand exactly the
 * shapes these files use, and the first test fails if that stops being true.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const workflow = (name) => readFileSync(join(root, '.github/workflows', name), 'utf8');

const SUITE = './.github/workflows/test.yml';

/** The body of top-level job `name`: every line up to the next job or EOF. */
const job = (text, name) => {
  const lines = text.split('\n');
  const start = lines.indexOf(`  ${name}:`);
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^ {2}[A-Za-z0-9_-]+:\s*$/.test(l) || /^\S/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
};

/** `needs: x` or `needs: [x, y]`, as a list. Empty when the job has none. */
const needsOf = (body) => {
  const m = body.match(/^ {4}needs:\s*(.+)$/m);
  if (!m) return [];
  return m[1]
    .replace(/[[\]]/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const usesOf = (body) => body.match(/^ {4}uses:\s*(\S+)\s*$/m)?.[1];

/** Every job transitively required before `name` may start. */
const upstream = (text, name, seen = new Set()) => {
  for (const dep of needsOf(job(text, name) ?? '')) {
    if (!seen.has(dep)) {
      seen.add(dep);
      upstream(text, dep, seen);
    }
  }
  return seen;
};

const release = workflow('release.yml');
const validation = workflow('pr-validation.yml');
const suite = workflow('test.yml');

test('the helpers read these workflows the way the assertions assume', () => {
  // If a job moved or the `needs` syntax changed shape, every assertion below
  // could pass against an empty string. Pin what they read first.
  for (const [file, text, jobs] of [
    ['release.yml', release, ['release-please', 'meta', 'test', 'build', 'dispatch-staging', 'promote-prod']],
    ['pr-validation.yml', validation, ['test', 'validate', 'closing-refs', 'gate']],
  ]) {
    for (const name of jobs) {
      assert.ok(job(text, name), `${file} has no job \`${name}\` — the helpers are reading the wrong shape`);
    }
  }
  assert.deepEqual(needsOf(job(release, 'promote-prod')), ['release-please', 'meta', 'build']);
  assert.ok(!job(release, 'test').includes('build:'), 'a job body must stop at the next job');
});

test('the suite is defined once, and both the PR and the master push call it', () => {
  assert.match(suite, /^ {2}workflow_call:\s*$/m, 'test.yml must be callable');
  assert.equal(usesOf(job(release, 'test')), SUITE, 'release.yml must run the shared suite');
  assert.equal(usesOf(job(validation, 'test')), SUITE, 'pr-validation.yml must run the shared suite');
});

test('nothing that ships can start before the suite passes', () => {
  // `build` is the direct edge. The other two are asserted transitively,
  // because what matters is that no path to staging or prod skips the suite,
  // not which job happens to carry the edge.
  for (const shipper of ['build', 'dispatch-staging', 'promote-prod']) {
    assert.ok(
      upstream(release, shipper).has('test'),
      `\`${shipper}\` can run without \`test\` having passed — a red suite would still ship (#343)`,
    );
  }
});

test('the PR gate still requires the suite', () => {
  assert.ok(needsOf(job(validation, 'gate')).includes('test'), '`PR gate` must list `test` in `needs`');
});

test('every test script in package.json runs in the shared suite', () => {
  // #343 AC4. `npm test` alone does not run the browser or a11y suites, so a
  // script added to package.json and not to test.yml would pass locally, pass
  // CI, and check nothing. `test:audit` is the one deliberate exclusion: it is
  // `lab-audit.test.mjs`, which `npm test`'s glob already runs.
  const { scripts } = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8'));
  const excluded = new Set(['test:audit']);
  assert.match(scripts['test:audit'], /tests\/lab-audit\.test\.mjs$/, 'test:audit is excluded only while npm test covers it');

  const expected = Object.keys(scripts).filter((s) => /^test(:|$)/.test(s) && !excluded.has(s));
  assert.ok(expected.length >= 3, 'expected at least test, test:browser and test:a11y');
  for (const script of expected) {
    const run = script === 'test' ? 'npm test' : `npm run ${script}`;
    assert.match(
      suite,
      new RegExp(`^ +run: ${run.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'),
      `test.yml never runs \`${run}\``,
    );
  }
});
