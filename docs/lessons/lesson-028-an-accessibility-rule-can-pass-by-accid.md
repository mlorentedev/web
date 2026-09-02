---
id: lesson-028-an-accessibility-rule-can-pass-by-accid
type: lesson
status: active
created: "2026-09-01"
owner: manu
tags: [web, accessibility, testing, WEB-080]
---

# An accessibility rule can pass by accident, so fixing a neighbouring one makes it fail

**Context**: WEB-080 PR7 stripped seventeen phantom `tabindex="0" role="button"`
groups out of the inlined diagrams (`lesson-024`). axe went green. The check
audited `/lab` and `/es/lab` at 1440 px, in two console states — four clean runs.

**Problem**: it was green because it was only looking at one width, and the
fix had **created** a violation that only exists at another.

Adding 320 px to the loop produced `scrollable-region-focusable`, serious, two
nodes, both locales. Below the 754 px legibility floor the diagram scrolls inside
its own container — that is the design, and `lab-containment.mjs` asserts it. A
scroll container with no focusable content and no `tabindex` cannot be reached by
a keyboard at all, so **the right-hand half of both diagrams existed only for a
mouse**.

The part worth remembering is *why it had been green before the fix*: the
seventeen fake buttons counted as "focusable content", so the rule passed —
for a reason that had nothing to do with anyone being able to use the page. A
keyboard user could reach the scroller only by tabbing through seventeen controls
that announced nothing and did nothing. So the page moved from *reachable via
seventeen dead controls* to *not reachable at all*, and **neither state was ever
right**. One green run had been sitting on top of the other's defect.

**Solution**: one real stop replaces all seventeen.

```html
<div class="lab-diagram overflow-x-auto … focus-visible:ring-2 focus-visible:ring-accent-500"
     tabindex="0" role="group" aria-label={t('lab.diagram.scroll').replace('{label}', label)}>
```

`role="group"` rather than `region`, which would add a landmark per diagram; a
bilingual name, because a bare focusable `<div>` announces nothing; a focus ring
from the token layer, because a stop nobody can see is a stop nobody can use.
**37 focus stops → 22, and the two that remain scroll something.**

The width was added for a different reason than it paid off for, and that reason
still stands: **WCAG's contrast floor drops from 4.5:1 to 3:1 for large text**
(≥ 18pt, or ≥ 14pt bold), and this page sets type responsively — `text-2xl
sm:text-4xl` is large text at 1440 and normal text at 320. A colour can pass wide
and fail narrow with no branch in the source to notice.

Two smaller things that make the check worth its runtime:

- **It asserts that it ran.** A 404 and an axe bundle that never injected both
  report `violations: []`, indistinguishable from a clean page. So the HTTP
  status is checked and `passes` must be non-empty.
- **It prints what axe could not decide.** 79 results come back `incomplete` —
  the `<text>` nodes inside the SVGs, where the background is geometry rather
  than a CSS colour. Printed every run rather than filtered out: a check that
  hides what it could not decide is claiming more than it earned. And it matters
  practically, because `aria-prohibited-attr` is reported the same way, so a
  check that fails only on violations would miss it.

**Takeaway**: accessibility rules are coupled, and a green result carries no
information about *why* it is green. Assume any pass may be incidental —
especially one adjacent to something you are about to change — and re-run the
whole suite after each fix rather than the rule you were working on. Audit at
more than one viewport, because responsive type and responsive overflow move the
thresholds under you. And treat a first green run as a hypothesis: the question
is not "did it pass" but "what would have to be true for this to pass, and is
that the thing I wanted".

**Related**: `lesson-024` (the fix that exposed this), `lesson-022` (a number
nobody questions), `lesson-016` (a test that only ever runs against the fix).
