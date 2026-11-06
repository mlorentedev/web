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

- [x] AC1 -> `tests/note-dates.test.mjs` "before its date: no page, listing, tag page, feed entry or sitemap url", on a build over the fixtures at `NOTES_NOW=2030-05-31T23:59:59Z`. The future fixture carries a tag no other fixture has (`kustomize`), so a tag page built from the whole collection would be caught by its URL. Probe: with `notesIn` back to `!data.draft`, that subtest fails.
- [x] AC1 (Spanish) -> same test, "/es/notes/ is noindex and out of the sitemap until a Spanish note is published": a Spanish fixture dated 2030-06-01. The page's noindex comes from `notesIn`, and the sitemap drops every page whose built HTML says noindex (`plugins/noindex-pages.mjs`). `es-notes-fallback.test.mjs` uses `publishedIn`, the rule `notesIn` uses. Probe: with `notesIn` back to `!data.draft`, the subtest fails.
- [x] AC2 -> same test, "on its date: its page, the index, its tag page, the feed and the sitemap", at `NOTES_NOW=2030-06-01T00:00:00Z`. The same fixture is used, with no other change.
- [x] AC3 -> same test, "a backdated note shows when it was written…": `<time datetime="2019-03-01">`, then `· published <time datetime="2021-01-01">January 1, 2021</time>`, JSON-LD `dateCreated` and `datePublished`, and RSS order future → backdated → past by `pubDate`. A note with one date shows one. Unit tests cover `shownWrittenDate` (none when equal to `pubDate`) and `writtenDateValid` (the schema's refine).
- [x] AC4 -> `tests/note-dates.test.mjs` "only src/lib/locale-pages.ts reads a collection other than pages": any `getCollection`, `getEntry`, `getEntries`, `getLiveCollection` or `getLiveEntry` call whose first argument is not the literal `'pages'`, and any `content/notes` path outside `content.config.ts`. Before the change it named `LatestNotesSection.astro` and `rss.xml.ts`.

## Test status

- `npm run build && npm test`: 540 tests, 539 pass, 0 fail (1 skipped, as on master).
- `npm run test:browser` and `npm run test:a11y`: all pass.
- No regressions: the 17 real notes carry no `writtenDate`, so their pages are unchanged. The fixture builds leave no fixture in the shared content store; `site/.astro/content-modules.mjs` names them until the next real build rewrites it (lesson 077).

## Decisions made during implementation

- Manu chose `pubDate` + optional `writtenDate`, and unit tests plus a fixture build (2026-11-04). The visible line is dates only: `<written> · published <published>` (ES `publicada el`), shown only when the written date is earlier.
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
