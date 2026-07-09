---
id: "WEB-026"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-07-09"
issue: "web#59"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-026: Rich project cards

> **Naming**: file lives at `<repo>/specs/<feature-id>/proposal.md`. `<feature-id>` is `AREA-NNN-slug` (e.g. `TOOL-001-secret-drift`).

## Why

<!-- from issue #59: WEB-026: Rich project cards (screenshot + metric + case-study link) -->

The landing (`index.astro`) and projects (`projects.astro`) pages render minimal, identical project cards (border + title + description + tags) via **duplicated markup**. For a portfolio whose pitch is credibility, this buries the hard proof — "67–82% fewer tokens", "3-second inference", "5-node bare-metal K8s" — inside prose, and gives every project the same flat visual weight. WEB-026 promotes one hard metric per project to a glanceable field, adds an explicit "View project" link, and extracts a single reusable card component so the two pages stop drifting. Part of epic WEB-010 (interactive CV). Refs #59.

## What

- A new `src/components/ProjectCard.astro` renders, per project: **title**, one structured **metric**, description, tags, and a **"View project →"** link (to the project's live `url` or `github`).
- `index.astro` (landing) and `projects.astro` (full list) both consume `ProjectCard` — the duplicated card `<div>` markup is deleted from both.
- `portfolio.ts` becomes **bilingual**: each project carries EN + ES `title`/`description`/`metric`; the card renders in the page's language from `Astro.currentLocale`. Shared metadata (`tags`, `url`, `github`, `featured`) is defined once per project.
- Card chrome labels (e.g. "View project" / "Ver proyecto") come from i18n `ui.ts`, so `/es/*` pages render correctly.

## Out of scope

Things this PR explicitly does NOT include. Forces a sharp boundary and prevents scope creep.

- **Preview screenshots** — deferred to a follow-up PR (this round ships metric + link only). The issue's "screenshot" acceptance is intentionally split out.
- **WEB-014 case-study content** and any `/projects/<slug>` deep pages — the link points at the existing repo/live URL, framed honestly as "View project", not "Case study".
- **WEB-012** full landing rebuild / interactive-CV layout — this is the card component only.

## Risks / open questions

Failure modes, dependencies, and unknowns to clarify before implementation. If any item here is unresolved, do not move to `tasks.md` yet.

- **[MUST RESOLVE] Contract change ripples.** Making `title`/`description`/`metric` per-language changes the exported `Project` type. Every consumer — `index.astro`, `projects.astro`, `tags/[tag].astro`, `es/tags/[tag].astro` — must be updated in the same PR or `astro check`/build breaks.
- **[MUST RESOLVE] Weak metrics.** Not every project has an equally "hard" number (e.g. `pdf-modifier-mcp`, `yt-metrics-cli`, `dotfiles`). Each project needs a decided, non-empty metric before implementation — the maintainer authors/approves the 8 headline metrics.
- **ES voice.** Draft ES translations must be reviewed in the maintainer's voice before merge (agent drafts, human approves).

## Acceptance criteria

Observable outcomes. Each must be testable.

- [ ] A single `src/components/ProjectCard.astro` renders title + metric + description + tags + "View project" link; **both** `index.astro` and `projects.astro` import it and no duplicated card `<div class="border ...">` block remains in either page.
- [ ] `portfolio.ts` exposes bilingual project data for all 8 projects; the `localize(project, lang)` helper resolves per-language fields by `Astro.currentLocale`. Where project cards render in ES today (the `/es/tags/*` pages) they show Spanish; EN surfaces show English. (Surfacing projects on the ES landing / an `/es/projects` list is WEB-012, out of scope.)
- [ ] Every rendered project card displays a **non-empty metric**.
- [ ] `astro check` passes with 0 errors and `astro build` completes (74 pages) with no dead/placeholder links in the card output.

## References

- Bitácora board: `web#59` (see the `issue:` frontmatter field); epic `web#40` (WEB-010).
- Related: `web#44` (WEB-014 case-study content — the deferred link destination), `web#42` (WEB-012 landing rebuild).
- Related patterns: `00_meta/patterns/pattern-spec-driven-development.md`; feature-flag SSOT precedent `src/data/features.ts` (WEB-027).
