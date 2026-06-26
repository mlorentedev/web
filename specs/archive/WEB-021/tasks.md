---
tags: [spec, tasks, web]
created: "2026-06-26"
---

# Tasks - WEB-021

> Astro static site: no unit-test harness, so "verify" = `npm run build`
> (astro check + build) + grep over `dist/` + manual smoke. One task ≈ one commit.

## Setup

- [x] Branch created from master: `feature/web-021-same-origin-api-brand-config`
- [x] `proposal.md` complete and acceptance criteria testable
- [x] No open questions left in `proposal.md`

## Implementation

- [x] A1. `site.ts`: API `baseUrl` default `''`; add `social`; add `analytics`
      (GA4 id + Cloudflare-edge note)
- [x] A2. Update `.env.example`, `README.md`, `CONTRIBUTING.md`, `AGENTS.md`
      (`PUBLIC_API_URL` = host-only local-dev override)
- [x] B1. `Footer.astro` consumes `site.social` (drop hardcoded URLs)
- [x] C1. `Analytics.astro` component (GA4 gtag; renders only when id set)
- [x] C2. `BaseLayout.astro` includes `<Analytics />` in `<head>`

## Closing

- [x] Every acceptance criterion verified (build + grep over `dist/`)
- [x] `astro check` type-checks pass (build green)
- [x] No unrelated changes in the diff (no scope creep)
- [x] `verification.md` filled in
- [ ] PR opened (`Closes #6`) + follow-up issues filed (GDPR banner; legacy GA id cleanup)

## Note on features.json

Omitted for this spec: the change is a small config/wiring refactor with no new
machine-verifiable runtime surface beyond the acceptance criteria above, which are
checked by `npm run build` + grep over `dist/`. See [[pattern-feature-list-as-primitive]]
for when to emit one.
