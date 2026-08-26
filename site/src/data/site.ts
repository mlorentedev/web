import { ACCENT_BARE } from '../theme/tokens.mjs';

/** The GitHub contribution chart, tinted with the brand accent (WEB-068). */
export const ghchartSrc = `https://ghchart.rshah.org/${ACCENT_BARE}/mlorentedev`;

export const site = {
  // Page title and description are per-locale strings and live in i18n/ui.ts
  // ('meta.title' / 'meta.description'). Keeping an English copy here is what let
  // the Spanish homepage fall back to an English <title>.
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
  // No analytics ships from this file. GA4 was removed with the consent banner it
  // required; measurement moves to a self-hosted cookieless engine on the platform,
  // which needs no consent gate (#189).
  //
  // The comment that used to live here claimed Cloudflare Web Analytics was injected
  // automatically at the edge. That was never true of this host: `dig` resolves
  // mlorente.dev straight to the origin and responses carry no `cf-ray`, because
  // `proxied = false` is set deliberately in kubelab's Terraform — Cloudflare is
  // authoritative DNS only, per ADR-049, which classes proxy-on as a posture change.
} as const;
