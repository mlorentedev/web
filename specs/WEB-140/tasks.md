---
tags: [spec, tasks, templates]
created: "2026-09-24"
---

# Tasks - WEB-140

> TDD order. One task = one focused commit. Tick as you go. Reorder freely while spec is in `draft` state; freeze once you start `implementing`.
>
> **Inline markers** (optional, additive — borrowed from `github/spec-kit`, adapt-not-adopt per #141):
> - `[P]` — this task has **no dependency on another unchecked task**, so it is safe to run in parallel (fan out to a `Workflow`, or just batch). TDD chains (test → implement → refactor of the *same* behavior) are sequential and must NOT carry `[P]`; independent behaviors can.
> - `[AC<n>]` — this task helps satisfy **acceptance criterion #`<n>`** from `proposal.md`. Lets `/spec check` map coverage deterministically; omit it and the check falls back to semantic judgment.

## Setup

- [x] `proposal.md` is complete and acceptance criteria are testable (filled with Manu 2026-09-24)
- [x] No open questions left in `proposal.md` "Risks / open questions" (fates decided; the `proofs.ts` split agreed
  with the WEB-141 session)
- [ ] One branch per PR from `origin/master`: `feat/web-140-home-page`, `feat/web-140-trim`, `feat/web-140-proof`,
  `feat/web-140-door`

## Implementation

> Four small PRs, in order; each one leaves the home shippable. Tests live in `site/tests/home.test.mjs` (dist-based,
> like `contact.test.mjs`) unless noted.

### PR 1 · One `HomePage` for both locales (pure refactor, same output)

- [ ] [AC2] Write failing test: `pages/index.astro` and `pages/es/index.astro` are stubs that render `HomePage` with
  their `lang`, and each built home has exactly one `<h1>`
- [ ] [AC2] Implement `components/HomePage.astro` (the `ContactPage`/`LegalPage` pattern) and reduce both pages to stubs
- [ ] [AC6] `npm run build && npm test` green; `visual-diff.mjs` shows no change on `/` and `/es/`

### PR 2 · Trim: drop the four sections, move "who I am" up

- [ ] [AC2] [AC5] Write failing test: the home no longer renders IdpStrip, ProjectsSection, ProofSurface or
  CommunitySection, and no node/service count or "99.9%" appears in either built home
- [ ] [AC2] Remove the four sections from `HomePage`; the Timeline (with the bio) moves to second place
- [ ] Housekeeping: delete the orphaned code: the four components, `data/github.ts`, and every `ui.ts` key left with no consumer.
  Tell the WEB-141 session before deleting any `idp.*` key (its namespace) and delete only keys with no consumer left
- [ ] Housekeeping: in the hero, drop the "What I build on it" → `#projects` link, since its target is gone
- [ ] [AC2] Add the agreed community paragraph (CommunitySection's content moves here) at the end of `content/pages/{en,es}-bio.mdx`; `bio.test` must stay green

### PR 3 · Proof in three pieces

- [ ] [P] [AC4] Write failing test `tests/proofs.test.mjs`: three entries per locale, every `href` resolves to a built
  route in both locales, the `agents` entry states no figure, no node/service count in any entry
- [ ] [AC4] Create `data/proofs.ts` if WEB-141 has not (`teledyne` entry here, from `experience.ts`; `kubelab` and
  `agents` agreed with the WEB-141 session), and `components/ProofBlock.astro` with `id="proof"`, ending in an
  "all projects →" link to `/projects`
- [ ] [AC4] Place it third on the home; the hero's secondary button becomes "see the proof" → `#proof`

### PR 4 · The door on the home, notes last

- [ ] [AC3] Write failing test: the home's `data-offer` text equals `/contact`'s, and its door `mailto` is identical,
  in both locales
- [ ] [AC3] Render the contact markdown entry on the home as block 4, with its H1 mapped to H2 so the page keeps one H1
- [ ] [AC2] Move LatestNotes to the bottom, compact; the structure test pins the five blocks in order via
  `data-home-block` attributes
- [ ] [P] [AC1] Write `tests/home-first-screen.mjs` (Playwright, the `lab-containment.mjs` harness): at 1280 and
  400 px, in both locales, the label, the H1 and the door sit inside the first viewport; wire it into `test:browser`
- [ ] [AC5] Test: no "open to work", "available now", "disponible" or equivalent in either built home or contact page;
  the only availability text is the `nextStart` line

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

Minimal `features.json` skeleton (drop into `<repo>/specs/WEB-140/features.json`):

```json
[
  {
    "id": "WEB-140-f1",
    "behavior": "<one-line copy of an acceptance criterion>",
    "verification": "<single shell command; exit 0 means pass>",
    "state": "pending",
    "evidence": ""
  }
]
```
