---
id: lesson-076-a-noindex-page-named-as-a-twin-s-alternate-i
type: lesson
status: active
created: "2026-11-04"
owner: manu
tags: [web, seo, i18n, sitemap]
---

# A noindex page named as a twin's alternate is a hreflang error, and a per-page noindex rule misses it

**Context**: Tag pages with fewer than two items became `noindex` (WEB-052), and the
sitemap had to drop them. The noindex decision was first written in `TagPage.astro`,
from the page's own items.

**Problem**: The two locales count differently: Spanish tag pages list projects only,
because no note is in Spanish. `/tags/kubernetes/` lists several items and stays
indexable, while `/es/tags/kubernetes/` lists one project and becomes noindex. The
English page still declared the Spanish one as its `hreflang="es"` alternate, because
`hasAlternates` only asked whether the other locale *builds* the tag. A per-page rule
cannot see this: each page is right about itself. Removing the twin check from
`tagPaths` makes `tests/tag-pages.test.mjs` list `/tags/ansible/ -> /es/tags/ansible/`
and `/tags/kubernetes/ -> /es/tags/kubernetes/`.

**Solution**: `tagPaths` decides both flags from both locales' counts: `noindex` from
this locale's, and `hasAlternates` only when the twin is built and indexable. The
sitemap reads the decision from the built HTML instead of re-deriving it:
`plugins/noindex-pages.mjs` is listed before `sitemap()`, and Astro runs
`astro:build:done` integration by integration in list order, so its scan of `dist`
is done before the sitemap calls `filter`. The `/es/notes/` special case in
`astro.config.mjs` went away with it.

**Rule**: When a page can become noindex, check the pages that point at it, not only
the page. Hreflang and the sitemap are claims about another URL, so the rule that
makes a page noindex must be read where those claims are written: from the built
output, or from one function that sees both locales.
