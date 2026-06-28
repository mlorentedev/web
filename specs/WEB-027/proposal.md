---
id: "WEB-027"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-06-27"
issue: "web#60"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-027: Feature-flag infrastructure

> **Naming**: file lives at `<repo>/specs/<feature-id>/proposal.md`. `<feature-id>` is `AREA-NNN-slug` (e.g. `TOOL-001-secret-drift`).

## Why

<!-- from issue #60: WEB-027: Feature-flag infrastructure (adopt as standing practice) -->

The repo has no feature-flag mechanism, so today the only way to hide or defer something is to delete code or empty config values (e.g. `youtube: ''`), which conflates "deliberately off" with "config missing". Without flags we cannot merge work to master without committing to launching it, nor disable something in prod without a redeploy. Three pieces of work are already blocked on this (readiness-gated NaN badges #59, ES storytelling #42, social-link visibility), and the goal is to adopt feature-flagging as a standing practice alongside SDD/TDD.

## What

1. A typed `features` object as the single source of truth (in `site.ts` or a dedicated `features.ts`), where each flag is declared with an explicit default (off) and is read at build time.
2. Components/pages consume flags declaratively (`features.<name>` or an `isEnabled('<name>')` helper) instead of overloading empty config values.
3. At least one real consumer migrated off the interim hack: the footer YouTube link renders from a flag (`features.youtube`), not from `youtube: ''`.

## Out of scope

Things this PR explicitly does NOT include. Forces a sharp boundary and prevents scope creep.

- Runtime / per-request flag evaluation without a rebuild — build-time only for v1 (a true runtime toggle conflicts with the immutable promote-by-digest pipeline, ADR-055; revisit later if needed).
- Implementing the other flag consumers — this PR builds the infra and migrates only the YouTube footer link; NaN provenance badges (#59) and ES storytelling (#42) stay in their own tickets.
- Any third-party / remote flag service or admin UI (LaunchDarkly, dashboards, DB-backed flags) — overkill for a static personal site.

## Risks / open questions

Failure modes, dependencies, and unknowns to clarify before implementation. If any item here is unresolved, do not move to `tasks.md` yet.

- **[RESOLVED 2026-06-27]** Where flags live + API shape: **dedicated `src/data/features.ts` module with direct boolean access** (`features.youtube`). Chosen over `site.features` (keeps flags separate from brand/analytics config) and over an `isEnabled()` helper (direct boolean is type-safe and tree-shakes cleanly; add a helper only if runtime/env logic is later needed).
- Build-time-only means flipping a flag requires a rebuild + re-promote (no instant prod toggle). Acceptable for v1, but document the expectation so it isn't mistaken for a runtime switch.
- Verify that disabled branches are actually tree-shaken / not shipped in the static HTML output (confirm with the YouTube consumer), so a hidden flag leaks neither markup nor links.

## Acceptance criteria

Observable outcomes. Each must be testable.

- [ ] A typed `features` SSOT exists with every flag defaulting to off; the TypeScript build passes with the flags typed (no `any`).
- [ ] With `features.youtube` disabled, the built static output (`dist/`) contains no YouTube anchor from the footer (`grep -r "youtube" dist/` finds none); with it enabled, the anchor is present.
- [ ] Toggling only the flag value (no other code change) flips the YouTube link in the rebuilt output — proving the consumer is flag-driven, not config-driven.
- [ ] The `youtube: ''` empty-string hack is removed: `site.social.youtube` holds the real URL again, and footer visibility is controlled solely by the flag.
- [ ] Self-documenting: each flag is declared with a one-line comment (what it is, why it is off) and a short "how to add a flag" note exists, so deliberate-off is distinguishable from missing-config at a glance.
- [ ] No regression: the build still produces 74 pages and existing pages are unchanged except the footer (YouTube).

## References

- Bitácora board: `web#60` (see the `issue:` frontmatter field)
- Consumers blocked on this: `web#59` (NaN provenance badges), `web#42` (ES storytelling)
- Build-time constraint: build-once / promote-by-digest pipeline (ADR-055) — flags bake into the digest
- Pattern candidate (cross-project, at archive): `00_meta/patterns/pattern-feature-flags.md`
