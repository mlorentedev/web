---
id: "WEB-012"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-07-09"
issue: "web#42"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-012: Interactive-CV landing (credibility band + experience timeline)

> WEB-012 (#42) is an epic-sized landing rebuild, delivered in increments under the one issue.
> Design language is locked (miia restraint + roger.ac bracketed `[ NN / ]` sections + rubendelcampo
> calm; WEB-011 shipped it). "santi substance, restraint skin" — santi is the majority source for the
> *engine/IA* (experience-first spine, proof, cases), NOT the visual look (confirmed 2026-06-26).
>
> - **Increment 1 — quantified-credibility band** — MERGED (PR #72, `[ 00 / By the numbers ]`).
> - **Increment 2 — experience timeline** — MERGED (PR #74, `[ 01 / My path | Mi camino ]`).
> - **Increment 3 — ES landing parity + EN-ES componentization** — THIS PR. Extract the 4 landing sections
>   (projects/stack/community/notes) into shared bilingual components; EN + ES landings compose the same
>   set → structural parity, no drift. The Spanish newsletter essay (`es-home.mdx`) is **preserved** at a
>   new `/es/newsletter` route, not deleted. (User chose full parity, 2026-07-09.)

## Why

<!-- from issue #42: WEB-012: Rebuild landing as interactive CV (experience timeline + quantified credibility band) -->

The landing states the positioning ("Platform engineering for AI workloads") but the *proof* — the hard, verifiable numbers that back it — is scattered inside prose and project cards. The reference analysis (miia.dev) shows a quantified-claim band as the cheapest, highest-signal credibility device for a senior/platform profile. Adding one gives an at-a-glance "this person operates real systems" before the visitor reads a word of prose. It's the thin-MVP first brick of the WEB-010 interactive-CV migration (anti polish-vs-build-trap).

## What

- A new `src/components/CredibilityBand.astro` renders a bracketed `[ 00 / By the numbers ]` section with ~4 quantified stats: **40** homelab services, **67–82%** Hive token reduction, **N** projects shipped (derived from `portfolio.ts`), **N** field notes (derived from the published notes collection). The numbers are language-agnostic facts — identical on both bands; only the labels translate.
- The band renders on **both** landings (`index.astro` and `es/index.astro`) in the correct language via i18n, placed directly after the hero.
- Counts that can drift (projects, notes) are **derived at build time**, not hardcoded, so the band stays honest as content grows.

**Increment 2 — experience timeline (this PR):**
- A new `src/components/Timeline.astro` + `src/data/experience.ts` (bilingual, condensed from the canonical CV in `resume/data/cv.yml`) render a `[ 01 / My path | Mi camino ]` section: 4 roles as `period · role · company · location` + one metric-first highlight each, on both landings.
- Existing landing sections renumbered (projects `01→02`, stack `02→03`, community `03→04`, notes `04→05`) so the spine reads `00 numbers → 01 path → 02 build → …`.

## Out of scope

- **ES landing full parity / EN-ES componentization** — WEB-012 increment 3 (kills the `es/index.astro` markdown drift).
- The RAG bot (WEB-045), proof-surface dashboards (WEB-019), case-study content (WEB-014), email funnel (WEB-043) — separate WEB-010 children.
- Any new visual language — reuse the WEB-011 skin (bracketed labels, Roboto, cyan accent).

## Risks / open questions

- **Hardcoded "40 services"** must match the hero copy ("40-service homelab") — single source is the claim, not a live count. If the homelab count is stale, both are; acceptable for a marketing figure. (No live telemetry this increment — that's PS1/WEB-019.)
- **Note count is language-agnostic** (RESOLVED during impl): all 16 notes are `lang: en` today, so a per-lang filter renders "0" on the ES band. The band shows total published notes (a proof-of-output fact, same on both bands); only labels translate. 15 published (1 placeholder is the sole draft, excluded) — honest, matches `/notes`.
- **`[ 00 / ]` numbering** must sit above the existing `[ 01 / What I build ]` — verify section order reads 00 → 01 → 02.

## Acceptance criteria

- [ ] `src/components/CredibilityBand.astro` renders a bracketed-label section with ≥4 stats; each stat has a value + label.
- [ ] The band appears on both `/` and `/es/` after the hero, before the projects section, labelled `[ 00 / … ]`.
- [ ] Project and note counts are derived (not literals): the rendered project count equals `projects.length` (8); the note count equals the published-notes total (15) and is identical on the EN and ES bands.
- [ ] `astro check` passes (0 errors) and `astro build` completes (74 pages) with the band present in `dist/index.html` and `dist/es/index.html`.

**Increment 2 (timeline):**
- [ ] `Timeline.astro` renders 4 experience roles on both `/` and `/es/`, labelled `[ 01 / My path | Mi camino ]`.
- [ ] Timeline is bilingual: EN "My path" / ES "Mi camino", roles + locations translated, ongoing role shows "Present"/"Actualidad".
- [ ] Landing section numbering reads `00 01 02 03 04 05` with no gaps after inserting the timeline.

## References

- Bitácora: `web#42` (WEB-012), epic `web#40` (WEB-010).
- Reference analysis: vault `10_projects/kubelab/business/strategy/interactive-cv-reference-analysis-2026-06-13.md` §2 (miia quantified band), §2c (roger.ac telemetry panel), §4 (decisions locked).
- Precedent: WEB-011 (bracketed section motif), WEB-026 (`ProjectCard`, bilingual `portfolio.ts`).
