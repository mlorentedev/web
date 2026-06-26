---
id: "WEB-021"
type: spec
status: archived
created: "2026-06-26"
issue: "web#6"
tags: [spec, proposal, web, runtime-config, api, analytics]
template_version: "1.0"
---

# WEB-021: Same-origin /api + own brand build-config

<!-- from issue #6: WEB-021: implement ADR-054 — same-origin /api + own brand build-config -->

> **Archived 2026-06-26** — shipped in PR web#53 (`Closes #6`), released in 1.3.0.
> The kubelab-side `/api` route (the end-to-end enabler) is tracked separately as
> TOOLKIT-010 (kubelab#774).

## Why

The site bakes a per-environment API host (`PUBLIC_API_URL` default
`https://api.staging.kubelab.live`) into an otherwise immutable image. That
collides with the build-once / promote-by-digest invariant (ADR-055) and is the
source of the `api.staging` vs `api.kubelab` default drift. ADR-054 (kubelab#750,
merged) decides the fix: the frontend calls the API **same-origin** via a relative
`/api`, and the brand/build config (title, social, analytics) becomes this repo's
build-time SSOT instead of being inherited from kubelab `common.yaml` (a monorepo
accident).

## What

After this PR:

1. The newsletter form POSTs to a **relative** `/api/subscribe` by default (no host
   baked); a same-origin Traefik route (kubelab side) reaches the API per
   environment. `PUBLIC_API_URL` becomes a local-dev-only override.
2. The site's **social links** are read from a single `site.social` object in
   `src/data/site.ts` (previously hardcoded in `Footer.astro`).
3. **Analytics** is wired: Google Analytics 4 (`G-PLL8SP2YFC`) via an `<Analytics />`
   component reading `site.analytics`; Cloudflare Web Analytics stays edge-injected
   (documented, not duplicated in code).

## Out of scope

- Traefik `/api` IngressRoute per env — lives in kubelab (ADR-053), tracked under
  WEB-020 (#697).
- GA4 cookie-consent banner (GDPR) — follow-up issue.
- Removing the legacy `web.google_analytics_id` from kubelab `common.yaml` — follow-up.
- Astro 6 (WEB-022); Partytown / third-party-script offloading (WEB-001j perf).

## Risks / open questions

- **Double `/api` or wrong path** — the Go API serves under `r.Group("/api")`
  (confirmed in kubelab `apps/api/src/internal/api/routes.go`), so the relative URL
  must resolve to exactly `/api/subscribe`. Keeping the `/api` in the call site and
  defaulting the base to `''` preserves this. RESOLVED.
- **Local dev** — a relative `/api` hits the Astro dev server (no backend); devs must
  set `PUBLIC_API_URL=https://api.staging.kubelab.live` (host only; the call site adds
  `/api/...`). Documented in `.env.example`. RESOLVED.
- **Analytics double-count** — Cloudflare auto-injects its beacon at the edge; the
  code must NOT also inject it, or the beacon loads twice. Code handles GA4 only.
  RESOLVED.

## Acceptance criteria

- [ ] With no env override, the built output posts to a relative `/api/subscribe` — no
      `api.staging` / `api.kubelab` host baked anywhere in `dist/`.
- [ ] `PUBLIC_API_URL=https://api.staging.kubelab.live` makes the form POST to
      `https://api.staging.kubelab.live/api/subscribe` (host-only override, single `/api`).
- [ ] Footer social links render from `site.social`; no hardcoded social URLs remain
      in `Footer.astro`.
- [ ] The GA4 tag (`G-PLL8SP2YFC`) is present in built pages when
      `site.analytics.googleAnalyticsId` is set, and absent when it is empty.
- [ ] `npm run build` (astro check + build) passes; no Cloudflare beacon string is
      emitted by the build (edge-only).

## References

- Bitácora: web#6 (WEB-021)
- ADR: kubelab `docs/adr/adr-054-web-runtime-config.md` (merged); web
  `docs/adr/ADR-055-semver-everywhere-delivery.md` (immutable image)
- Related pattern: `00_meta/patterns/pattern-build-once-promote-by-digest.md`
