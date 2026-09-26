---
tags: [spec, tasks, templates]
created: "2026-09-24"
---

# Tasks - WEB-141

> TDD order. One task = one focused commit. Tick as you go. Reorder freely while spec is in `draft` state; freeze once you start `implementing`.
>
> **Inline markers** (optional, additive — borrowed from `github/spec-kit`, adapt-not-adopt per #141):
> - `[P]` — this task has **no dependency on another unchecked task**, so it is safe to run in parallel (fan out to a `Workflow`, or just batch). TDD chains (test → implement → refactor of the *same* behavior) are sequential and must NOT carry `[P]`; independent behaviors can.
> - `[AC<n>]` — this task helps satisfy **acceptance criterion #`<n>`** from `proposal.md`. Lets `/spec check` map coverage deterministically; omit it and the check falls back to semantic judgment.

## Setup

- [x] Spec branch `docs/spec-web-141`; each phase ships from its own `feat/` or `fix/` branch, one PR per task group
- [x] `proposal.md` is complete and acceptance criteria are testable (`/spec fill`, 2026-09-24)
- [x] No open question blocks phase 1; phases 3, 4 and 5 each have a gate in the proposal's risks 3, 1 and 2

## Implementation

### Phase 1 — stop the false claims (web only)

- [x] [P] [AC4] Extend `tests/retired-labels.test.mjs` with the brand package's banned terms, scoped to the
      `lab.*`, `ai.*` and `idp.*` copy in both locales; watch it fail on today's `/ai` title
- [x] [AC4] Rewrite the `/ai` hero and section copy (`ai.*`) in the site's register until the test passes
- [x] [P] Write a failing test that every `/ai` artifact card quotes, verbatim, the file it links to at a
      pinned commit (#407)
- [x] Replace the four hand-typed snippets with pinned excerpts; the card whose file is the P0–P3 rubric
      becomes `harness/review-attestation.json` (Manu, 2026-09-25)
- [ ] [P] [AC4] Write a failing test that the Spanish Lab and AI pages carry no English strings (the Lab and AI
      part of #354). `tests/es-no-english.test.mjs` covers `/es/ai`; the three Lab pages join with their
      translation
- [ ] [AC4] Translate those strings until it passes. Done for `/ai` and the shared header and footer; the Lab
      pages are next. Manu, 2026-09-25: "Lab" stays a name; automation names and descriptive catalog titles are
      translated; `platform.json` names wait for the exporter (phase 2)
- [ ] [P] [AC2] Write a failing test that every access label on `/lab` matches a committed, measured access table
      (#292)
- [ ] [AC2] Replace the "Mesh only" labels with the measured access table (#292)
- [ ] [P] [AC2] Write a failing test that no count on `/lab`, `/ai` or `/lab/idp` is typed into copy rather than
      read from `platform.json` (#133, #355)
- [ ] [AC2] Source or remove every hand-written count; remove each `platform.json` metric that has no method
      until phase 2 supplies it (#340)
- [ ] [P] [AC3] Write a failing test that no catalog card targets `kubelab.live` or any other redirecting URL
- [ ] [AC3] Point the perimeter scanners at the domain that serves the site; internal cards say why they do not
      open (until phase 3)
- [ ] [P] [AC1] Create `src/data/proofs.ts` (`kubelab`, `agents`; `teledyne` belongs to WEB-140) with a failing
      test for the four fields and for every `href` resolving in both locales
- [ ] [AC1] [AC9] Render the proof block at the top of `/lab` and `/ai`, with the date each result was measured
- [ ] [P] Housekeeping (#31): the KubeLab project card links to `/lab`. `portfolio.ts` is shared with the home,
      so tell the WEB-140 session before merging
- [ ] [AC7] Full suite green before each phase-1 PR merges (`npm test`, `lab-containment.mjs`, `lab-axe.mjs`)

### Phase 2 — producers and measured figures (kubelab, then web)

- [ ] [AC2] kubelab PR (mlorentedev/kubelab#1347): the exporter emits the sanitized manifest from `common.yaml`,
      within ADR-056 §3
- [ ] [AC2] kubelab PR (mlorentedev/kubelab#1727): OBS-027 publishes the public series `/lab` reads
- [ ] [AC2] web: a committed, reviewable sync step, and a CI check that fails when the committed `platform.json`
      and the exporter output disagree (#162)
- [ ] [AC2] [AC9] web: figures read from the OBS-027 series at build time, each with a link to its method and
      its measurement date (#340)
- [ ] [AC2] Reconcile the manifest with the cluster (#272)
- [ ] [AC3] `/lab/idp/architecture`: every flow gets a way to verify it

### Phase 3 — sanitized captures (gate: proposal risk 3)

- [ ] [AC3] Write down the sanitization rule and a failing test over the capture sources: captures are rendered
      from sanitized data, SVG or HTML where possible so the text can be scanned, with no IPs, no internal
      hostnames and no non-public URLs
- [ ] [AC3] [AC8] [AC9] Add captures behind the internal catalog cards (Argo CD, Grafana and the like), each with
      alt text, lazy loading and the date it was taken, within the `lab-weight.test.mjs` budget

### Phase 4 — live read-only surfaces (gate: proposal risk 1)

- [ ] [AC5] ADR amending ADR-056 §3, accepted by Manu before any code
- [ ] [AC5] kubelab PR: read-only proxy, ingress and rate limits for the chosen dashboards
- [ ] [AC5] Smoke test: a write attempt is refused and the rate limit holds
- [ ] [AC3] [AC5] web: the catalog cards for those surfaces link to the live, read-only view

### Phase 5 — the chat (gate: proposal risk 2, tracked in #45)

- [ ] [AC6] Settle the gate in #45: the public-only content filter, the spend cap and rate limit, and the
      switched-off state
- [ ] [AC6] kubelab PR: `/v1/knowledge/chat` over a public-only index, with a rate limit and the spend cap
- [ ] [AC6] web: failing tests first (public-only answers, the switched-off message at the cap, the call to
      action pointing at the door), then the chat island on `/ai`
- [ ] [AC7] [AC8] The island keeps `/ai` within its weight budget and axe passes

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

Minimal `features.json` skeleton (drop into `<repo>/specs/WEB-141/features.json`):

```json
[
  {
    "id": "WEB-141-f1",
    "behavior": "<one-line copy of an acceptance criterion>",
    "verification": "<single shell command; exit 0 means pass>",
    "state": "pending",
    "evidence": ""
  }
]
```
