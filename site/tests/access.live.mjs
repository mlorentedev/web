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
 */
import assert from 'node:assert/strict';
import { Resolver } from 'node:dns/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { classify } from './lib/access.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const table = JSON.parse(readFileSync(join(here, '..', 'src/data/service-access.json'), 'utf8'));
const platform = JSON.parse(readFileSync(join(here, '..', 'src/data/platform.json'), 'utf8'));

const resolver = new Resolver();
resolver.setServers(['1.1.1.1']);

/**
 * A mesh service ships no URL, so its host is not in the table. Its public DNS
 * is still worth checking: a `mesh` row is a claim that nothing resolves.
 * These are the platform's own names for the mesh services, from kubelab's
 * ingress rules and service names.
 */
const MESH_HOSTS = {
  ollama: 'ollama.kubelab.live',
  loki: 'loki.kubelab.live',
  minio: 'minio.kubelab.live',
  coredns: 'pihole.kubelab.live',
};

async function addresses(host) {
  try {
    return await resolver.resolve4(host);
  } catch (error) {
    if (['ENOTFOUND', 'ENODATA'].includes(error.code)) return [];
    throw error;
  }
}

async function get(url) {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
    return { status: response.status, url, location: response.headers.get('location') ?? undefined };
  } catch {
    return undefined;
  }
}

test('every mesh service in the table has a probe host here', () => {
  const mesh = table.services.filter((row) => row.access === 'mesh').map((row) => row.slug);
  assert.deepEqual(mesh.sort(), Object.keys(MESH_HOSTS).sort());
  assert.deepEqual(table.services.map((r) => r.slug).sort(), platform.services.map((s) => s.slug).sort());
});

for (const row of table.services) {
  test(`${row.slug} is still "${row.access}"`, async () => {
    const host = row.url ? new URL(row.url).host : MESH_HOSTS[row.slug];
    const seen = { addresses: await addresses(host) };
    if (row.url) {
      seen.root = await get(row.url);
      if (row.probe) seen.probeStatus = (await get(new URL(row.probe.path, row.url)))?.status;
    }
    const measured = classify(seen, row.probe?.status);
    assert.equal(measured, row.access, `${host}: measured "${measured}" from ${JSON.stringify(seen)}`);
  });
}
