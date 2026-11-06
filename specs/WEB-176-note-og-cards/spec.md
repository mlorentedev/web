---
id: WEB-176-note-og-cards
type: spec
status: active
created: "2026-11-06"
owner: manu
issue: "web#551"
---
# WEB-176: Note og cards

## Intent

Every page shares one `og:image`, so a note shared anywhere previews as the generic site card,
never as the note. The note's `BlogPosting` leaves out `image`, because the generic card is not
the note's.

## Scope

Decided by the owner (2026-11-06): cards are generated from the current card's template with
the note's title, date and tags, by a script that uses Playwright (already a dev dependency),
and the PNGs are committed.

- `npm run og:cards` renders a 1200×630 card for every non-draft note in source, future-dated
  ones included, into `site/src/assets/og/`, with a manifest of each card's input hash.
- The cards live outside `public/`: an endpoint `/og/notes/<id>.png` emits only the cards of
  published notes (`notesIn`), so a future note's title ships on its date and not before
  (WEB-138). A note with no card gets the generic card bytes, so the fixture builds still build.
- Each note's `og:image`, `twitter:image` and `BlogPosting.image` are the same absolute URL.
- The logo is cropped from the current card, not redrawn: the card's look is unchanged.

Out of scope: cards for pages other than notes; a new card design.

## Checklist

- [x] [AC1] [AC2] Failing dist test: every published note's `og:image`, `twitter:image` and
      JSON-LD `image` are `/og/notes/<id>.png`; the file is a 1200×630 PNG and not the
      generic card's bytes.
- [x] [AC3] Failing source test: every non-draft note has a card whose manifest hash matches
      its inputs, naming the stale or missing one.
- [x] Endpoint, `BaseLayout`/`NotePage`/`blogPosting` plumbing.
- [x] Generator script; cards and manifest committed.
- [x] A future-dated fixture note's card is in no file of the fixture build.

Acceptance (from the ticket):

- AC1: each note's `og:image` and `twitter:image` are that note's own card.
- AC2: the note's `BlogPosting` declares the same URL as `image`.
- AC3: a test fails if a note ships the generic card, or if `image` and `og:image` disagree.

## Evidence

```
$ npm run og:cards
og-cards: 17 rendered, 0 unchanged
$ npm run build && npm test
ℹ tests 570
ℹ pass 569
ℹ fail 0
ℹ skipped 1
$ npm run test:browser && npm run test:a11y   # both exit 0
```

Probes: with `pihole-broke-vpn.png` removed and a title changed in source, the source test names
`pihole-broke-vpn: no card` and `k3s-vs-k8s-lightweight: its card is stale`; after a build, the
dist test fails on the generic card and the headline test on the title. The fixture build
asserts `/og/notes/fixture-future-note.png` is absent before its date and present on it.

## Next

Open the PR and triage it.

## Promotion candidates

- [x] Lesson? `yes`, lesson 080: a generated asset committed under `public/` ships before the content it
      belongs to is published.
- [ ] ADR? `no`
- [ ] Pattern? `no`
