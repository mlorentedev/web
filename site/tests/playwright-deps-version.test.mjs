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

test('no Playwright version is written into the Dockerfile', () => {
  assert.doesNotMatch(
    dockerfile,
    /playwright@\d/,
    'a literal version is a second copy of the lockfile that Dependabot does not bump',
  );
});

test('install-deps uses the version the playwright-version stage read from the lockfile', () => {
  assert.match(dockerfile, /AS playwright-version\nCOPY site\/package-lock\.json /);
  assert.match(dockerfile, /packages\['node_modules\/playwright'\]\.version/);
  assert.match(dockerfile, /COPY --from=playwright-version \/playwright-version /);
  assert.match(dockerfile, /npx --yes "playwright@\$\(cat \/tmp\/playwright-version\)" install-deps chromium/);
});

test('the lockfile path the stage reads resolves to a version', () => {
  // The same expression the stage evaluates; if npm moves the key, the image
  // build fails on its grep, and this fails first and closer to the cause.
  assert.match(lock.packages['node_modules/playwright']?.version ?? '', /^\d+\.\d+\.\d+$/);
});

test('the libraries stay cached across source edits: install-deps comes before npm ci and the sources', () => {
  const at = (needle) => {
    const i = dockerfile.indexOf(needle);
    assert.notEqual(i, -1, `Dockerfile has no ${needle}`);
    return i;
  };
  const deps = at('install-deps chromium');
  assert.ok(deps < at('npm ci --include=dev'), 'install-deps must precede npm ci');
  assert.ok(deps < at('COPY --chown=node:node site/ ./'), 'install-deps must precede the source COPY');
});
