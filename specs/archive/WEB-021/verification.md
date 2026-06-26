---
tags: [spec, verification, web]
created: "2026-06-26"
---

# Verification - WEB-021

## Evidence

Verified on `feature/web-021-same-origin-api-brand-config` (build 2026-06-26).

- [x] Relative `/api/subscribe` default — grep `dist/`: forms emit `"/api/subscribe`
      (relative); no `api.staging.kubelab.live` anywhere. (`api.kubelab.live` hits are
      blog prose in `notes/split-dns-broke-everything`, not config.)
- [x] Host-only `PUBLIC_API_URL` override -> single `/api` — by construction:
      `${baseUrl}/api/subscribe` with `baseUrl='https://api.staging.kubelab.live'`
      yields `…/api/subscribe`; the Go router serves `r.Group("/api")` (no stripPrefix).
- [x] Footer renders from `site.social` — grep `dist/index.html`: mailto/github/x/
      youtube present; no hardcoded social URLs remain in `Footer.astro`.
- [x] GA4 tag present when id set — grep `dist/`: `G-PLL8SP2YFC` + `googletagmanager`
      on all 74 pages; guarded by `{gaId && …}` so an empty id renders nothing.
- [x] `npm run build` passes; no Cloudflare beacon — build Complete (74 pages); grep
      `cloudflareinsights|beacon.min.js` in `dist/`: none (edge-only).

## Test status

- Build: `npm run build` (astro check && astro build) -> Complete, 74 pages, no type errors.
- Manual smoke test: e2e POST deferred to TOOLKIT-010 (kubelab#774) — the web-host
  `/api` route doesn't exist yet, so a live POST 404s until then. WEB-021's own scope
  (relative call site + build) is verified above.
- No regressions in existing build: yes (clean build; diff limited to config + wiring).

## Decisions made during implementation

- API base `/api` placement: kept `/api` in the call site, base defaults to `''`
  (avoids `/api/api`; `PUBLIC_API_URL` keeps host-only semantics). Confirmed against
  the Go router `r.Group("/api")`.
- Analytics: GA4 wired in code; Cloudflare left edge-injected (proxied site) to avoid
  loading the beacon twice.

## Promotion candidates

- [x] Lesson for `docs/lessons.md`? no — the non-obvious bits (double `/api`,
  Cloudflare edge auto-inject) already live in `site.ts` comments + this spec.
- [x] ADR-worthy? no — implements existing ADR-054.
- [x] New pattern candidate? no.

## Archive checklist

- [x] `proposal.md` frontmatter set to `status: archived`
- [x] Folder moved: `specs/WEB-021/` -> `specs/archive/WEB-021/`
- [x] Bitácora #6 closed with PR link (web#53, ADR-018)
- [x] Follow-up issues filed: web#52 (GDPR banner), kubelab#770 (GA id cleanup), kubelab#774 (TOOLKIT-010 `/api` route)
