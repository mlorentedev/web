---
id: lesson-013-removing-a-theme-override-reveals-the-plug
type: lesson
status: active
created: "2026-08-24"
owner: manu
tags: [web, tailwind, css, verification]
---

# Removing a theme override reveals the plugin default, it does not remove the property

**Context**: WEB-068 asked for a colour token layer with zero visual change, and for the dead
`typography.DEFAULT.css.maxWidth = '85ch'` in `tailwind.config.mjs` to be resolved either way. All
nine `prose` consumers set `max-w-none`, so the override had never applied to a rendered page.

**Problem**: Deleting the line looked free. It was not quite: `.prose` did not lose its `max-width`,
it fell back to what `@tailwindcss/typography` ships.

```css
- .prose{color:#334155;max-width:85ch}
+ .prose{color:#334155;max-width:65ch}
```

A config override is a *replacement* for a plugin's value, not the reason the property exists.
Removing it hands the decision back to the plugin, which has an opinion of its own. Had any consumer
not carried `max-w-none`, that would have narrowed the measure from 85 to 65 characters on a live
page — a visible change shipped inside a commit whose entire claim was that nothing changed.

Two things made it safe here, and neither was obvious from reading the diff: every consumer sets
`max-w-none`, and `max-w-none` sits in the utilities layer, which the cascade puts after the
components layer the plugin writes into. Same specificity, later wins.

**Solution**: Prove it rather than reason about it. Build `master`, build the branch, compare every
page with the asset hashes normalized:

```
HTML: 0/77 pages differ
CSS:  one declaration, .prose max-width 85ch -> 65ch
```

Zero pages differing is what turns "no consumer can see that rule" from an argument into a
measurement. The same harness proved the seven colour aliases were byte-identical to the literals
they alias — compiled both and compared the emitted `rgb()`, instead of trusting that `accent-700`
resolves to `cyan-700`.

**Rule**: Deleting a value from `theme.extend` does not delete the declaration — it restores the
plugin's. Before removing one, check what the plugin ships and whether anything downstream was
relying on the override to *not* be the default. And when a change claims zero visual change, diff
the built output page by page; a claim about what a stylesheet cannot affect is exactly the kind that
is cheap to verify and embarrassing to get wrong.
