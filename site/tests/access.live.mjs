/**
 * Re-measure the Lab's access table against the live hosts (#292).
 *
 *   npm run test:access
 *
 * Network-bound on purpose, so it is not in `npm test` (`*.test.mjs`) and the
 * build never depends on it. `.github/workflows/access-check.yml` runs it weekly
 * and on demand. It fails when any row of `src/data/service-access.json` no
 * longer matches what a visitor meets; the fix is to change the row, or the
 * service, and bump `measured` to the day of the new measurement.
 *
 * With `ACCESS_OBSERVATIONS` naming a file written by `npm run access:report`,
 * it asserts on that observation instead of taking a new one. The workflow does
 * this, so the record it keeps and the verdict it gives are the same reading.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { classify, matches } from './lib/access.mjs';
import { MESH_HOSTS, hostOf, observeAll } from './lib/observe.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const table = JSON.parse(readFileSync(join(here, '..', 'src/data/service-access.json'), 'utf8'));
const platform = JSON.parse(readFileSync(join(here, '..', 'src/data/platform.json'), 'utf8'));

const recorded = process.env.ACCESS_OBSERVATIONS;
const observations = recorded ? JSON.parse(readFileSync(recorded, 'utf8')) : await observeAll(table);

test('every mesh service in the table has a probe host here', () => {
  const mesh = table.services.filter((row) => row.access === 'mesh').map((row) => row.slug);
  assert.deepEqual(mesh.sort(), Object.keys(MESH_HOSTS).sort());
  assert.deepEqual(table.services.map((r) => r.slug).sort(), platform.services.map((s) => s.slug).sort());
});

for (const row of table.services) {
  test(`${row.slug} is still "${row.access}"${row.onDemand ? ' (on demand)' : ''}`, (t) => {
    const host = hostOf(row);
    const seen = observations[row.slug];
    assert.ok(seen, `${host}: no observation recorded`);
    const measured = classify(seen, row.probe?.status);
    if (measured !== row.access && matches(measured, row)) t.diagnostic(`${host}: no response; the row is on demand, so its host is taken to be asleep`);
    assert.ok(matches(measured, row), `${host}: measured "${measured}", the row says "${row.access}", from ${JSON.stringify(seen)}`);
  });
}
