---
id: "lesson-072-a-target-size-check-without-the-spacing-exc"
type: lesson
status: active
title: "A target-size check without the spacing exception counts 2641 failures the standard does not"
created: "2026-11-04"
owner: manu
tags: [web, accessibility, testing]
---

# A target-size check without the spacing exception counts 2641 failures the standard does not

**Context**: WEB-132 asked for the nav links, the language switch and the tag chips to
reach 24 × 24 px on their own box, because they passed WCAG 2.5.8 only on its spacing
exception.

**Problem**: the first version of `tests/target-size.mjs` held every target to 24 px on
its own box. It reported 2641 failures on 85 pages: footer icons, card links, the Lab
service list. Read as a defect list, that is fifteen components to restyle. Most of
them pass 2.5.8, which allows a smaller target when a 24 px circle centred on it
reaches no other target. The check measured a stricter rule than the standard, and the
count looked like a finding.

**Solution**: the check now implements the exception geometrically. A small target
passes when its circle reaches no other target's box and no other small target's
circle. A focusable scroll region that holds the link does not count as a neighbour.
Only the targets the ticket names (`[data-header-links] a`, `[data-tag-chip]`) are held
to their own box. On master, that leaves the 1436 marked targets failing and nothing
else. After `inline-flex min-h-6 min-w-6` on the nav and `min-h-7` on the chips, all
3762 targets on 85 pages pass at 320 and 1440.

**Rule**: when a test encodes a standard, encode its exceptions too, and keep any
stricter local rule a named, marked subset. A failure count from a stricter rule is
not a measurement of the standard.
