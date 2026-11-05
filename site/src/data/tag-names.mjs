// The display name of every tag (WEB-052). A tag is stored as its card or
// note wrote it, and the page used whichever spelling it found first, so `dns`,
// `iac` and `proxmox` went out lower-case beside `Kubernetes` and `Ansible`.
// The key is the slug (`/tags/<key>/`), the value is how the page names it.
// Names are product or industry terms and read the same in both locales.
// tests/tag-pages.test.mjs fails on a tag with no entry and on an entry no
// source carries; the tag page refuses to build an unmapped one.
export const tagNames = {
  ai: 'AI',
  ansible: 'Ansible',
  architecture: 'Architecture',
  automation: 'Automation',
  cli: 'CLI',
  devex: 'DevEx',
  dns: 'DNS',
  go: 'Go',
  hardware: 'Hardware',
  homelab: 'Homelab',
  iac: 'IaC',
  iot: 'IoT',
  'jetson-nano': 'Jetson Nano',
  kubernetes: 'Kubernetes',
  kustomize: 'Kustomize',
  llm: 'LLM',
  mcp: 'MCP',
  neovim: 'Neovim',
  networking: 'Networking',
  obsidian: 'Obsidian',
  pdf: 'PDF',
  'platform-engineering': 'Platform Engineering',
  proxmox: 'Proxmox',
  python: 'Python',
  shell: 'Shell',
  tailscale: 'Tailscale',
  terraform: 'Terraform',
  traefik: 'Traefik',
  vpn: 'VPN',
  youtube: 'YouTube',
};

/** The display name of the tag with slug `slug`; a tag with none fails the build. */
export function tagName(slug) {
  const name = tagNames[slug];
  if (!name) throw new Error(`tag "${slug}" has no display name: add it to src/data/tag-names.mjs`);
  return name;
}
