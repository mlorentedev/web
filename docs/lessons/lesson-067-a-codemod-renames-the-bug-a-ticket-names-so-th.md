---
id: lesson-067-a-codemod-renames-the-bug-a-ticket-names-so-th
type: lesson
status: active
created: "2026-11-01"
owner: manu
tags: [web, accessibility, testing, tailwind]
---

# A codemod renames the bug a ticket names, so the ticket's own search reports it fixed

**Context**: WEB-039 (#114). The ticket was filed against Tailwind 3 and named its evidence:
`focus:outline-none` on 7 elements of `/notes`, with no replacement ring.

**Problem**: The Tailwind 4 upgrade tool rewrote every `outline-none` to `outline-hidden`.
Searching `origin/master` for the ticket's term finds nothing, which reads as fixed, while
30 elements still had no usable indicator. The ticket's inventory had aged too: some elements
it listed had gained a ring, and `focus:ring-1 ring-accent-500` looked like a replacement but
was 1 px at about 2.4:1 on white. Then the first green run of the new browser check proved
little: every page it visited was light. The one surface where the shared colour fails, the
subscribe form on `cyan-700`, only appears on `/es/rompe`, which was not in the page list.

**Solution**: One `:focus-visible` rule in `@layer base` owns the indicator, and the per-element
utilities are gone, because a `focus:` utility sits in a later layer and erases the rule. A
test bans them by shape (`focus:(outline|ring|text|underline)`), not by the old name. A
Playwright check presses Tab through the built pages and measures the computed outline against
the composited backdrop, since axe has no focus-indicator rule. An outline paints outside its
element, so the backdrop starts at the parent: a white button on `cyan-700` needs a white ring.

**Rule**: Before closing a ticket on "the string is gone", reproduce the behaviour it describes:
a rename leaves the defect and removes the evidence. And when a check measures a surface,
derive its page list from where the surfaces are, not from the pages that come to mind.
