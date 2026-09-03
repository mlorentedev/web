/**
 * The release PR's closing-reference guard (WEB-103).
 *
 * `scripts/check-closing-refs.mjs` decides whether a release PR would close an
 * issue that is still open. The two headline cases are not synthetic: both
 * fixtures were captured from PR #184 on 2026-09-03, minutes apart, either side
 * of the one-line `closes` → `refs` edit. So the red case is a real payload that
 * really would have closed `#244`, and the green one is the same PR after the
 * fix — which is the "red before, green after" evidence WEB-103 asked for,
 * pinned in the repository rather than left in a session transcript.
 *
 * The rest of the file is about the third outcome. A guard that answers "clean"
 * when it could not read its input is worse than no guard, because it is
 * believed — the same shape as `lesson-019`. Every way the payload can be
 * unreadable is asserted to exit 2, distinct from both 0 and 1.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { BLOCKED, OK, UNANSWERABLE, decide, report } from '../scripts/check-closing-refs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '../scripts/check-closing-refs.mjs');
const fixture = (name) => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));

const blocked = fixture('closing-refs-blocked.json');
const clean = fixture('closing-refs-clean.json');

/**
 * The fixtures carry the whole point of this file, so their content is asserted
 * before anything is concluded from them. Without this, emptying either one
 * would leave every test below passing and checking nothing.
 */
test('the fixtures are what the tests below assume', () => {
  const nodesOf = (p) => p.data.repository.pullRequest.closingIssuesReferences.nodes;

  const open = nodesOf(blocked).filter((n) => n.state === 'OPEN');
  assert.equal(open.length, 1, 'the blocked fixture must carry exactly one OPEN node');
  assert.equal(open[0].number, 244, 'and it must be #244, the issue that was really at risk');
  assert.ok(nodesOf(blocked).length > 1, 'with closed nodes beside it, so the filter is doing work');

  assert.ok(nodesOf(clean).length > 0, 'the clean fixture must not be empty');
  assert.ok(
    nodesOf(clean).every((n) => n.state === 'CLOSED'),
    'and every node in it must be CLOSED',
  );
});

test('the real pre-edit payload is refused, naming the issue', () => {
  const verdict = decide(blocked);
  assert.equal(verdict.code, BLOCKED);
  assert.deepEqual(
    verdict.open.map((n) => n.number),
    [244],
  );
  assert.equal(verdict.total, 5);

  const text = report(verdict).join('\n');
  assert.match(text, /#244/, 'the operator has to be told which issue');
  assert.match(text, /closes/, 'and what to change');
});

test('the real post-edit payload passes, having checked something', () => {
  const verdict = decide(clean);
  assert.equal(verdict.code, OK);
  assert.equal(verdict.open.length, 0);
  assert.ok(verdict.total > 0, 'a pass over zero references would prove nothing');
  assert.match(report(verdict).join('\n'), new RegExp(`Checked ${verdict.total} `));
});

test('a release PR that closes nothing passes', () => {
  const verdict = decide({ data: { repository: { pullRequest: { closingIssuesReferences: { nodes: [] } } } } });
  assert.equal(verdict.code, OK, 'an empty list is a real answer, not a failure');
  assert.equal(verdict.total, 0);
});

test('state is compared case-insensitively', () => {
  const verdict = decide({
    data: { repository: { pullRequest: { closingIssuesReferences: { nodes: [{ number: 1, state: 'open' }] } } } },
  });
  assert.equal(verdict.code, BLOCKED, 'a lowercased state must not slip through as closed');
});

for (const [name, payload] of [
  ['a payload that is not an object', 'not json at all'],
  ['a null payload', null],
  ['a response carrying GraphQL errors', { errors: [{ message: 'Field does not exist' }], data: null }],
  ['a missing pullRequest', { data: { repository: {} } }],
  ['a missing nodes array', { data: { repository: { pullRequest: { closingIssuesReferences: {} } } } }],
  [
    'nodes that is not an array',
    { data: { repository: { pullRequest: { closingIssuesReferences: { nodes: 'lots' } } } } },
  ],
  [
    'a node with no readable state',
    { data: { repository: { pullRequest: { closingIssuesReferences: { nodes: [{ number: 7 }] } } } } },
  ],
]) {
  test(`${name} is unanswerable, not clean`, () => {
    const verdict = decide(payload);
    assert.equal(verdict.code, UNANSWERABLE, `${name} must not read as a pass`);
    assert.notEqual(verdict.code, OK);
    assert.match(report(verdict).join('\n'), /::error::/, 'and it has to surface in the log');
  });
}

/**
 * The exit codes are the whole interface with the workflow — `decide` returning
 * the right number is not enough if the process does not exit with it.
 */
const run = (file, ...flags) => {
  const args = [script, '--file', join(here, 'fixtures', file), ...flags];
  try {
    const stdout = execFileSync(process.execPath, args, { encoding: 'utf8' });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return { code: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
};

test('the process exits 0 on the clean payload', () => {
  assert.equal(run('closing-refs-clean.json').code, OK);
});

test('the process exits 1 on the blocked payload, and says why on stderr', () => {
  const { code, stderr } = run('closing-refs-blocked.json');
  assert.equal(code, BLOCKED);
  assert.match(stderr, /#244/);
});

/**
 * Advisory mode is what keeps the query itself exercised on ordinary PRs. It has
 * to soften exactly one thing — an open reference — and nothing else, or the
 * continuous check stops checking.
 */
test('--advisory reports an open reference without blocking', () => {
  const { code, stdout } = run('closing-refs-blocked.json', '--advisory');
  assert.equal(code, OK, 'an ordinary PR closing an open issue is the intended case');
  assert.match(stdout, /::notice::/, 'reported as a notice, not an error');
  assert.match(stdout, /#244/, 'and it still names what it found');
  assert.doesNotMatch(stdout, /::error::/);
});

test('--advisory does NOT soften an unreadable answer', () => {
  // The whole reason advisory mode runs on every PR is to catch a broken query
  // or a token without `issues: read`. Softening this would defeat it.
  let status;
  try {
    execFileSync(process.execPath, [script, '--advisory', '--file', join(here, 'fixtures', 'nope.json')], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    status = 0;
  } catch (err) {
    status = err.status;
  }
  assert.equal(status, UNANSWERABLE);
});

test('the process exits 2 when it cannot read its input', () => {
  let status;
  try {
    execFileSync(process.execPath, [script, '--file', join(here, 'fixtures', 'no-such-file.json')], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    status = 0;
  } catch (err) {
    status = err.status;
  }
  assert.equal(status, UNANSWERABLE);
});
