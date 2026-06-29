---
tags: [spec, tasks, templates]
created: "2026-06-27"
---

# Tasks - WEB-027

> TDD order. One task = one focused commit. Tick as you go. Reorder freely while spec is in `draft` state; freeze once you start `implementing`.

## Setup

- [ ] Branch created from main: `feat/WEB-027`
- [ ] `proposal.md` is complete and acceptance criteria are testable
- [ ] No open questions left in `proposal.md` "Risks / open questions"

## Implementation

> Decision (proposal Risks): dedicated `src/data/features.ts` + direct boolean access (`features.youtube`). Build-time only. One commit each, TDD order.

- [ ] Create `src/data/features.ts`: typed `features` object `as const`, all flags default `false`, with a top-of-file "how to add a flag" doc comment and a one-line `/** … */` per flag (what it is, why off). Seed `youtube: false`.
- [ ] Migrate `Footer.astro`: import `features`, change the YouTube conditional from `{youtube && (...)}` (config-driven) to `{features.youtube && (...)}` (flag-driven).
- [ ] Restore `site.social.youtube` to the real URL `https://youtube.com/@mlorentedev` and remove the `youtube: ''` empty-string hack + its comment in `site.ts`.
- [ ] Verify flag OFF: `make build` then `grep -rl "youtube.com/@mlorentedev" site/dist/` returns nothing from the footer (link absent).
- [ ] Verify flag ON: temporarily set `youtube: true`, rebuild, confirm the footer anchor is present; revert to `false`.
- [ ] Confirm no regression: build still reports 74 pages; diff touches only `features.ts` (new), `Footer.astro`, `site.ts`.

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
    "id": "WEB-027-f1",
    "behavior": "<one-line copy of an acceptance criterion>",
    "verification": "<single shell command; exit 0 means pass>",
    "state": "pending",
    "evidence": ""
  }
]
```
