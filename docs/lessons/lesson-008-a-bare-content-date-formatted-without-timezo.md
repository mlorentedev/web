---
id: lesson-008-a-bare-content-date-formatted-without-timezo
type: lesson
status: active
created: "2026-08-21"
owner: manu
tags: [web, i18n, dates]
---

# A bare content date formatted without `timeZone` renders a day early

**Context**: Auditing `mlorente.dev`. Every visible date on every note was one day
earlier than its frontmatter — all 15 published notes, 100% of the corpus.

**Problem**: Content dates are bare `YYYY-MM-DD`. `z.coerce.date()` parses that as **UTC
midnight**. The four `toLocaleDateString` call sites passed no `timeZone`, so each
formatted in the *build machine's* zone — `America/Denver`, UTC-6 — rolling the date back
a day. Nothing failed: the build was green, `astro check` was clean, and the wrong date
looked entirely plausible. It only surfaced by comparing rendered output against
frontmatter.

**Solution**: `timeZone: 'UTC'` on every call that formats a content date. Proven by
building the same tree both ways and diffing the emitted HTML: `2025-05-26` rendered
`May 25, 2025` before and `May 26, 2025` after. Then checked all 15 against their
frontmatter programmatically — 15 correct, 0 wrong.

**Rule**: A date with no time component is a *calendar* date, and formatting it is a
timezone operation whether or not you asked for one. Always pass `timeZone: 'UTC'` when
rendering a bare `YYYY-MM-DD`, and put the call behind one helper so the option cannot be
dropped at one of N sites. Verify by comparing rendered output to the source data, never
by reading the code — this class of bug produces plausible output, so a green build proves
nothing.
