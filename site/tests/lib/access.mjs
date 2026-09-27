/**
 * How a service's access is classified from outside the mesh (#292).
 *
 * Pure: it takes what was observed (the public DNS answer, the service root's
 * response without following redirects, and the probe path's status) and says
 * which of the four access values that is. `access.live.mjs` feeds it live
 * observations; `service-access.test.mjs` feeds it the ones recorded on
 * 2026-09-26, so the rules are tested without the network.
 *
 * Mesh is decided by DNS alone. The machine that measured the table is on the
 * tailnet and reaches a 100.64.x address a visitor never could, so an HTTP
 * answer from a mesh address proves nothing about a visitor's view.
 */

export const ACCESS = ['public', 'authelia', 'app-login', 'mesh'];

export const AUTHELIA_HOST = 'auth.kubelab.live';

/** CGNAT (the tailnet), RFC 1918, loopback and link-local: addresses no visitor reaches. */
export function isInternalAddress(address) {
  const [a, b] = address.split('.').map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

/**
 * @param {object} seen
 * @param {string[]} seen.addresses  A records from a public resolver.
 * @param {{status: number, location?: string}} [seen.root]  The root, redirects not followed.
 * @param {number} [seen.probeStatus]  The status of the row's probe path, when it has one.
 * @param {number} [expectedProbe]  The status the row says its probe path answers.
 * @returns {'public' | 'authelia' | 'app-login' | 'mesh' | 'unreachable'}
 */
export function classify({ addresses, root, probeStatus }, expectedProbe) {
  if (addresses.length === 0 || addresses.every(isInternalAddress)) return 'mesh';
  if (!root) return 'unreachable';
  if (root.status >= 300 && root.status < 400 && root.location) {
    if (new URL(root.location, 'https://x.invalid').host === AUTHELIA_HOST) return 'authelia';
  }
  if (expectedProbe !== undefined && probeStatus === expectedProbe) return 'app-login';
  return root.status < 400 ? 'public' : 'unreachable';
}
