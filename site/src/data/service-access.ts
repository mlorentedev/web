import accessData from './service-access.json';

/**
 * Who can reach each Lab service, as measured from outside the mesh (#292).
 *
 * Committed data, not a live probe: the page renders what was measured on
 * `measured`, and `npm run test:access` (weekly in CI) fails when a live host no
 * longer matches its row. The rules live in `tests/lib/access.mjs`.
 */
export type ServiceAccess = 'public' | 'authelia' | 'app-login' | 'mesh';

export interface ServiceAccessRow {
  slug: string;
  access: ServiceAccess;
  /** Only for a service with a public DNS record (ADR-056 §3). */
  url?: string;
  /** The path whose status shows an `app-login` service asking for credentials. */
  probe?: { path: string; status: number };
}

export interface ServiceAccessTable {
  /** ISO date of the measurement. */
  measured: string;
  method: string;
  services: ServiceAccessRow[];
}

export const serviceAccess = accessData as ServiceAccessTable;

export function accessFor(slug: string): ServiceAccessRow {
  const row = serviceAccess.services.find((r) => r.slug === slug);
  if (!row) throw new Error(`service-access.json has no row for "${slug}"`);
  return row;
}
