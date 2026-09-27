---
id: lesson-058-astro-drops-the-line-break-between-an-expres
type: lesson
status: active
created: "2026-09-26"
owner: manu
tags: [web, astro, templates, copy]
---

# Astro drops the line break between an expression and the next node

**Context**: #417 moved the monthly cloud spend on `/lab/idp` into a `SpendFigure`
component, so the stats line became an expression, a text separator, the component and a
parenthesis, one per line:

```astro
{t('idp.catalog.stats').replace(...)}
· {t('idp.catalog.spendLabel')}
<SpendFigure ... />
({t('spend.basis').replace('{month}', formatSpendMonth(lang))})
```

**Problem**: The built page read "27 componentes de plataforma· gasto cloud mensual25,10
US$(septiembre de 2026…". The whitespace that began with a line break, between an
expression's closing brace and the next text or component, and between a component and
the text after it, did not reach the HTML. Every test was green, `lab-figures.test.mjs`
included: it reads the figure's own element and the page's text nodes, and a missing
space changes neither. Only reading the rendered string showed it.

**Solution**: Put the spaces inside expressions, where the compiler keeps them:

```astro
{` · ${t('idp.catalog.spendLabel')} `}
<SpendFigure ... />
{` (${t('spend.basis').replace('{month}', formatSpendMonth(lang))})`}
```

The rebuilt page reads "27 componentes de plataforma · gasto cloud mensual 25,10 US$
(septiembre de 2026, …)".

**Rule**: In Astro, a line break between inline nodes is not a space. When a sentence is
built from expressions and components on separate lines, write its spaces inside the
expressions (`{' '}` or a template string), then read the rendered text of the built
page, not only the tests that pass over it.
