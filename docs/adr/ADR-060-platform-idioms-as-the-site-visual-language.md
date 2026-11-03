# ADR-060: Platform idioms are the site's visual language

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** Manu Lorente
- **Scope:** the look of the home, `/lab` and the footer; the content rework under #499

## Context

The site sells an SRE and AI platform engineer who came up from silicon,
firmware and customer work. Its look was neutral: text, a table, a button. Manu
asked for something more visual and more engineering-like, with a nod to the
tools that profile lives in (GitHub, GitLab, Grafana, the DevOps loop), without
losing the minimal style.

A nod can go wrong in two ways. Lifted from a product (its logo, its colours,
its name), it reads as a costume and borrows a brand. Drawn with nothing behind
it, it reads as decoration. Either way it costs credibility with the readers it
is meant to convince.

## Decision

The site borrows the **idioms** of platform tooling, never the brands, and only
where real data stands behind them.

| Surface | Idiom | Data behind it |
|---|---|---|
| Under the hero | the DevOps loop, with the career on it | `data/loop.ts`, held to `data/experience.ts` |
| Skills ("Qué hago") | label pills with path-style keys (`platform/idp`) | `data/skills.ts` |
| Timeline | a `HEAD` ref on the ongoing role | `experience.ts` (`end: null`) |
| `/lab` figures | stat tiles: large mono number and unit | the figures `/lab` already publishes |
| `/lab` access table | status-page rows: dot and word | the weekly access check |
| Footer | a sync chip with the deployed `sha` | `version.json` at build |

Rules every one of them follows:

1. **No brand.** No logo, no colour copied from a product, and no user-visible
   string or alt text saying "GitHub-style" or naming the product imitated.
2. **Site tokens only.** Ink and accent from `src/styles/tailwind.css`. A new hue
   is a token first.
3. **Text carries the meaning.** Colour and shape only support it; anything
   drawn has a text equivalent for screen readers.
4. **Built, not run.** Rendered at build time from `src/data/*`, as HTML or inline
   SVG; no client script, no runtime fetch.
5. **Few surfaces.** The table above is the list. A seventh needs this ADR
   amended, so the idiom stays a nod and not a theme.

The hero title and the honesty tests (`tests/home.test.mjs`) are outside this
decision and stay as they are.

## Consequences

- Each surface ships as its own small PR and cites this ADR instead of
  re-deciding the direction.
- A drawing that states facts (years, stations) gets a test tying it to the data
  file that sources them, as `tests/career-loop.test.mjs` does for the loop.
- Rejected: a `kubectl`-style table on the home (the timeline had just left a
  table), `$` shell prompts (a cliché; the `[ SECTION ]` headings already nod to
  code), and Backstage-style cards (read only by people who know IDPs).
