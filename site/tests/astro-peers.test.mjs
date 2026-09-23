/**
 * Every package that declares an `astro` peer range accepts the astro we ship
 * (WEB-022, #7).
 *
 * This is the failure that kept the site on Astro 5 for months. Dependabot bumps
 * `astro` alone (#368), the integrations still declare `peer astro ^5`, and the
 * PR goes red on an ERESOLVE whose message names the wrong package. Read from
 * the lockfile, which records every peer range, the mismatch is one comparison:
 * it fails here, naming the package, before anyone reads an npm error.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import semver from 'semver';

const here = dirname(fileURLToPath(import.meta.url));
const lock = JSON.parse(readFileSync(join(here, '..', 'package-lock.json'), 'utf8'));

test('every astro peer range in the lockfile accepts the installed astro', () => {
  const astro = lock.packages['node_modules/astro']?.version;
  assert.ok(astro, 'the lockfile resolves no node_modules/astro');

  const declaring = Object.entries(lock.packages).filter(([, meta]) => meta.peerDependencies?.astro);
  // Vacuity guard: if nothing declares the peer, the loop below proves nothing.
  assert.ok(declaring.length > 0, 'no package in the lockfile declares an astro peer range');

  const rejecting = declaring
    .filter(([, meta]) => !semver.satisfies(astro, meta.peerDependencies.astro))
    .map(([path, meta]) => `${path.replace(/^node_modules\//, '')}@${meta.version} wants astro ${meta.peerDependencies.astro}`);

  assert.deepEqual(rejecting, [], `astro ${astro} is outside the peer range of:\n  ${rejecting.join('\n  ')}`);
});
