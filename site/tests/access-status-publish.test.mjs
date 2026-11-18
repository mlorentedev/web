/**
 * The weekly access check opens a pull request with what it saw (WEB-173).
 *
 * `access-check.yml` measures from a GitHub runner, off the mesh, and uploads
 * the record. A second job turns the record into a pull request that changes
 * `site/src/data/access-status.json`, so the dates and states on `/lab` follow
 * the check. A pull request opened with `GITHUB_TOKEN` runs no CI, so that job
 * uses a token from web's own CI GitHub App (one App per trust boundary,
 * decided on the CI machine-identity ADR, 2026-11-16).
 *
 * These hold the boundary in place:
 * - the job that measures holds no credential and keeps `contents: read`: it
 *   reaches every host the check reads, so it never carries the App key;
 * - only the publishing job reads the App's secrets, and it never checks out or
 *   runs code from a pull request (the workflow has no pull_request trigger);
 * - the token is scoped to this repository and to contents and pull requests;
 * - the job commits that one file and nothing else.
 *
 * Text checks, as in `delivery-gate.test.mjs`: no YAML parser is a direct
 * dependency of `site/`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workflow = readFileSync(join(here, '..', '..', '.github', 'workflows', 'access-check.yml'), 'utf8');

/** The body of one job: from its key to the next job key or the end. */
function job(name) {
  const start = workflow.search(new RegExp(`^  ${name}:$`, 'm'));
  assert.ok(start >= 0, `access-check.yml has no "${name}" job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/^  [a-z][\w-]*:$/m);
  return next < 0 ? workflow.slice(start) : workflow.slice(start, start + 1 + next);
}

const SECRETS = /\$\{\{\s*secrets\.(\w+)/g;

test('the workflow runs on a schedule and on demand, never on a pull request', () => {
  const on = workflow.slice(workflow.search(/^on:$/m), workflow.search(/^permissions:$/m));
  assert.match(on, /^\s+schedule:$/m);
  assert.match(on, /^\s+workflow_dispatch:$/m);
  assert.doesNotMatch(on, /pull_request/);
  assert.match(workflow, /^permissions:\n\s+contents: read$/m, 'the default token stays read-only');
});

test('the measuring job holds no credential', () => {
  assert.deepEqual([...job('access').matchAll(SECRETS)].map((m) => m[1]), []);
});

test('only the publishing job reads the App, scoped to this repository, contents and pull requests', () => {
  const publish = job('publish');
  assert.deepEqual(
    [...new Set([...workflow.matchAll(SECRETS)].map((m) => m[1]))].sort(),
    ['WEB_CI_APP_CLIENT_ID', 'WEB_CI_APP_PRIVATE_KEY'],
    'the workflow reads a secret other than the App',
  );
  assert.deepEqual([...new Set([...publish.matchAll(SECRETS)].map((m) => m[1]))].sort(), ['WEB_CI_APP_CLIENT_ID', 'WEB_CI_APP_PRIVATE_KEY']);
  assert.match(publish, /uses: actions\/create-github-app-token@[0-9a-f]{40} # v\d/);
  assert.match(publish, /^\s+repositories: web$/m);
  assert.match(publish, /^\s+permission-contents: write$/m);
  assert.match(publish, /^\s+permission-pull-requests: write$/m);
  assert.doesNotMatch(publish, /permission-(?!contents|pull-requests)[\w-]+:/, 'the token asks for more than contents and pull requests');
});

test('a branch left without its pull request gets one, not a silent exit', () => {
  const publish = job('publish');
  assert.match(publish, /gh pr list --state open --head "\$branch"/, 'the rerun asks whether the pull request exists');
  assert.doesNotMatch(publish, /ls-remote[^\n]*\n[^\n]*exit 0/, 'a pushed branch is not proof that its pull request was opened');
});

test('the publishing job waits for the record and commits that one file', () => {
  const publish = job('publish');
  assert.match(publish, /^\s+needs: access$/m);
  assert.match(publish, /uses: actions\/download-artifact@[0-9a-f]{40} # v\d/);
  const adds = [...publish.matchAll(/git add (.+)$/gm)].map((m) => m[1].trim());
  assert.deepEqual(adds, ['site/src/data/access-status.json']);
  const pushes = [...publish.matchAll(/^.*\bgit\b.*\bpush\b.*$/gm)].map((m) => m[0]);
  assert.ok(pushes.length > 0, 'the job pushes nothing: the next check would pass vacuously');
  for (const push of pushes) assert.doesNotMatch(push, /\s(--force\S*|-f)(\s|$)|\s\+\S/, `the job rewrites a branch: ${push.trim()}`);
});
