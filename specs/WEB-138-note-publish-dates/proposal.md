---
id: "WEB-138-note-publish-dates"
type: spec
status: verifying # draft | implementing | verifying | archived
created: "2026-11-04"
issue: "mlorentedev/web#391"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
owner: manu
---

# WEB-138: Note publish dates

## Why

<!-- from issue #391: WEB-138: notes carry a written and a published date, and future-dated notes stay out of the build until their day -->

Publishing resumes at one note every two weeks, written from the backlog of lessons and ADRs. Two things the notes pipeline cannot do today. A note merged ahead of its date ships on the next build, with a future date printed on it, because every consumer filters on `draft` only. And a note has one date: one written from a 2025-03 lesson either loses that history, or lands at the bottom of the RSS feed, where no subscriber sees it.

## What

- `pubDate` stays the real publish date. It drives order, the build filter, RSS and JSON-LD `datePublished`. A new optional `writtenDate` holds the date of the source the note was written from. The 17 existing notes are unchanged. (Decided by Manu, 2026-11-04.)
- A note whose `pubDate` is after the build's clock is absent from the whole build: its page, the indexes, tag pages, the home's latest notes, RSS and the sitemap. The clock is the build time, read once (`NOTES_NOW` overrides it). No cron is needed. Merging the release PR is a push, so the first release built after the date publishes the note, through the existing gated promotion (ADR-046, ADR-055). A note appears with the first release after its date, not at 00:00 that day.
- When a note has a `writtenDate`, its page's `<time>` shows that date, followed by one visible line: "written from my notes of <writtenDate> · published <pubDate>" (EN and ES, new i18n keys). JSON-LD adds `dateCreated`. Listings and RSS order by `pubDate`.
- One helper in `src/lib/locale-pages.ts` is the only reader of the `notes` collection. `LatestNotesSection.astro` and `rss.xml.ts`, the two direct readers today, go through it.
- The glob loader's base directory can be overridden (`NOTES_DIR`), so a test can build over fixture notes without placing a fake note in `src/content/notes/`. (Test strategy decided by Manu, 2026-11-04.)

## Out of scope

- Modification dates (`updatedDate`, sitemap `lastmod`): WEB-050.
- Scheduling a build at midnight, or any cron: the ticket argues it away.
- Rewriting any existing note's date or copy.

## Risks / open questions

- Wall clock in the Docker build: nothing sets `SOURCE_DATE_EPOCH` in the Dockerfile or the workflows today (checked 2026-11-04), so `new Date()` is the build time. If reproducible builds ever pin it, the filter would follow the commit time, so the helper reads the clock in one place.
- Dates compare in UTC. A bare `2026-11-20` parses as UTC midnight, so a note dated that day publishes on a build at or after 2026-11-20T00:00Z.
- The ticket names `CredibilityBand` as a consumer. It no longer exists in the source (grep, 2026-11-04).
- Fixture notes must use tags that `src/data/tag-names.mjs` maps, once WEB-052's PR lands, or the tag pages throw on them.

## Acceptance criteria

- [ ] AC1: A note whose `pubDate` is after the build clock is absent from the whole `dist/`: its page, the indexes, tag pages, RSS, the sitemap and the home's latest notes.
- [ ] AC2: The same note appears once the clock passes its date, with no other change.
- [ ] AC3: A note with a `writtenDate` shows that date and the visible published line, and RSS orders it by `pubDate`.
- [ ] AC4: No file reads the `notes` collection except through the helper. A test asserts this, not review.

## References

- Bitácora board: mlorentedev/web#391
- Related ADRs: `docs/adr/` ADR-046, ADR-055 (gated promotion)
- Related: WEB-050 (modification dates)
