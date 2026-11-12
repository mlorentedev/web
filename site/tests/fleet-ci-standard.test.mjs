/**
 * The workflows meet two rules of the fleet CI standard that
 * mlorentedev/ci-workflows sets and `dotf lint fleet` checks.
 *
 * - `actions/checkout` writes the job token into `.git/config` unless told
 *   not to, and every later step can then read it. No job here pushes with
 *   git, so every checkout sets `persist-credentials: false`.
 * - A pull-request workflow cancels its stale run when a new commit lands, so
 *   a run nobody will read stops holding a runner slot.
 *
 * `dotf lint fleet` is not installed on the runners, so this test keeps the
 * two rules in the suite. Read as text, like `job-timeouts.test.mjs`.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../.github/workflows');
const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
const read = (file) => readFileSync(join(dir, file), 'utf8');

/** The lines of a step that starts at `start`, up to the next step or a shallower key. */
const stepBody = (lines, start) => {
  const indent = lines[start].indexOf('-');
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const at = line.search(/\S/);
    if (at <= indent) break;
    body.push(line);
  }
  return body.join('\n');
};

/** The top-level block under `key:`, as text. */
const topBlock = (text, key) => {
  const lines = text.split('\n');
  const from = lines.findIndex((l) => l === `${key}:` || l.startsWith(`${key}: `));
  if (from === -1) return '';
  const out = [lines[from]];
  for (const line of lines.slice(from + 1)) {
    if (/^[^\s#]/.test(line)) break;
    out.push(line);
  }
  return out.join('\n');
};

test('the checks below find checkouts to inspect', () => {
  const count = files.reduce((n, f) => n + (read(f).match(/uses: actions\/checkout@/g) ?? []).length, 0);
  assert.ok(count >= 6, `found only ${count} checkouts`);
});

for (const file of files) {
  test(`${file}: every checkout sets persist-credentials: false`, () => {
    const lines = read(file).split('\n');
    const kept = lines
      .map((line, i) => [line, i])
      .filter(([line]) => /^\s*-\s+uses: actions\/checkout@/.test(line))
      .filter(([, i]) => !/^\s+persist-credentials: false\s*$/m.test(stepBody(lines, i)))
      .map(([, i]) => `line ${i + 1}`);
    assert.deepEqual(kept, [], 'checkouts that leave the token in .git/config');
  });
}

/**
 * Whether a new commit on a pull request starts this workflow again. A trigger
 * that lists its types and leaves out `synchronize` (add-to-project fires on
 * opened and reopened only) never has a stale run to cancel.
 */
const rerunsOnPush = (on) => {
  const at = on.search(/^ {2}pull_request:/m);
  if (at === -1) return false;
  const types = on.slice(at).split('\n').slice(1).find((l) => /^ {4}types:/.test(l));
  return types === undefined || /\bsynchronize\b/.test(types);
};

test('a workflow fired only when a pull request opens is not one that reruns', () => {
  assert.equal(rerunsOnPush('on:\n  pull_request:\n    types: [opened, reopened]'), false);
  assert.equal(rerunsOnPush('on:\n  pull_request:\n'), true);
  assert.equal(rerunsOnPush('on:\n  pull_request:\n    types: [opened, synchronize]'), true);
});

for (const file of files) {
  const text = read(file);
  if (!rerunsOnPush(topBlock(text, 'on'))) continue;
  test(`${file}: a pull-request workflow cancels its stale runs`, () => {
    const concurrency = topBlock(text, 'concurrency');
    assert.match(concurrency, /^\s+cancel-in-progress: true\s*$/m, 'no top-level concurrency with cancel-in-progress: true');
  });
}
