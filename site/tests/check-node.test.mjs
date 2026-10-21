/**
 * The Node floor the test suite needs (WEB-152).
 *
 * `node --test` strips TypeScript types without a flag only from Node 22.18,
 * and `subscribe-form.test.mjs` imports `src/i18n/ui.ts`. `.nvmrc` says `22`
 * so CI and the Docker build keep resolving the latest 22.x, which means an
 * older 22 already installed on a laptop passes `nvm use` and then fails one
 * test with `ERR_UNKNOWN_FILE_EXTENSION`, far from the cause. `engines.node`
 * declares the floor and `scripts/check-node.mjs` (run as `pretest`) refuses
 * below it with a message that names the fix.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { check } from '../scripts/check-node.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8'));
const nvmrc = readFileSync(join(here, '../../.nvmrc'), 'utf8').trim();

test('package.json declares the floor type stripping needs', () => {
  assert.equal(pkg.engines?.node, '>=22.18');
});

test('npm test runs the check first', () => {
  assert.equal(pkg.scripts.pretest, 'node scripts/check-node.mjs');
});

test('.nvmrc stays a bare major, so CI and Docker resolve the latest 22.x', () => {
  assert.equal(nvmrc, '22');
});

test('an older 22.x is refused with a message that names the fix', () => {
  const result = check('22.13.1', '>=22.18');
  assert.equal(result.ok, false);
  assert.match(result.message, /22\.13\.1/);
  assert.match(result.message, />=22\.18/);
  assert.match(result.message, /nvm install/);
});

test('the floor itself and anything newer pass', () => {
  for (const version of ['22.18.0', '22.23.3', '24.11.1']) {
    assert.equal(check(version, '>=22.18').ok, true, version);
  }
});

test('the running Node passes the declared floor', () => {
  execFileSync(process.execPath, [join(here, '../scripts/check-node.mjs')]);
});
