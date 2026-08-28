---
id: lesson-019-a-guard-that-cries-wolf-is-worse-than-th
type: lesson
status: active
created: "2026-08-27"
owner: manu
tags: [web, verification, testing, review]
---

# A guard that cries wolf is worse than the hazard it guards, and an untested guard will

**Context**: WEB-080's diagram pipeline minifies a CSS subset by stripping whitespace. That
is safe for what archify emits today but would corrupt a `url(data:…)` or a quoted
`content` value. Review suggested documenting the limit more prominently, or skipping
minification for those inputs.

**Problem**: Both suggestions are weaker than making the limit enforce itself — skipping
silently ships unminified CSS nobody knows about, and a comment relies on somebody reading
it. So the guard became a refusal:

```js
const unsafe = css.match(/url\(|content\s*:/);
if (unsafe) fail(`the stylesheet now contains ${unsafe[0]}, which …would corrupt.`);
```

Which was correct in intent and wrong in fact. `content\s*:` matches the substring inside
**`align-content:`, `justify-content:` and `place-content:`** — ordinary flexbox
properties. It did not fire on today's stylesheet, so every check was green: `generate`
ran, the committed SVG stayed byte-identical, the suite passed. The failure was latent, and
the first flexbox rule archify ever adds to those 35 kept rules would have failed the build
with a message about a corruption risk that did not exist.

**Solution**: A property boundary, `/url\(|(?<![-\w])content\s*:/`, verified against all
three false positives and both true ones. But the more useful finding is *how* it surfaced:
by re-reading the regex, not by running anything. Nothing executed it against
`align-content` because **the guard had no test** — it had been checked by hand in a shell,
and that evidence went into a PR comment instead of into the suite. Both pure functions
were exported and covered in the same commit, the `align-content` case among them.

**Rule**: A guard is code, and code that has only ever been run against the input it was
written for has been demonstrated, not tested. Give every guard a test with three cases:
the hazard it must catch, an ordinary input it must pass, and the **near-miss it must not
mistake for the hazard** — the third is the one that fails, and the one hand-checking never
produces, because you check what you were thinking about. Evidence pasted into a PR comment
protects one commit; a test protects the next reader.
