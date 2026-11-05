---
tags: [spec, verification, templates]
created: "2026-11-04"
id: "WEB-138-note-publish-dates"
type: spec-verification
status: active
owner: manu
---

# Verification - WEB-138-note-publish-dates

## Evidence

- [x] AC1 -> `tests/note-dates.test.mjs` "before its date: no page, listing, tag page, feed entry or sitemap url", on a build over the fixtures at `NOTES_NOW=2030-05-31T23:59:59Z`. Probe: with `notesIn` back to `!data.draft`, that subtest fails.
- [x] AC2 -> same test, "on its date: its page, the index, its tag page, the feed and the sitemap", at `NOTES_NOW=2030-06-01T00:00:00Z`. The same fixture is used, with no other change.
- [x] AC3 -> same test, "a backdated note shows when it was written…": `<time datetime="2019-03-01">`, the `data-note-published` line naming 2021, JSON-LD `dateCreated` and `datePublished`, and RSS order future → backdated → past by `pubDate`.
- [x] AC4 -> `tests/note-dates.test.mjs` "only src/lib/locale-pages.ts reads the notes collection". Before the change it named `LatestNotesSection.astro` and `rss.xml.ts`.

## Test status

- `npm run build && npm test`: 536 tests, 535 pass, 0 fail (1 skipped, as on master).
- `npm run test:browser` and `npm run test:a11y`: all pass.
- No regressions: the 17 real notes carry no `writtenDate`, so their pages are unchanged. The fixture builds leave no fixture in the shared content store (lesson 077).

## Decisions made during implementation

- Manu chose `pubDate` + optional `writtenDate`, and unit tests plus a fixture build (2026-11-04).
- The schema refuses a `writtenDate` after `pubDate`.
- `cacheDir` is overridable (`ASTRO_CACHE_DIR`) so the fixture builds cannot leak into the shared content store.

## Promotion candidates

- [x] Lesson for the repo's `docs/lessons/`? yes: docs/lessons/lesson-077-a-second-astro-build-over-fixture-content-wr.md
- [x] ADR-worthy decision for the repo's `docs/adr/adr-XXX.md`? no: the publish rule follows the gated promotion that ADR-046 and ADR-055 already decide, and the schema change is recorded in this spec
- [x] New pattern candidate for `00_meta/patterns/`? no: specific to this site's notes pipeline

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-138-note-publish-dates/` -> `specs/archive/WEB-138-note-publish-dates/`
- [ ] Bitácora board ticket for this spec moved to Done / closed with PR link (ADR-018)
- [ ] Promotions above executed (if any)
