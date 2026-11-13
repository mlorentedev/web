---
id: "lesson-085-an-unlayered-css-rule-beats-every-tailwind-u"
type: lesson
status: active
title: "An unlayered CSS rule beats every Tailwind utility, so an override meant to sit under them cannot be unlayered"
created: "2026-11-12"
owner: manu
tags: [web, css, tailwind, accessibility]
---

# An unlayered CSS rule beats every Tailwind utility, so an override meant to sit under them cannot be unlayered

**Context**: The dark palette redefines the role variables, but the typography
plugin's colours are literal hex in `tailwind.config.mjs`, so `.prose` text kept its
light colours. The first fix named those colours through the role variables in plain
CSS, outside any `@layer`, expecting nothing to change in light mode because each
variable resolves to the same hex there.

**Problem**: Light mode changed. Tailwind 4 emits real cascade layers (`theme`,
`base`, `components`, `utilities`), and an unlayered rule beats every layered rule
whatever its specificity. `.prose a` overrode `text-white` on the button-link inside
`/contact`'s prose (axe: 3.31:1), and `.prose h2` overrode the `prose-headings:text-ink-800`
modifiers on every note. "Same hex in light" was true of the variables and false of the
cascade. Only the axe run in both schemes showed it: 4 light failures next to 144 dark ones.

**Solution**: The prose rules moved inside the `prefers-color-scheme: dark` block, so
light mode is untouched by construction, and the element selectors gained
`:not([class])`, so an element carrying its own utility keeps it. The full fix is to
write the config's colours as `var()`, which removes the block.

**Rule**: In a Tailwind 4 stylesheet, put a rule outside `@layer` only when it must win
over everything, utilities included. A rule meant to beat a plugin but lose to
utilities has no layer that does that. Change the plugin's input instead, and audit
both colour schemes after any change to shared CSS.
