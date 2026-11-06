import type { Lang } from '../i18n/ui';

/**
 * Series of notes, shown on the notes index (#590). A note can sit in more
 * than one series (the DNS notes are also part of Homelab 2025), so
 * membership lives here and not in each note's frontmatter. `notes` lists
 * note ids in reading order. Both series and their members come from the
 * 2026-11-04 proposal (vault `research/2026-11-04-rest-of-site`, N2).
 */
export interface Series {
  id: string;
  title: Record<Lang, string>;
  notes: string[];
}

export const series: Series[] = [
  {
    id: 'homelab-2025',
    title: { en: 'Homelab 2025', es: 'Homelab 2025' },
    // The fifteen notes written while building the homelab, December 2024 to May 2025.
    notes: [
      'why-build-homelab',
      'picking-hardware-budget-k3s',
      'proxmox-mini-pcs',
      'k3s-vs-k8s-lightweight',
      'bootstrapping-k3s-ansible',
      'rpi4-gateway-pihole-coredns',
      'first-week-traefik',
      'iac-homelab-overkill',
      'kustomize-good-bad-ugly',
      'bios-auto-power-on',
      'headscale-self-hosted-tailscale',
      'split-dns-broke-everything',
      'pihole-broke-vpn',
      'debugging-dns-systematic',
      'network-topology-hybrid',
    ],
  },
  {
    id: 'dns',
    title: { en: 'DNS is always the problem', es: 'DNS is always the problem' },
    notes: ['rpi4-gateway-pihole-coredns', 'split-dns-broke-everything', 'pihole-broke-vpn', 'debugging-dns-systematic'],
  },
];

/**
 * The notes pinned above the series as "Start here". Empty until the owner
 * picks them: the proposal leaves the selection to the owner, and the block renders
 * only when this lists at least one note.
 */
export const startHere: string[] = [];
