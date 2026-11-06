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
- [x] [AC1] [AC2] `content.config.ts` reads `NOTES_DIR`. Expected: the fixture test passes for AC1 and AC2.
- [x] [AC3] Schema: optional `writtenDate`, which must not be after `pubDate`. `NotePage` shows both dates when `writtenDate` is earlier, as `<date> · published <date>` (new key `notes.published`, EN and ES). JSON-LD gets `dateCreated`. Expected: the fixture assertions for AC3 pass, and RSS order follows `pubDate`.
- [x] [AC1] [AC4] Review fix: `/es/notes/` is noindex while `notesIn` finds no published Spanish note, and the sitemap leaves out every page whose built HTML says noindex (`plugins/noindex-pages.mjs`, from WEB-052), so both follow the date. `es-notes-fallback.test.mjs` reads the same rule (`publishedIn`). A Spanish fixture dated 2030-06-01 proves `/es/notes/` is noindex and out of the sitemap before its date, and indexable and listed after. The AC4 scan covers every content-layer call and `content/notes` paths.

## Closing

- [x] Every acceptance criterion from `proposal.md` is covered by at least one test
- [x] Every acceptance criterion has a matching entry in `features.json` with a non-vacuous verification command (state stays `pending`: only the harness sets `passing`)
- [x] Type checks pass: none: `site/` has no type-check script; `npm run build` compiles the TypeScript and passes
- [x] Lint passes: none: `site/` has no lint script; pre-commit hooks pass
- [x] No unrelated changes in the diff (no scope creep)
- [x] `verification.md` filled in
- [x] PR opened referencing this spec folder
