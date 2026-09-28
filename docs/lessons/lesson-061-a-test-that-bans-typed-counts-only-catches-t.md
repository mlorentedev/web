---
id: lesson-061-a-test-that-bans-typed-counts-only-catches-t
type: lesson
status: active
created: "2026-09-26"
owner: manu
tags: [web, lab, testing, copy]
---

# A test that bans typed counts only catches the phrasings it lists

**Context**: `tests/lab-counts.test.mjs` (#423) fails when a count on `/lab`, `/ai` or
`/lab/idp` is typed into copy rather than rendered from `platform.json`. It matched a
number, up to three words, then a count noun: "8 machines", "three clusters", "tres nodos".
On #426 the Services intro above the new measured access table read "Three of these answer
to anyone. The rest answer only from inside the WireGuard mesh, behind Authelia".

**Problem**: The table measured four public services, not three. Of the other ten, two
sat behind Authelia, four had their own login and four were mesh-only. The test passed. "Three of these" states a total without
naming a noun, so the grammar the test was written for could not see it. CodeRabbit found
it, not the suite. Every count test is a list of phrasings, and copy finds the ones that
are not on it.

**Solution**: Two changes (`3c71a2b`). The intro lost its numbers, and the totals moved into
a `data-access-tally` list that `LabServices.astro` counts from `service-access.json`, so
the page cannot disagree with its own table. The test gained a `PARTITIVE` pattern ("three
of these/them/those", "tres de estos/ellos/esos") in both languages. It was
mutation-checked by putting the old sentence back.

**Rule**: A total the page can count from its data is rendered from that data, never
written in a sentence. When a test bans typed counts, name the phrasings it covers in the
test, and add each new one the day a review finds it; the test's coverage is only ever
that list.
