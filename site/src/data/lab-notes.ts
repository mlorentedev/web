/**
 * The notes behind each numbered section of the Lab (#592), as a reading
 * path rather than a date order. The map is the one in the 2026-11-04 site
 * research (vault `research/2026-11-04-rest-of-site/e-creators.md` §5.1).
 * Section 06, the IDP catalogue, has no note yet, so it lists none.
 */
export const labNotes: Record<string, string[]> = {
  '01': ['why-build-homelab', 'building-a-homelab-idp', 'iac-homelab-overkill'],
  '02': ['first-week-traefik'],
  '03': ['picking-hardware-budget-k3s', 'proxmox-mini-pcs', 'rpi4-gateway-pihole-coredns', 'bios-auto-power-on'],
  '04': [
    'network-topology-hybrid',
    'headscale-self-hosted-tailscale',
    'split-dns-broke-everything',
    'pihole-broke-vpn',
    'debugging-dns-systematic',
  ],
  '05': ['bootstrapping-k3s-ansible', 'kustomize-good-bad-ugly', 'k3s-vs-k8s-lightweight'],
  '07': ['fail-closed-agent-harnesses'],
};
