---
id: WEB-050-note-modified-dates
type: spec
status: active
created: "2026-11-06"
owner: manu
issue: "web#125"
---
# WEB-050: Note modified dates

## Intent

A note says when it was published and never when it was last changed. The notes schema has no
`updatedDate`, so the sitemap carries no `<lastmod>`, the note's `BlogPosting` has no
`dateModified`, and the page has no `article:published_time` or `article:modified_time`, even
though it declares `og:type` `article`. A note revised after it shipped looks as old as its
first version.

## Scope

- `updatedDate`, optional, in the notes schema. A note without one was last modified when it
  was published. One before `pubDate` is refused.
- Every built note page declares `article:published_time` and `article:modified_time`, and its
  `BlogPosting` declares `dateModified`: one value, `updatedDate` or else `pubDate`.
- The sitemap's `<lastmod>` is read from each built page's `article:modified_time`, the way
  `noindex` already is (WEB-052): the page is the one place the date is written. A page that
  declares none gets no `<lastmod>`. Nothing is derived from file system or git metadata.

Out of scope: showing "updated on" on the page, which needs new copy; setting `updatedDate` on
existing notes, which is the author's call per note.

## Checklist

- [x] [AC1] Failing schema test: `updatedDate` is optional, a blank reads as absent, and one
      before `pubDate` is refused.
- [x] [AC2] Failing dist test: each note's `article:modified_time`, `BlogPosting.dateModified`
      and sitemap `<lastmod>` agree, and equal `updatedDate` or else `pubDate` from the source;
      `article:published_time` equals `datePublished`.
- [x] [AC3] Failing dist test: every `<lastmod>` in the sitemap belongs to a page that declares
      the same `article:modified_time`.
- [x] Schema, `BaseLayout` article meta, `NotePage` and `blogPosting` plumbing.
- [x] The build reader (`plugins/noindex-pages.mjs`) also reads each page's modified time, and
      the sitemap's `serialize` sets `lastmod` from it.

Acceptance (from the ticket):

- AC1: `updatedDate` is in the notes schema, optional, defaulting to `pubDate`.
- AC2: it reaches `article:modified_time`, `BlogPosting.dateModified` and the sitemap's `lastmod`.
- AC3: no date is fabricated from file system metadata.

## Evidence

```
# before the change: the new dist test fails
✖ every lastmod in the sitemap is the modified time its page declares
  AssertionError: the sitemap has no lastmod at all
$ npm run build && npm test
ℹ tests 570
ℹ pass 569
ℹ fail 0
ℹ skipped 1
$ npm run test:browser && npm run test:a11y   # both exit 0
```

The fixture build gives `fixture-backdated-note` an `updatedDate` of 2022-02-02 over a `pubDate`
of 2021-01-01, and asserts the date in its meta, its graph and its sitemap entry. Every site note
has none today, so each one's modified date is its `pubDate`.

## Next

Open the PR and triage it.

## Promotion candidates

- [ ] Lesson? `no`: the sitemap already read noindex from the built page; this reuses that
- [ ] ADR? `no`
- [ ] Pattern? `no`
