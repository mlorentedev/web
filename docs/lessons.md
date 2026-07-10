---
id: "web-lessons"
type: lesson
status: active
tags: [web, mlorente-dev]
created: "2026-06-23"
owner: manu
---

# web — Lessons Learned

> Patterns learned, errors avoided, and gotchas for the mlorente.dev / kubelab.live
> frontend. Project-bound lessons stay here; cross-project ones go to the vault `00_meta/`.
>
> **Protocol**: Update after every important correction or discovery.

## Format

    ### [DATE] Lesson Title

    **Context**: What I was doing

    **Problem**: What went wrong or what I discovered

    **Solution**: How I resolved it

    **Rule**: Pattern to follow going forward

## Lessons

### [2026-07-09] Bilingual data is a type-contract change — grep ALL consumers, not the obvious ones

**Context**: WEB-026 then WEB-012 — restructuring `portfolio.ts` (and later the landing section data) from a flat single-language shape into per-language `{ en, es }` objects read through a `localize(item, locale)` helper.

**Problem**: Changing a data module's shape from `{ title, description }` to `{ en: {…}, es: {…} }` is a breaking type change for *every* importer. The estimate assumed ~2 consumers; there were actually **5** — `index.astro`, `projects.astro`, both `tags/[tag].astro` pages, and the `ProjectCard` component. The missed call sites don't fail at the edit site; they surface downstream as `astro check` type errors or wrong-language renders.

**Solution**: Before touching the shape, grep all of `src/` for every import of the module *and* every field access (`project.title`, `.description`, …), then migrate all sites in the same PR. `astro check` (0/0/0) is the backstop that proves no consumer was left on the old shape.

**Rule**: Treat a data-module shape change as a public-contract change: enumerate every consumer by grep first (imports + field accesses), migrate them atomically, and let the type-checker prove completeness. "It's just a data file" undercounts the blast radius.

### [2026-07-09] `grep -c` counts matching LINES, not matches — useless on minified HTML

**Context**: Verifying the WEB-012 landing build — counting how many `ProjectCard` / `data-metric` / bracketed-section markers appear in `dist/index.html` and `dist/es/index.html`.

**Problem**: `grep -c 'data-metric' dist/index.html` returned `1` for content that plainly appeared 8 times. Astro's build minifies HTML onto essentially one line, and `grep -c` counts matching *lines*, so it reports `1` no matter how many matches share that line — a silently wrong verification signal that reads as "the element is barely there".

**Solution**: Count matches, not lines: `grep -o 'data-metric' file | wc -l`, or normalize whitespace first (`tr '>' '>\n' < file | grep -c …`) so each element lands on its own line.

**Rule**: When grepping minified / single-line build output, never use `grep -c` for a count — use `grep -o … | wc -l`. `-c` is "lines with a match", which collapses to 0/1 on minified HTML and will quietly under-report.

### [2026-06-28] Feature-flag grep: verify the precise signal, not a broad token

**Context**: Verifying WEB-027 feature flags — ensuring the footer YouTube link was gated off correctly.

**Problem**: The acceptance criterion said `grep -r "youtube" dist/` should find nothing when the flag is off, but the site has a content tag literally named `youtube` (`/tags/youtube/`), so a bare grep always hits — false positive.

**Solution**: Narrowed the executable check to grep for the specific footer URL `youtube.com/@mlorentedev` — the precise signal for "is the footer anchor present".

**Rule**: When verifying a feature toggle by grepping build output, grep for the *specific rendered content* (URL, class, text node), not a broad token that could match unrelated content taxonomy.

### [2026-06-25] release-please on a history-carrying repo replays the whole inherited log

**Context**: First semver release of `web` after extracting it from the kubelab
monorepo *with full git history* (ADR-053), with release-please newly wired up.

**Problem**: The first release-please run swept the *entire inherited* history into a
single "first" release — a CHANGELOG replaying kubelab-era commits (#93/#94, ADR-020,
#613…) and version `0.2.0`. That was a **downgrade**: the manifest had been seeded at
`0.1.0` while `version.txt` already carried the component's real `1.1.2`, and `0.2.0`
sorts below images that already existed in the registry (`1.0.0`…`1.1.1`). It merged
before being caught, cutting a `v0.2.0` tag + GitHub Release + Docker image.

**Solution**: Reverted (restored manifest + `version.txt` to `1.1.2`, dropped the bogus
CHANGELOG section), deleted the `v0.2.0` tag/Release/Docker tag. Anchored the changelog
with `bootstrap-sha` at the bad-release commit so the first real release only considered
post-extraction commits, and seeded the manifest to the real `1.1.2`. The next (forced)
release cut a clean `v1.2.0`.

**Rule**: When wiring release-please into a repo that carries inherited history (monorepo
extraction, fork), BEFORE the first run: seed `.release-please-manifest.json` to the
component's real current version AND set `bootstrap-sha` to the extraction boundary.
Otherwise the first release replays all history and can silently downgrade. Remove
`bootstrap-sha` once the first release PR merges.
