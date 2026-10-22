/**
 * The release gate in `release.yml` (WEB-117).
 *
 * `scripts/release-gate.mjs` turns release-please's outputs into the two
 * values `promote-prod` needs: was a release cut, and which version. Until
 * WEB-117 it defaulted both: a missing `release_created` read as `false`, so a
 * renamed output would skip the prod publish with every job green.
 *
 * Both fixtures are real `$OUTPUTS`, echoed by the gate step on master: the
 * 9d79e52 push (no release, run 39540256737) and the 1.16.0 release (run
 * 39184845519), with the long PR and changelog strings trimmed. They show why
 * the gate keys on `releases_created`: on a push with no release, the
 * per-release keys (`release_created`, `version`) are absent, not `false`, so
 * their absence cannot mean "renamed". `releases_created` is the key that is
 * always there.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { decide } from '../scripts/release-gate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '../scripts/release-gate.mjs');
const fixture = (name) => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));
const noRelease = fixture('release-please-outputs-no-release.json');
const release = fixture('release-please-outputs-release.json');

const without = (outputs, ...keys) => Object.fromEntries(Object.entries(outputs).filter(([k]) => !keys.includes(k)));
const renamed = (outputs, from, to) => ({ ...without(outputs, from), [to]: outputs[from] });

test('a push with no release is not a release', () => {
  assert.deepEqual(decide(noRelease), { ok: true, created: 'false', version: '' });
});

test('a release yields its version', () => {
  assert.deepEqual(decide(release), { ok: true, created: 'true', version: '1.16.0' });
});

test('manifest-mode keys are read too', () => {
  const prefixed = renamed(renamed(release, 'release_created', '.--release_created'), 'version', '.--version');
  assert.deepEqual(decide(prefixed), { ok: true, created: 'true', version: '1.16.0' });
});

test('an absent releases_created fails, naming the key', () => {
  const result = decide(renamed(noRelease, 'releases_created', 'releasesCreated'));
  assert.equal(result.ok, false);
  assert.match(result.message, /releases_created/);
});

test('a release without release_created fails, naming both keys', () => {
  const result = decide(renamed(release, 'release_created', 'releaseCreated'));
  assert.equal(result.ok, false);
  assert.match(result.message, /release_created/);
  assert.match(result.message, /\.--release_created/);
});

test('a release without a version fails, naming both keys', () => {
  const result = decide(without(release, 'version'));
  assert.equal(result.ok, false);
  assert.match(result.message, /"version"/);
  assert.match(result.message, /\.--version/);
});

test('unparseable outputs fail', () => {
  assert.equal(decide('not json').ok, false);
});

const run = (outputs) => {
  const out = join(mkdtempSync(join(tmpdir(), 'gate-')), 'out');
  writeFileSync(out, '');
  try {
    execFileSync(process.execPath, [script], {
      env: { ...process.env, OUTPUTS: JSON.stringify(outputs), GITHUB_OUTPUT: out },
      stdio: 'pipe',
    });
    return { code: 0, written: readFileSync(out, 'utf8') };
  } catch (err) {
    return { code: err.status, written: readFileSync(out, 'utf8'), stderr: String(err.stderr) };
  }
};

test('the CLI writes created and version to GITHUB_OUTPUT', () => {
  assert.deepEqual(run(release), { code: 0, written: 'created=true\nversion=1.16.0\n' });
  assert.deepEqual(run(noRelease), { code: 0, written: 'created=false\nversion=\n' });
});

test('the CLI fails with an annotation, not a stack trace, without GITHUB_OUTPUT', () => {
  const env = { ...process.env, OUTPUTS: JSON.stringify(release) };
  delete env.GITHUB_OUTPUT;
  assert.throws(
    () => execFileSync(process.execPath, [script], { env, stdio: 'pipe' }),
    (e) => e.status === 1 && /^::error::GITHUB_OUTPUT is not set/m.test(String(e.stderr)) && !/ERR_INVALID_ARG_TYPE/.test(String(e.stderr)),
  );
});

test('the CLI exits 1 and writes nothing when the outputs are unreadable', () => {
  const result = run(renamed(noRelease, 'releases_created', 'releasesCreated'));
  assert.equal(result.code, 1);
  assert.equal(result.written, '');
  assert.match(result.stderr, /::error::/);
});

const workflow = readFileSync(join(here, '../../.github/workflows/release.yml'), 'utf8');

test('release.yml runs this gate, not an inline default', () => {
  assert.match(workflow, /^ {10}node site\/scripts\/release-gate\.mjs$/m);
  assert.doesNotMatch(workflow, /release_created"\]\s*\/\/[^\n]*"false"/);
});

test('release.yml has no fallback for the release PR credential', () => {
  assert.match(workflow, /^ {10}token: \$\{\{ secrets\.RELEASE_PLEASE_PAT \}\}$/m);
  assert.doesNotMatch(workflow, /RELEASE_PLEASE_PAT \|\|/);
  assert.match(workflow, /HAS_RELEASE_PLEASE_PAT: \$\{\{ secrets\.RELEASE_PLEASE_PAT != '' \}\}/);
});
