---
id: lesson-010-an-untranslated-default-prop-leaks-the-defau
type: lesson
status: active
created: "2026-08-21"
owner: manu
tags: [web, i18n, astro]
---

# An untranslated default prop leaks the default locale into every page that omits it

**Context**: The Spanish homepage shipped `<html lang="es">` with a correctly translated
`<meta name="description">` and an **English** `<title>` — and `og:title` and
`twitter:title` inherited it, so that was also what got shared.

**Problem**: `BaseLayout` defaulted `description` to `t('meta.description')` but `title` to
`site.title`, a single English constant. Every page that passes an explicit title was fine,
which is why this hid: only `es/index.astro`, which passes no props at all, exposed it. One
prop went through the translation layer and its neighbour did not, and nothing in the type
system objects — both are `string`.

**Solution**: Moved the title into `i18n/ui.ts` as `meta.title` beside `meta.description`,
and **deleted** `site.title` rather than leaving an unreferenced English copy — keeping it
is what made the fallback reachable. Verified across the build: 0 ES pages carrying the
English brand title, EN unchanged.

**Rule**: In a bilingual layout, every prop default is a translation decision. A default
sourced from a language-neutral config file silently ships the default locale to every page
that omits that prop. Audit defaults as a group — if one goes through `t()`, they all
should — and when a value moves into the i18n layer, remove the old copy instead of leaving
it as a fallback nobody re-reads.
