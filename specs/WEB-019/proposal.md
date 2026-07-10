---
id: "WEB-019"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-07-10"
issue: "web#46"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-019: GitHub / OSS telemetry proof surface (PS2)

> Second proof surface (PS2) of the WEB-010 interactive-CV migration — the "santi substance"
> engine, restraint skin. Delivered in increments under the one issue (#46), same as WEB-012.
> Design language reuses the WEB-011 skin: bracketed `[ NN / label ]` sections, cyan accent.
>
> - **Increment 1 — baked GitHub metrics** — new `[ 06 / … ]` landing section (repos, stars,
>   top languages, hive metric) fetched at **build time** from the public REST API and baked
>   into static HTML, with a hardcoded fallback so the build never breaks. Both locales. No JS,
>   no token.
> - **Increment 2 — live client-side hydration** — a progressive-enhancement island reads a
>   `localStorage` cache (TTL-gated, the "cron window"), fetches the public REST API live when
>   the cache is stale, and updates the baked numbers in place. Degrades to the baked/cached
>   value on any failure. No backend, no token.
> - **Increment 3 — contribution heatmap** — GraphQL `contributionsCollection` fetched at build
>   time with a `GITHUB_TOKEN` build secret (a token cannot be client-side), baked into the
>   section; a weekly scheduled rebuild keeps it fresh.

## Why

<!-- from issue #46: WEB-019: GitHub/OSS telemetry proof surface (PS2) -->

The landing asserts platform / OSS credibility in prose and a static `[ 00 ]` credibility band,
but the *live, third-party-verifiable* proof — public repos, stars, the languages I actually
ship, activity — isn't shown. GitHub already hosts that data, so a telemetry surface turns
"trust me" into numbers a visitor can cross-check, at zero new infrastructure. It's the second
proof surface (PS2) of the WEB-010 interactive-CV migration and the cheapest live-proof brick:
the data source is external and free.

## What

- A new `src/components/ProofSurface.astro` renders a bracketed `[ 06 / … ]` section on **both**
  landings (`index.astro` + `es/index.astro`), placed after `[ 05 / notes ]`, with these metrics
  sourced from GitHub for `mlorentedev`: **public repos**, **total stars**, **top languages**,
  and the **hive metric**. Labels are i18n'd; numbers are language-agnostic facts.
- **Increment 1 (baseline, no JS):** the metrics are fetched at build time from the public REST
  API (`/users/mlorentedev`, `/users/mlorentedev/repos`) in the component frontmatter and baked
  into the HTML — mirrors `CredibilityBand`'s build-time derivation. A build-time fetch failure
  (API down / rate-limited) degrades to a hardcoded fallback object so `astro build` never fails.
- **Increment 2 (enhancement, JS island):** a small client island reads a `localStorage` cache
  keyed by metric with a TTL (e.g. 6–24 h). On mount: if the cache is fresh, use it; if stale or
  absent, fetch the public REST API live and update both the DOM and the cache. The island only
  ever *updates* the baked number — on any error it leaves the baked/cached value untouched, so
  the visitor never sees a broken/empty state.
- **Increment 3 (heatmap):** two candidate paths (decide when we reach it — see open questions):
  (a) **reuse the existing tokenless third-party image** already on the site
  (`ghchart.rshah.org/0e7490/mlorentedev`, used today in `ProjectsSection.astro` + `projects.astro`)
  — zero token, zero secret, relocated/consolidated into the new `[ 06 ]` section; or
  (b) **self-hosted** via GraphQL `contributionsCollection` fetched at build time with a `GITHUB_TOKEN`
  CI secret (a token cannot be exposed client-side), baked + refreshed by a weekly scheduled rebuild.

## Out of scope

- **Runtime backend / API proxy** — "no new infra"; live data comes from the *public* REST API
  client-side (inc. 2), and the token-scoped GraphQL call runs only at build (inc. 3).
- **kubelab-sourced telemetry** (cluster metrics, RAG-bot usage) — different proof surfaces under
  WEB-010 (streams B/C). This surface is GitHub-only.
- **A second/aggregate GitHub account or org repos** — `mlorentedev` only for now.
- **Any new visual language** — reuse the WEB-011 skin (bracketed labels, cyan accent, tabular-nums).

## Risks / open questions

- **[DECIDE AT INC. 3] Heatmap path — third-party image vs self-hosted token.** A tokenless
  contribution heatmap ALREADY ships on the site (`ghchart.rshah.org/0e7490/mlorentedev` in
  `ProjectsSection.astro` + `projects.astro`). So increment 3 is a choice, not a hard token
  requirement: (a) reuse/relocate that image (zero secret, external dependency on rshah.org) or
  (b) self-host via GraphQL + a `GITHUB_TOKEN` CI secret (the default Actions token is repo-scoped
  and may NOT read `user.contributionsCollection` → likely a PAT with `read:user`). Does NOT block
  increments 1–2. User initially picked (b); revisit given (a) already exists.
- **Client-side rate limit (inc. 2):** GitHub's unauthenticated REST limit is 60 req/hr per visitor
  IP. The TTL-gated cache keeps a returning visitor to ≤ a couple of calls/window; a first visit is
  1–2 calls. Acceptable, but the island MUST no-op (keep baked value) on HTTP 403/429, not spin.
- **Cold-start + failure (inc. 1 is the floor):** a first-time visitor with empty cache whose live
  fetch fails must still see a real number → that's exactly why increment 1 bakes the value. Inc. 1
  is a hard prerequisite for inc. 2, not optional.
- **"hive metric" source is ambiguous:** is it the existing `[ 00 ]` "67–82% token reduction" claim
  (not GitHub-derived, would duplicate the band) or the Hive repo's GitHub stats (stars/activity)?
  Decide at increment 1 — leaning toward the Hive repo's GitHub numbers to keep the surface
  genuinely GitHub-sourced and avoid duplicating the band.
- **Build now depends on an external API (inc. 1 & 3):** the hardcoded fallback (inc. 1) and a cached
  last-good snapshot committed to the repo (inc. 3) keep a flaky GitHub from breaking deploys.

## Acceptance criteria

**Increment 1 — baked metrics:**

- [ ] `ProofSurface.astro` renders a bracketed `[ 06 / … ]` section with ≥3 GitHub-sourced metrics
      (public repos, total stars, top languages) plus the hive metric; each has a value + label.
- [ ] Metrics are fetched at build time and appear in `dist/index.html` and `dist/es/index.html`
      (no client-side fetch required to see them); labels are localized per locale.
- [ ] A simulated fetch failure at build falls back to the hardcoded defaults and `astro build`
      still completes; `astro check` passes 0/0/0.

**Increment 2 — live hydration:**

- [ ] With JS enabled, the island updates the baked numbers from the public REST API and writes a
      TTL'd `localStorage` cache; a forced fetch error leaves the baked/cached number visible (no
      empty state, no layout shift).

**Increment 3 — heatmap:**

- [ ] A contribution heatmap renders in the section, fetched at build via GraphQL with the CI
      token secret; a weekly scheduled workflow triggers a rebuild; absent the token the build
      still succeeds using the committed last-good snapshot.

## References

- Bitácora: `web#46` (WEB-019), epic `web#40` (WEB-010).
- Proof-surface catalog: ADR-045 (vault — not in-repo; catalog of PS1…PSn).
- Precedent: `CredibilityBand.astro` (build-time derivation, language-agnostic facts), WEB-011
  (bracketed section skin), WEB-012 (increment-based delivery under one issue).
- GitHub APIs: REST `GET /users/{u}`, `GET /users/{u}/repos`; GraphQL `user.contributionsCollection`.
