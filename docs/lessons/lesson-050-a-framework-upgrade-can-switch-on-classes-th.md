---
id: lesson-050-a-framework-upgrade-can-switch-on-classes-th
type: lesson
status: active
created: "2026-09-22"
owner: manu
tags: [web, tailwind, verification]
---

# A framework upgrade can switch on classes the old version silently ignored

**Context**: WEB-022 PR4, Tailwind 3 to 4, with a zero-visual-change budget.

**Problem**: Four elements carried `shadow-xs`. Tailwind 3 has no such class, so it generated nothing and they rendered flat, and nobody noticed, because an unknown class is not an error. Tailwind 4 defines `shadow-xs`, so the upgrade would have **added** four shadows that the site had never shown. The same shape appeared twice more. In v3, a responsive `sm:text-base` silently overrode an explicit `leading-relaxed`; in v4 the `leading-*` wins, so nine paragraphs would have grown taller. A reading of the classes says those elements already were `leading-relaxed` and already had a shadow. Only a measurement of what rendered says otherwise.

**Solution**: A computed-style diff of every element on all 87 pages (`tests/visual-diff.mjs`) against the v3 build found them. The dormant `shadow-xs` were removed, and the nine class lists now state the line height v3 actually applied.

**Rule**: An upgrade changes what *every* class means, including the ones that meant nothing before. Compare what renders (computed styles, pixels), never what the markup says, and treat a class that starts doing something after an upgrade as a change to decide on, not a free fix.
