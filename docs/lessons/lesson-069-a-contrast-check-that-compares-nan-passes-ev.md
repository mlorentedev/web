---
id: "lesson-069-a-contrast-check-that-compares-nan-passes-ev"
type: lesson
status: active
title: "A contrast check that compares NaN passes every page"
created: "2026-11-04"
owner: manu
tags: [web, testing, accessibility]
---

# A contrast check that compares NaN passes every page

**Context**: The audit of 2026-11-03 found the loop's lobe labels on `/` at 2.54:1
(`fill-ink-400` at 11px on white), below the 4.5:1 of WCAG 1.4.3. axe audits every
built page since #544, and it never reported them: the SVG is `aria-hidden="true"`,
and axe skips content hidden from assistive technology. The text is painted all the
same. WEB-178 (#555) added a browser check that reads each SVG `<text>`'s computed
fill and what it is painted on.

**Problem**: The first version passed on master, with the 2.54:1 labels still there.
`backdrop()` in `tests/lib/focus.mjs` returns a list, one colour per gradient stop
behind the element, and the check treated it as one colour. `composite` and
`contrast` then returned `NaN`, and `NaN < 4.5` is false, so every text passed
without a single colour being read.

**Solution**: The check maps the text over every backdrop candidate and takes the
minimum, and it throws when the ratio is not a finite number. Run against master it
now fails on exactly the four loop label readings (`/` and `/es/` at both widths),
and on 180 diagram labels the audit had not seen, filed as WEB-182 (#559).

**Rule**: A threshold check must be seen failing on a known bad case before its pass
means anything. Guard the number it compares (`Number.isFinite`), because any
comparison with `NaN` is false and reads as a pass. And an `aria-hidden` graphic
still needs its own contrast check: axe's silence about it is not a pass.
