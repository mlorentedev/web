export const site = {
  title: 'Manu Lorente — Platform engineering for AI workloads',
  description: 'I build, automate, and operate the infrastructure AI agents run on — Kubernetes, on-prem, reproducible. I run a 40-service homelab and document what breaks.',
  author: 'Manu Lorente',
  domain: 'mlorente.dev',
  url: 'https://mlorente.dev',
  api: {
    // Same-origin by default (ADR-054): call sites use a relative `/api/...` and the
    // edge (Traefik, in kubelab) routes it per environment, so the image bakes no host.
    // For local dev the Astro dev server has no backend — set PUBLIC_API_URL to a real
    // API host (host only; call sites add the `/api/...` path themselves).
    baseUrl: import.meta.env.PUBLIC_API_URL || '',
  },
  social: {
    email: 'hey@mlorente.dev',
    github: 'https://github.com/mlorentedev',
    x: 'https://x.com/mlorentedev',
    xHandle: '@mlorentedev',
    // Real URL; footer visibility is gated by `features.youtube` (WEB-027), not by this value.
    youtube: 'https://youtube.com/@mlorentedev',
  },
  analytics: {
    // GA4 measurement ID (public; ships in client HTML). Empty string disables the tag.
    // NOTE: GA4 uses cookies — a consent banner is a follow-up, not wired here yet.
    googleAnalyticsId: 'G-PLL8SP2YFC',
    // Cloudflare Web Analytics is injected automatically at the edge (proxied site),
    // NOT in code — do not add the beacon here or it would load twice.
  },
} as const;
