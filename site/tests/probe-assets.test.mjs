/**
 * The built pages lead `nginx-cache-probe.mjs` to an asset of each kind it
 * probes. The probe itself only runs on the published image, after merge; this
 * runs its search on `dist/` in every pull request (see `lib/probe-assets.mjs`).
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { probeAssets } from './lib/probe-assets.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const page = async (path) => readFileSync(join(dist, path, 'index.html'), 'utf8');

test('the built pages lead the cache probe to a served Astro and beoe asset', async () => {
  assert.ok(existsSync(dist), 'run the build first');
  const { astro, beoe } = await probeAssets(page);
  assert.ok(astro && existsSync(join(dist, astro)), `no Astro stylesheet reachable from / (found ${astro})`);
  assert.ok(beoe && existsSync(join(dist, beoe)), `no beoe diagram reachable from /notes/ (found ${beoe})`);
});
