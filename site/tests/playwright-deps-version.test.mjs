/**
 * The image installs Chromium's system libraries for the lockfile's Playwright
 * (WEB-163, `#482`).
 *
 * `install-deps` runs as root before `npm ci`, so it cannot use the installed
 * binary. Its version used to be a literal in the Dockerfile, and Dependabot
 * bumps the lockfile but not that literal: it read 1.62.1 while the browser
 * came from 1.64.1. The Dockerfile now reads the version from the lockfile in a
 * `playwright-version` stage. This file keeps the literal from coming back, and
 * keeps the layer order that caches the libraries across source edits.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8');
const lock = JSON.parse(readFileSync(join(here, '../package-lock.json'), 'utf8'));
// Instructions only: comments mention `npm ci` and the stage before any of them.
const code = dockerfile
  .split('\n')
  .filter((l) => !l.trimStart().startsWith('#'))
  .join('\n');

test('no Playwright version is written into the Dockerfile', () => {
  assert.doesNotMatch(
    dockerfile,
    /playwright@\d/,
    'a literal version is a second copy of the lockfile that Dependabot does not bump',
  );
});

test('install-deps uses the version the playwright-version stage read from the lockfile', () => {
  const stage = code.match(/ AS playwright-version\n([\s\S]*?)(?=^FROM )/m)?.[1];
  assert.ok(stage, 'Dockerfile has no playwright-version stage followed by another FROM');
  assert.match(stage, /^COPY .*\bsite\/package-lock\.json /m);
  assert.match(stage, /packages\['node_modules\/playwright'\]\.version/);
  assert.match(code, /^COPY --from=playwright-version \/playwright-version /m);
  assert.match(code, /npx --yes "playwright@\$\(cat \/tmp\/playwright-version\)" install-deps chromium/);
});

test('the lockfile path the stage reads resolves to a version', () => {
  // The same expression the stage evaluates; if npm moves the key, the image
  // build fails on its grep, and this fails first and closer to the cause.
  assert.match(lock.packages['node_modules/playwright']?.version ?? '', /^\d+\.\d+\.\d+$/);
});

test('the libraries stay cached across source edits: install-deps comes before npm ci and the sources', () => {
  const at = (pattern) => {
    const i = code.search(pattern);
    assert.notEqual(i, -1, `Dockerfile has no ${pattern}`);
    return i;
  };
  const deps = at(/install-deps chromium/);
  assert.ok(deps < at(/\bnpm ci\b/), 'install-deps must precede npm ci');
  assert.ok(deps < at(/^COPY .*\bsite\/ /m), 'install-deps must precede the source COPY');
});
