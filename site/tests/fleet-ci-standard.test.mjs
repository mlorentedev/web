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

/**
 * The step that holds line `at`, as text: from its `- ` line to the next step
 * or a shallower key. A checkout can be the step's first key (`- uses:`) or
 * follow its name (`- name: …` then `uses:`), so the step is found by walking
 * up to the dash.
 */
const stepAround = (lines, at) => {
  const usesIndent = lines[at].search(/\S/);
  let start = at;
  while (start >= 0 && !(/^\s*- /.test(lines[start]) && lines[start].indexOf('-') < usesIndent)) start--;
  if (/^\s*- /.test(lines[at])) start = at;
  const dash = lines[start].indexOf('-');
  const body = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (line.search(/\S/) <= dash) break;
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
  const count = files.reduce((n, f) => n + (read(f).match(/^\s*(-\s+)?uses: actions\/checkout@/gm) ?? []).length, 0);
  assert.ok(count >= 6, `found only ${count} checkouts`);
});

for (const file of files) {
  test(`${file}: every checkout sets persist-credentials: false`, () => {
    const lines = read(file).split('\n');
    const kept = lines
      .map((line, i) => [line, i])
      .filter(([line]) => /^\s*(-\s+)?uses: actions\/checkout@/.test(line))
      .filter(([, i]) => !/^\s+persist-credentials: false\s*$/m.test(stepAround(lines, i)))
      .map(([, i]) => `line ${i + 1}`);
    assert.deepEqual(kept, [], 'checkouts that leave the token in .git/config');
  });
}

/**
 * Whether a new commit on a pull request starts this workflow again. A trigger
 * that lists its types and leaves out `synchronize` (add-to-project fires on
 * opened and reopened only) never has a stale run to cancel. The types are read
 * inside the `pull_request:` block only, and the one-line forms
 * (`on: pull_request`, `on: [push, pull_request]`) take every type.
 */
const rerunsOnPush = (on) => {
  const inline = on.split('\n')[0].replace(/^on:\s*/, '');
  if (inline) return /\bpull_request\b(?!_)/.test(inline);
  const lines = on.split('\n');
  const at = lines.findIndex((l) => /^ {2}pull_request:/.test(l));
  if (at === -1) return false;
  const block = [];
  for (const line of lines.slice(at + 1)) {
    if (/^ {0,2}\S/.test(line)) break;
    block.push(line);
  }
  const types = block.find((l) => /^ {4}types:/.test(l));
  return types === undefined || /\bsynchronize\b/.test(types);
};

test('a workflow fired only when a pull request opens is not one that reruns', () => {
  assert.equal(rerunsOnPush('on:\n  pull_request:\n    types: [opened, reopened]'), false);
  assert.equal(rerunsOnPush('on:\n  pull_request:\n'), true);
  assert.equal(rerunsOnPush('on:\n  pull_request:\n    types: [opened, synchronize]'), true);
  // A later trigger's types are not the pull request's.
  assert.equal(rerunsOnPush('on:\n  pull_request:\n  release:\n    types: [published]'), true);
  assert.equal(rerunsOnPush('on: [push, pull_request]'), true);
  assert.equal(rerunsOnPush('on: pull_request'), true);
  assert.equal(rerunsOnPush('on: [push, pull_request_target]'), false);
});

test('a checkout named before its uses: is still inspected', () => {
  const lines = ['    steps:', '      - name: Check out', '        uses: actions/checkout@abc # v7', '      - run: true'];
  assert.doesNotMatch(stepAround(lines, 2), /persist-credentials/);
  const ok = ['      - name: Check out', '        uses: actions/checkout@abc # v7', '        with:', '          persist-credentials: false', '      - run: true'];
  assert.match(stepAround(ok, 1), /persist-credentials: false/);
  assert.doesNotMatch(stepAround(ok, 1), /run: true/);
});

for (const file of files) {
  const text = read(file);
  if (!rerunsOnPush(topBlock(text, 'on'))) continue;
  test(`${file}: a pull-request workflow cancels its stale runs`, () => {
    const concurrency = topBlock(text, 'concurrency');
    assert.match(concurrency, /^\s+cancel-in-progress: true\s*$/m, 'no top-level concurrency with cancel-in-progress: true');
  });
}
