---
tags: [spec, tasks, templates]
created: "2026-11-04"
id: "WEB-138-note-publish-dates"
type: spec-tasks
status: active
owner: manu
---

# Tasks - WEB-138-note-publish-dates

> TDD order. One task = one focused commit. Tick as you go. Reorder freely while spec is in `draft` state; freeze once you start `implementing`.
>
> **Inline markers** (optional, additive — borrowed from `github/spec-kit`, adapt-not-adopt per #141):
> - `[P]` — this task has **no dependency on another unchecked task**, so it is safe to run in parallel (fan out to a `Workflow`, or just batch). TDD chains (test → implement → refactor of the *same* behavior) are sequential and must NOT carry `[P]`; independent behaviors can.
> - `[AC<n>]` — this task helps satisfy **acceptance criterion #`<n>`** from `proposal.md`. Lets `/spec check` map coverage deterministically; omit it and the check falls back to semantic judgment.

## Setup

- [x] Branch created from master: `feat/note-publish-dates`
- [x] `proposal.md` is complete and acceptance criteria are testable
- [x] No open questions left in `proposal.md` "Risks / open questions"

## Implementation

- [x] [P] [AC1] [AC2] Failing unit tests in `site/tests/note-dates.test.mjs` for `isPublished(data, now)` and `buildClock(env)` from `site/src/lib/note-dates.mjs`. Run `node --test tests/note-dates.test.mjs`. Expected: FAIL, module not found.
- [x] [AC1] [AC2] Write `site/src/lib/note-dates.mjs`. Expected: the unit tests pass.
- [x] [P] [AC4] Failing source scan: no file outside `src/lib/locale-pages.ts` calls `getCollection('notes'`. Expected: FAIL naming `LatestNotesSection.astro` and `rss.xml.ts`.
- [x] [AC4] [AC1] `notesIn` filters through `isPublished(…, buildClock())`. Route `LatestNotesSection` and `rss.xml.ts` through `notesIn`. Expected: the scan passes, and `npm run build && npm test` stays green.
- [x] [AC1] [AC2] [AC3] Failing fixture-build test: `NOTES_DIR=tests/fixtures/notes NOTES_NOW=<t> astro build --outDir <tmp>` at two clocks. The future note is absent from every file before its date, and present after it. Expected: FAIL, `NOTES_DIR` is not read.
- [x] [AC1] [AC2] `content.config.ts` (and the sitemap's Spanish-notes probe in `astro.config.mjs`) read `NOTES_DIR`. Expected: the fixture test passes for AC1 and AC2.
- [x] [AC3] Schema: optional `writtenDate`, which must not be after `pubDate`. `NotePage` shows it in `<time>`, with the published line (new keys `notes.writtenFrom`, EN and ES). JSON-LD gets `dateCreated`. Expected: the fixture assertions for AC3 pass, and RSS order follows `pubDate`.

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

Minimal `features.json` skeleton (drop into `<repo>/specs/WEB-138-note-publish-dates/features.json`):

```json
[
  {
    "id": "WEB-138-note-publish-dates-f1",
    "behavior": "<one-line copy of an acceptance criterion>",
    "verification": "<single shell command; exit 0 means pass>",
    "state": "pending",
    "evidence": ""
  }
]
```
