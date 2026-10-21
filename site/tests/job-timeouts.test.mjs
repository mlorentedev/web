/**
 * Every workflow job states its own ceiling (WEB-074).
 *
 * A job without `timeout-minutes` inherits GitHub's six-hour limit. That is how
 * the v1.10.1 release run spent six hours on a stalled build and then took
 * `promote-prod` down with it (#163). The values are sized per job in each
 * workflow, next to the runtime they were measured from; this file only keeps
 * the next new job from shipping without one.
 *
 * A job that calls a reusable workflow (`uses:`) is exempt: GitHub does not
 * accept `timeout-minutes` there, and the called workflow's jobs carry it.
 *
 * Read as text, like `delivery-gate.test.mjs` and for the same reason: no YAML
 * parser is a direct dependency of `site/`.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../.github/workflows');
const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));

/** Each job under `jobs:` as [name, body]. */
const jobs = (text) => {
  const lines = text.split('\n');
  const from = lines.indexOf('jobs:');
  if (from === -1) return [];
  const out = [];
  for (const line of lines.slice(from + 1)) {
    if (/^[^\s#]/.test(line)) break;
    const key = line.match(/^ {2}([A-Za-z0-9_-]+):\s*(#.*)?$/);
    if (key) out.push([key[1], []]);
    else if (out.length) out.at(-1)[1].push(line);
  }
  return out.map(([name, body]) => [name, body.join('\n')]);
};

for (const file of files) {
  // A job id the parser misses folds its body into the previous job, where its
  // `timeout-minutes` would hide the gap. Every job has exactly one `runs-on:`
  // or `uses:`, so the count of those must equal the count of jobs found.
  test(`${file}: every job is parsed as its own job`, () => {
    const found = jobs(readFileSync(join(dir, file), 'utf8'));
    const executors = found.map(([, body]) => (body.match(/^ {4}(runs-on|uses):/gm) ?? []).length);
    assert.deepEqual(executors, found.map(() => 1), `jobs: ${found.map(([n]) => n).join(', ')}`);
  });
}

test('the parser finds the jobs these workflows declare', () => {
  const release = jobs(readFileSync(join(dir, 'release.yml'), 'utf8')).map(([n]) => n);
  assert.deepEqual(release, ['release-please', 'meta', 'test', 'build', 'test-image', 'dispatch-staging', 'promote-prod']);
});

for (const file of files) {
  test(`${file}: every job that runs steps declares timeout-minutes`, () => {
    const missing = jobs(readFileSync(join(dir, file), 'utf8'))
      .filter(([, body]) => !/^ {4}uses:/m.test(body))
      .filter(([, body]) => !/^ {4}timeout-minutes:\s*\d+\s*$/m.test(body))
      .map(([name]) => name);
    assert.deepEqual(missing, [], `jobs without timeout-minutes, so they inherit the 6 h ceiling: ${missing.join(', ')}`);
  });
}
