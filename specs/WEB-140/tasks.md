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
- [ ] One branch per PR from `origin/master`: `feat/web-140-home-page`, `feat/web-140-trim`, `feat/web-140-story`,
  `feat/web-140-door`

## Implementation

> Four small PRs, in order; each one leaves the home shippable. Tests live in `site/tests/home.test.mjs` (dist-based,
> like `contact.test.mjs`) unless noted.

### PR 1 · One `HomePage` for both locales (pure refactor, same output)

- [x] [AC2] Write failing test: `pages/index.astro` and `pages/es/index.astro` are stubs that render `HomePage` with
  their `lang`, and each built home has exactly one `<h1>`
- [x] [AC2] Implement `components/HomePage.astro` (the `ContactPage`/`LegalPage` pattern) and reduce both pages to stubs
- [x] [AC6] `npm run build && npm test` green; `visual-diff.mjs` shows no change on `/` and `/es/`

### PR 2 · Trim: drop the five sections, the bio becomes the story block

> Amended 2026-09-25: the home is prose. The Timeline goes too, and there is no proof block or `proofs.ts`.

- [x] [AC2] [AC5] Write failing test: the home no longer renders IdpStrip, ProjectsSection, ProofSurface,
  CommunitySection or Timeline, and no node/service count or "99.9%" appears in either built home
- [x] [AC2] Remove the five sections from `HomePage`; the bio renders second, in a `data-home-block="story"` section
  with `id="story"` (update `bio.test`, which today looks for it inside the Timeline)
- [x] Housekeeping: delete the orphaned code: the five components, `data/github.ts`, and every `ui.ts` key left with
  no consumer. `data/experience.ts` stays (the story's figures are held to it). Tell the WEB-141 session before
  deleting any `idp.*` key (its namespace) and delete only keys with no consumer left
- [x] Housekeeping: in the hero, the "What I build on it" → `#projects` link goes (its target is gone). The link to
  `#story` needs new wording, so it lands with the story in PR 3. The subtitle's "The homelab below is the proof" is
  removed here: nothing is below it any more
- [x] [AC2] Add the agreed community paragraph (CommunitySection's content moves here) at the end of
  `content/pages/{en,es}-bio.mdx`; `bio.test` must stay green

### PR 3 · The story

- [x] [AC4] Write failing test (in `bio.test.mjs`): the story links `/lab/` and `/ai/` in its own locale, every link in
  it resolves to a built route, every figure is in `experience.ts`, the agents sentence states no figure, and it has
  300 to 450 words per locale
- [x] [AC4] Draft the story in `content/pages/{en,es}-bio.mdx` from the current bio and `brand-package.md` §3 (the
  career the Timeline listed, told as prose; the three proofs as linked sentences; `/projects` linked once), and the
  hero's secondary link to `#story` in place of "Explore my platform"
- [ ] Manu rewrites the draft in the PR before it merges; the tests hold whatever wording he lands on

### PR 4 · The door on the home, notes last

- [x] [AC3] Write failing test: the home's `data-offer` text equals `/contact`'s, and its door `mailto` is identical,
  in both locales
- [x] [AC3] Render the contact markdown entry on the home as block 3, with its H1 mapped to H2 so the page keeps one H1
- [x] [AC2] LatestNotes becomes the three latest titles as text links plus a link to `/notes`, at the bottom; the
  structure test pins the four blocks in order via `data-home-block` attributes, and no image, SVG or card inside the
  story and notes blocks
- [x] [P] [AC1] Write `tests/home-first-screen.mjs` (Playwright, the `lab-containment.mjs` harness): at 1280 and
  400 px, in both locales, the label, the H1 and the door sit inside the first viewport; wire it into `test:browser`
- [x] [AC5] Test: no "open to work", "available now", "disponible" or equivalent in either built home or contact page;
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
