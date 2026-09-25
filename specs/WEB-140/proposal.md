---
id: "WEB-140"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-09-24"
issue: "mlorentedev/web#398"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-140

> **Naming**: file lives at `<repo>/specs/WEB-140/proposal.md`. `WEB-140` is `AREA-NNN-slug` (e.g. `TOOL-001-secret-drift`).

## Why

<!-- from issue #398: WEB-140: the home becomes the cover letter — the door first, proof in three pieces, notes last -->

The site exists to get Manu hired, freelance or by a company (vault `10_projects/web/brand-package.md` §0), but the
home is built for another goal: seven sections, the platform and the notes first, with the bio and the offer on other
pages or at the bottom. A hiring manager or a client landing on the home has to go looking for who this is, what they
get and how to hire him, and a cover letter that makes the reader search has already failed. web#401 already made the
door the hero's primary button; this spec covers the rest of the page.

## What

The home reads as a cover letter, top to bottom (decided with Manu 2026-09-24, from #398):

1. **Hero:** the label, the H1 unchanged (#247), the door as the primary button (done in web#401), and "see the proof"
   as the secondary button, scrolling to block 3, in place of "Explore my platform".
2. **Who I am:** the bio (web#396) and the Timeline move up to second place.
3. **Proof in three pieces**, each linked: the Teledyne chain (onboarding 120 → 20–30 days) · KubeLab → `/lab` ·
   agents → `/ai`, rendered from `src/data/proofs.ts` (teledyne entry owned here, kubelab/agents by WEB-141).
4. **How the work starts:** the home renders the same contact markdown as `/contact` (one project at a time, the door,
   the ladder from `data/offer.ts`, "not for you if"), so the two can never disagree.
5. **Latest notes**, small, at the bottom.

The home sections that do not fit (IdpStrip, ProofSurface, Projects, Community) leave the home or fold into block 3;
which one gets which fate is settled under Risks.

## Out of scope

Things this PR explicitly does NOT include. Forces a sharp boundary and prevents scope creep.

- **`/lab` and `/ai` content**: WEB-141 (#402). The home links to them and renders a one-line summary from
  `data/proofs.ts`; it does not edit those pages.
- **The ES funnel pages (#342) and `llms.txt` (#128)**, which have their own tickets.
- **Visual redesign and new copy**: the current style stays, and the words come from `brand-package.md`. This spec
  reorders and reuses; it does not invent text.

## Risks / open questions

Failure modes, dependencies, and unknowns to clarify before implementation. If any item here is unresolved, do not move to `tasks.md` yet.

**Fate of the sections that do not fit (decided with Manu 2026-09-24):**

- **IdpStrip leaves the home.** It also breaks brand-package §7 today: "8 Nodes Active" / "35 Services" are banned
  counts (#133/#355), and "99.9% Uptime" is a hand-written string with no data behind it. The KubeLab proof → `/lab`
  replaces it.
- **ProjectsSection leaves the home.** Eight cards are a portfolio, not a cover letter; KubeLab and Hive are already in
  the proof block, which ends with an "all projects →" link to `/projects`.
- **ProofSurface leaves the home.** Repo and star counts (14, Hive 8) subtract more than they prove.
- **CommunitySection leaves the home;** its content becomes the last paragraph of Manu's bio markdown (text agreed:
  ES "Fuera del trabajo participo en Cloud Native Sevilla y en NaN, una comunidad de gente que construye con IA, y doy
  alguna charla cuando puedo. Y remo." / EN "Outside work I'm part of Cloud Native Sevilla and NaN, a community of
  people building with AI, and I give the odd talk when I can. And I row."). No figures, so `bio.test` still holds.

**Must resolve before code:**

- **One template, both languages (#142).** `/` and `/es/` stay two pages in their own language; they render through one
  `HomePage` component, as `/contact/` does since web#401, so they cannot drift.
- **One H1 on the home.** The contact markdown opens with an H1 ("I take one project at a time."); rendered inside the
  home it must come out as an H2.
- **`data/proofs.ts` is shared with WEB-141 (#402).** Whoever lands first creates it; `teledyne` is owned here,
  `kubelab` and `agents` by WEB-141. `agents` is claim-only until #238 settles. No node or service counts.

**Known, accepted:**

- The hero's "What I build on it" → `#projects` link goes; the secondary button becomes "see the proof" → `#proof`.
- `/projects` exists in English only, so the Spanish home's "all projects →" lands on an English page.
- WEB-141 plans to touch `data/portfolio.ts` (#31); the other session announces it before doing so.
- Work lands as small PRs, one step each: (1) `HomePage` for both locales, (2) drop the four sections + bio paragraph,
  (3) proof block, (4) the door block on the home.

## Acceptance criteria

Observable outcomes. Each must be testable.

- [ ] Outcome 1
- [ ] Outcome 2
- [ ] Outcome 3

## References

- Bitácora board: the GitHub issue / Project item tracking this spec (see the `issue:` frontmatter field)
- Related ADR: `<repo>/docs/adr/adr-XXX.md` (if any)
- Related patterns: `00_meta/patterns/<pattern>.md` (if any)
