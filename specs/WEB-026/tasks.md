---
tags: [spec, tasks, templates]
created: "2026-07-09"
---

# Tasks - WEB-026

> TDD order. One task = one focused commit. Tick as you go. Reorder freely while spec is in `draft` state; freeze once you start `implementing`.
>
> **Inline markers** (optional, additive — borrowed from `github/spec-kit`, adapt-not-adopt per #141):
> - `[P]` — this task has **no dependency on another unchecked task**, so it is safe to run in parallel (fan out to a `Workflow`, or just batch). TDD chains (test → implement → refactor of the *same* behavior) are sequential and must NOT carry `[P]`; independent behaviors can.
> - `[AC<n>]` — this task helps satisfy **acceptance criterion #`<n>`** from `proposal.md`. Lets `/spec check` map coverage deterministically; omit it and the check falls back to semantic judgment.

## Setup

- [x] Branch created from main: `feat/WEB-026`
- [x] `proposal.md` is complete and acceptance criteria are testable
- [x] No open questions left in `proposal.md` "Risks / open questions" (contract-ripple + weak-metrics resolved by decisions; ES voice pending maintainer review)

## Implementation

> No unit-test harness in this repo (static Astro site; the maintainer is the review harness, per WEB-027). "Verification" = `astro check` (types), `astro build` (renders), and grep assertions on `dist/`. Tasks are ordered so the build stays green between commits where possible.

**Data model (AC2, AC3) — the contract change first, since everything reads it.**
- [x] [AC2][AC3] Restructure `src/data/portfolio.ts`: `Project` gains per-language `{ title, description, metric }` under `en`/`es`; `tags`/`url`/`github`/`featured` stay top-level. Author 8 headline metrics (EN) + ES prose. Export a `localize(project, lang)` helper returning a flat, single-language view.
- [x] Add card-chrome i18n keys to `src/i18n/ui.ts` (EN + ES): `projects.viewProject` ("View project" / "Ver proyecto").

**Component (AC1) — extract once, enrich once.**
- [x] [AC1] Create `src/components/ProjectCard.astro`: props = one localized project + `lang`; renders title, metric (prominent `data-metric` badge), description, tags, "View project →" link (`url ?? github`). No screenshot slot this PR.

**Wire consumers (AC1, AC2) — swap markup, keep build green.**
- [x] [AC1] `index.astro`: replace inline card `<div>` with `<ProjectCard>`; pass `localize(project, lang)`. (Also removed the unused `page` var — cleared a pre-existing check hint.)
- [x] [AC1] `projects.astro`: same swap; removed the now-unused `translatePath`/`useTranslatedPath` import.
- [x] [AC2] `tags/[tag].astro` + `es/tags/[tag].astro`: keep their own card markup but read localized fields via `localize(...)` (map param routed through `localize`); `project.tags` unchanged.

**Refactor / verify.**
- [x] Refactor: confirmed no `border border-gray-200 rounded-md p-4 ... flex flex-col` card block remains in `index.astro`/`projects.astro` (features f1).
- [x] Ran `features.json` verification commands; evidence captured in `verification.md` (f1–f4 PASS).
- [x] Follow-up ticket filed: unify the tag-page card into `ProjectCard` — **WEB-028 (#68)**.

## Closing

- [ ] Every acceptance criterion from `proposal.md` is covered by at least one test
- [ ] Every acceptance criterion has a matching entry in `features.json` (see below) with a non-vacuous verification command
- [ ] Type checks pass
- [ ] Lint passes
- [ ] No unrelated changes in the diff (no scope creep)
- [ ] `verification.md` filled in
- [ ] PR opened referencing this spec folder

## Machine-readable features

This spec emits a sibling `features.json` (alongside this file) following [[pattern-feature-list-as-primitive]]. The JSON is the harness-facing contract: each acceptance criterion maps to ≥1 feature with `id`, `behavior`, `verification` (executable command), `state` (lifecycle), and `evidence` (harness-captured output).

**Pass-state gating:** the agent CANNOT write `"state": "passing"` — only the harness, after running `verification` and capturing exit code 0, may set that terminal state. Reviewers must reject PRs where features.json contains `passing` entries with empty `evidence`.

Minimal `features.json` skeleton (drop into `<repo>/specs/<feature-id>/features.json`):

```json
[
  {
    "id": "WEB-026-f1",
    "behavior": "<one-line copy of an acceptance criterion>",
    "verification": "<single shell command; exit 0 means pass>",
    "state": "pending",
    "evidence": ""
  }
]
```
