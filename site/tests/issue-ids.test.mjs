/**
 * The issue-identifier guard (WEB-110).
 *
 * An `AREA-NNN` at the start of an issue title is cited as a stable name in
 * commits, PRs, lessons and the vault. Three of them once named two issues each
 * (WEB-078, WEB-079, WEB-084), because the next number is chosen by reading the
 * list, and two sessions reading it at once both take the same one. Nothing can
 * refuse that at filing time from inside this repository, so the check runs on
 * the issue event and says so on the issue that took a used identifier.
 *
 * The lettered children (`WEB-001e`, `WEB-002c`) are an older, deliberate
 * scheme: each letter is its own identifier. A check that flagged them would be
 * ignored, so they are asserted to pass.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { CLASH, OK, UNANSWERABLE, decide, idOf } from '../scripts/check-issue-ids.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '../scripts/check-issue-ids.mjs');

const issue = (number, title, extra = {}) => ({ number, title, state: 'open', ...extra });

// The real pair from 2026-08-25, as titled before the renumbering.
const listing = [
  issue(172, 'WEB-078: release v1.10.1 shipped a git tag with no image'),
  issue(175, 'WEB-078: five published figures have no method', { state: 'closed' }),
  issue(30, 'WEB-001e: lettered child'),
  issue(31, 'WEB-001: the epic'),
  issue(33, 'WEB-002c: Newsletter signup'),
  issue(96, 'BRAND-008: 90-day review'),
  issue(400, 'web: a title with no identifier'),
  // A pull request is an issue to the REST API; its title can carry the
  // identifier of the issue it closes, which is not a second claim on it.
  issue(401, 'WEB-001: fix the epic', { pull_request: { url: 'x' } }),
];

test('the identifier is the title prefix, letter included', () => {
  assert.equal(idOf('WEB-078: x'), 'WEB-078');
  assert.equal(idOf('WEB-001e: x'), 'WEB-001e');
  assert.equal(idOf('BRAND-008: x'), 'BRAND-008');
  assert.equal(idOf('web: no identifier'), null);
  assert.equal(idOf('Refs WEB-078 in passing'), null);
});

test('a second issue on a used identifier is a clash, closed or not', () => {
  const verdict = decide(listing, 172);
  assert.equal(verdict.code, CLASH);
  assert.equal(verdict.id, 'WEB-078');
  assert.deepEqual(verdict.others.map((i) => i.number), [175]);
});

test('lettered children are identifiers of their own', () => {
  for (const n of [30, 31, 33]) assert.equal(decide(listing, n).code, OK, `#${n}`);
});

test('a pull request carrying an identifier is not a second claim', () => {
  assert.equal(decide(listing, 31).code, OK);
});

test('an issue without an identifier passes', () => {
  assert.equal(decide(listing, 400).code, OK);
});

test('a listing that cannot be read is not a clean one', () => {
  assert.equal(decide({ message: 'Bad credentials' }, 172).code, UNANSWERABLE);
  assert.equal(decide([listing], 172).code, UNANSWERABLE, 'nested pages, not flattened');
  assert.equal(decide(listing, 999).code, UNANSWERABLE, 'the issue itself is missing');
});

test('the script exits with the verdict code and names the clash', () => {
  const run = (n) => {
    try {
      return { code: 0, out: execFileSync('node', [script, '--issue', String(n)], { input: JSON.stringify(listing), encoding: 'utf8' }) };
    } catch (e) {
      return { code: e.status, out: e.stdout };
    }
  };
  assert.equal(run(30).code, OK);
  const clash = run(172);
  assert.equal(clash.code, CLASH);
  assert.match(clash.out, /WEB-078/);
  assert.match(clash.out, /#175/);
});
