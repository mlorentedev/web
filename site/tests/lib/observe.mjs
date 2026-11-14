/**
 * What a visitor meets at each Lab service, observed live (#292, WEB-173).
 *
 * Network-bound: the public DNS answer from 1.1.1.1, then the service root and
 * its probe path without following redirects. `access.mjs` classifies what this
 * returns. `access.live.mjs` asserts on it and `scripts/access-report.mjs`
 * records it, so the check and the record read one observation.
 */
import { Resolver } from 'node:dns/promises';

const resolver = new Resolver();
resolver.setServers(['1.1.1.1']);

/**
 * A mesh service ships no URL, so its host is not in the table. Its public DNS
 * is still worth checking: a `mesh` row is a claim that nothing resolves.
 * These are the platform's own names for the mesh services, from kubelab's
 * ingress rules and service names.
 */
export const MESH_HOSTS = {
  loki: 'loki.kubelab.live',
  minio: 'minio.kubelab.live',
  coredns: 'pihole.kubelab.live',
  gitea: 'gitea.kubelab.live',
};

export const hostOf = (row) => (row.url ? new URL(row.url).host : MESH_HOSTS[row.slug]);

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

/** One row's observation, in the shape `classify` takes. */
export async function observe(row) {
  const seen = { addresses: await addresses(hostOf(row)) };
  if (row.url) {
    seen.root = await get(row.url);
    if (row.probe) seen.probeStatus = (await get(new URL(row.probe.path, row.url)))?.status;
  }
  return seen;
}

/** Every row's observation, by slug, taken concurrently. */
export async function observeAll(table) {
  const seen = await Promise.all(table.services.map(async (row) => [row.slug, await observe(row)]));
  return Object.fromEntries(seen);
}
