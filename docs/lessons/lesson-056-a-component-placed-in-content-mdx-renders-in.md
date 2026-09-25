---
id: lesson-056-a-component-placed-in-content-mdx-renders-in
type: lesson
status: active
created: "2026-09-24"
owner: manu
tags: [web, astro, mdx, i18n, content]
---

# A component placed in content MDX renders in the page's locale

**Context**: #401 rewrote `/contact` so the copy is Manu's to edit in markdown
(`content/pages/{en,es}-contact.mdx`), while every price and duration lives once in
`src/data/offer.ts`. The obvious layout puts the prose in the markdown and has the page
append the offer and the button after it. That fixes the page's order in code, and the
agreed order interleaves them: the prose, then the button, then the offer, then
"not for you if".

**Problem**: The fix is to let the markdown place the pieces itself: `import Door` and
`import Offer`, then `<Door />` and `<Offer />` where they belong. That only works if a
component rendered from a content-collection entry knows which locale it is in. It gets
no `lang` prop, and the entry is rendered by `render(entry)` inside the page, not routed.

**Solution**: It does know. A component placed in the MDX renders in the request
context of the page that calls `render(entry)`, so `getLocale(Astro.currentLocale)`
returns `es` on `/es/contact/` and `en` on `/contact/`. The built pages prove it: the
Spanish offer block says "Sesión de 60 minutos · desde $300" and the English one
"60-minute session · from $300". `tests/contact.test.mjs` pins it by requiring both
locales to quote the same figures, and the markdown to state none.

**Rule**: When copy must stay editable in markdown but some of its content has to come
from data, place components from the MDX and let them read `Astro.currentLocale`, not a
prop. The markdown owns the order, the component owns the data, and a test forbids
figures in the markdown so the data cannot be restated there. One side effect to expect:
MDX turns straight quotes into curly ones, and strings in a `.ts` file do not, so write
typographic quotes in the data (`’`, `“ ”`) or the two halves of the page will disagree.
