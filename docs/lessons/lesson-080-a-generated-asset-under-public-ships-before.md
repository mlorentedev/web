---
id: "lesson-080-a-generated-asset-under-public-ships-before"
type: lesson
status: active
title: "A generated asset under public/ ships before the note it belongs to is published"
created: "2026-11-06"
owner: manu
tags: [web, astro, publishing, testing]
---

# A generated asset under public/ ships before the note it belongs to is published

**Context**: WEB-176 gives each note its own social card: a 1200×630 PNG with the note's
title, rendered by a script and committed, since rendering needs a browser. WEB-138 already
holds a note dated after the build out of every file the build writes.

**Problem**: The natural place for a committed image is `site/public/`, and Astro copies
that directory into `dist/` whole, with no idea which note a file belongs to. A future
note's card, title drawn on it, would have shipped with the next release, before the note,
and the existing date test, which reads only text files, would not have seen it. Rendering
only published notes' cards does not help either: on the first build after a note's date,
its card would not exist yet, and CI would go red on an unrelated PR.

**Solution**: Cards for every non-draft note, future ones included, are committed under
`site/src/assets/og/`, outside `public/`. An endpoint, `pages/og/notes/[slug].png.ts`, takes
its paths from `notesIn`, the same date filter as the pages, and emits only published notes'
cards. The fixture build test now lists binary files by name and asserts the future note's
card is absent before its date and present on it. A manifest of input hashes makes a stale
or missing card fail a test that names the note and the command that regenerates it.

**Rule**: Anything tied to a piece of content goes through the same filter as the content.
`public/` is unfiltered, so only site-wide files belong there.
