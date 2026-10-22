/**
 * The release gate fails on an absent answer instead of reading it as "no
 * release" (WEB-117, `#344`).
 *
 * `release.yml` decides whether a push cut a release from release-please's
 * outputs. The inline gate it replaced defaulted a missing key to "false", so
 * a third rename of those outputs would have skipped `promote-prod` with every
 * job green: a tag with no image, which is `#172` by another route. These tests
 * run `scripts/release-gate.sh` on the shapes release-please actually emitted
 * (copied from this repo's runs on 2026-10-21), and on mutations of them that
 * stand in for that rename.
 *
 * `RELEASE_PLEASE_PAT` gets the same treatment. A missing PAT used to fall back
 * to `GITHUB_TOKEN`, which opens the release PR with no checks, so the only
 * symptom was checks that never appeared. Its step is executed here with the
 * secret present and absent, rather than only read.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const gate = join(root, 'scripts/release-gate.sh');
const workflow = readFileSync(join(root, '.github/workflows/release.yml'), 'utf8');

/** Run the gate on `outputs`; return its exit code, the GITHUB_OUTPUT lines it wrote, and stdout. */
const run = (outputs) => {
  const env = { ...process.env, OUTPUTS: JSON.stringify(outputs) };
  delete env.GITHUB_OUTPUT; // the gate then writes its outputs to stdout
  const r = spawnSync('bash', [gate], { env, encoding: 'utf8' });
  return { code: r.status, out: r.stdout };
};

// Measured: the push of 9c868c4 (no release; it opened the release PR).
const noRelease = {
  releases_created: 'false',
  paths_released: '[]',
  prs_created: 'true',
};

// Measured: the push of 661a205, which released v1.16.1 (simple mode).
const release = {
  releases_created: 'true',
  release_created: 'true',
  tag_name: 'v1.16.1',
  version: '1.16.1',
  paths_released: '["."]',
  prs_created: 'false',
};

test('a push without a release passes and says so', () => {
  const r = run(noRelease);
  assert.equal(r.code, 0);
  assert.match(r.out, /^created=false$/m);
  assert.match(r.out, /^version=$/m);
});

test('a release in simple mode passes with its version', () => {
  const r = run(release);
  assert.equal(r.code, 0);
  assert.match(r.out, /^created=true$/m);
  assert.match(r.out, /^version=1\.16\.1$/m);
});

test('a release in manifest mode, keyed by path, passes with its version', () => {
  const { release_created, version, ...rest } = release;
  const r = run({ ...rest, '.--release_created': release_created, '.--version': version });
  assert.equal(r.code, 0);
  assert.match(r.out, /^version=1\.16\.1$/m);
});

test('releases_created renamed away fails, on a push with or without a release', () => {
  for (const shape of [noRelease, release]) {
    const { releases_created, ...renamed } = shape;
    const r = run({ ...renamed, releases_were_created: releases_created });
    assert.equal(r.code, 1, `this must not read as "no release": ${JSON.stringify(renamed)}`);
    assert.match(r.out, /releases_created is 'absent'/);
  }
});

test('a release whose per-release flag was renamed fails rather than skipping promote-prod', () => {
  const { release_created, ...renamed } = release;
  const r = run({ ...renamed, created: release_created });
  assert.equal(r.code, 1);
  assert.match(r.out, /neither release_created nor \.--release_created/);
});

test('a release with no version, or not a bare semver, fails', () => {
  const { version, ...noVersion } = release;
  for (const shape of [noVersion, { ...release, version: 'v1.16.1' }]) {
    const r = run(shape);
    assert.equal(r.code, 1, JSON.stringify(shape));
    assert.match(r.out, /not a bare semver/);
  }
});

test('release.yml decides through the script, not an inline default', () => {
  assert.match(workflow, /run: scripts\/release-gate\.sh/);
  assert.doesNotMatch(
    workflow,
    /\/\/ "false"/,
    'a jq default of "false" is the silent skip this gate replaced',
  );
});

/** The `run:` body of the step named `name`, dedented. */
const stepScript = (name) => {
  const lines = workflow.split('\n');
  const at = lines.findIndex((l) => l.trim() === `- name: ${name}`);
  assert.notEqual(at, -1, `release.yml has no step named "${name}"`);
  const from = lines.findIndex((l, i) => i > at && /^\s+run: \|$/.test(l));
  const indent = lines[from + 1].match(/^\s*/)[0];
  const body = [];
  for (const l of lines.slice(from + 1)) {
    if (l.trim() !== '' && !l.startsWith(indent)) break;
    body.push(l.slice(indent.length));
  }
  return body.join('\n');
};

const patStep = 'Fail if the release PAT is not set';

test('the release PAT step fails when the secret is absent and passes when present', () => {
  const script = stepScript(patStep);
  const runStep = (has) =>
    spawnSync('bash', ['-c', script], {
      env: { ...process.env, HAS_RELEASE_PLEASE_PAT: has, GITHUB_REPOSITORY: 'mlorentedev/web' },
      encoding: 'utf8',
    });

  const absent = runStep('false');
  assert.equal(absent.status, 1);
  assert.match(absent.stdout, /RELEASE_PLEASE_PAT is not set/);
  assert.equal(runStep('true').status, 0);
});

test('the PAT step runs before release-please, and the token has no silent fallback', () => {
  assert.ok(
    workflow.indexOf(`- name: ${patStep}`) < workflow.indexOf('googleapis/release-please-action'),
    'the check must run before the step that would use the fallback',
  );
  assert.match(workflow, /token: \$\{\{ secrets\.RELEASE_PLEASE_PAT \}\}/);
  assert.doesNotMatch(workflow, /RELEASE_PLEASE_PAT \|\|/);
});
