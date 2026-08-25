---
id: lesson-012-html-entities-inside-a-t-value-render-liter
type: lesson
status: active
created: "2026-08-24"
owner: manu
tags: [web, i18n, astro]
---

# HTML entities inside a `t()` value render literally — the escaping happens twice

**Context**: Collapsing the forked `cockpit.astro` / `es/cockpit.astro` pages into one translated
body. 123 strings were lifted out of the markup and into `ui.ts` keys mechanically, by aligning the
two files and replacing each differing text node with `{t('key')}`.

**Problem**: Markup that had read `Target &lt; 100ms` rendered as the literal text `Target &lt; 100ms`
once the string lived in `ui.ts`. In the template the entity was HTML the browser decoded; as a `t()`
value it is a plain string, and Astro escapes the `&` on output, producing `&amp;lt;`. The same
applies to `&amp;`, `&rarr;` and friends. Type-checking cannot see it — the string is valid either
way — and it survived a build, a full `astro check` and a text-extraction diff, because a regex that
strips tags without decoding entities reports the broken and correct forms identically. It was caught
by looking at a screenshot.

**Solution**: Store the character, not the entity — `'Target < 100ms'`. Verified in the DOM rather
than in the HTML source, which is the only place the two forms differ visibly:

```js
document.body.innerText.match(/&amp;|&lt;|&gt;/g)   // → null
```

**Rule**: An i18n value is text, not markup. When lifting a string out of a template, decode any HTML
entity it carries first. And verify entity bugs against `innerText` in a browser — the built HTML
legitimately contains `&amp;` for a correctly rendered `&`, so grepping the source cannot tell a fixed
one from a broken one.
