---
id: "WEB-022"
type: spec
status: implementing # draft | implementing | verifying | archived
created: "2026-09-22"
issue: "mlorentedev/web#7"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-022: Astro 7 and Tailwind 4

> **Naming**: file lives at `<repo>/specs/WEB-022/proposal.md`.

## Why

<!-- from issue #7: WEB-022: plan Astro 7 migration (bump all @astrojs/* together) -->

The site is on Astro 5.18.2, and eleven Dependabot alerts are gated on leaving it. One of them is **critical**: remote code execution through AVIF image optimisation, fixed in astro 7.2.8. Exposure is low, because the site is `output: 'static'` and image processing only sees committed images. But it is code execution at build time on a runner that holds `DOCKERHUB_TOKEN`, and that is the supply-chain shape to close. Dependabot's own attempt (`#368`, astro alone) cannot go green: the migration only works if the framework and its integrations move together.

## What

Measured on 2026-09-22 before this spec was written. The detail is in `verification.md` § Pre-spec measurement.

1. **Tailwind is decoupled from `@astrojs/tailwind`.** The integration is deprecated, and its peer range stops at astro 5, so npm refuses to install it beside Astro 7. It did exactly two things: register `tailwindcss` and `autoprefixer` as PostCSS plugins, and inject `@tailwind base/components/utilities` into every page. The site now does both itself: `postcss.config.mjs`, plus one import in `BaseLayout.astro`, the only file that emits `<html>`.
2. **Astro 7.** The following move together: `astro` ^7.3.4, `@astrojs/mdx` ^8, and `@astrojs/markdown-remark` ^7.3 (added explicitly, because Astro 7's default processor is Sätteri and `rehypeMermaid` runs on unified). `@astrojs/language-server` gets an in-range update to 2.17.1, which lifts the `yaml` 2.7.1 pin. The config loses `i18n.routing.redirectToDefaultLocale`, which Astro 7 rejects when `prefixDefaultLocale` is `false`; in Astro 5 it had no effect in that combination.
3. **Deprecations cleared.** Schemas import `z` from `astro/zod` rather than `astro:content` (18 `ts(6385)` hints). The mermaid plugin moves from `markdown.rehypePlugins` to `markdown.processor: unified({ rehypePlugins })`, which silences the "will be removed in a future major" warning.
4. **Tailwind 4.** `tailwindcss` ^4 runs through `@tailwindcss/vite`, which replaces the PostCSS wiring from (1). The v3 JS config (`tailwind.config.mjs`) becomes CSS-first configuration, and the three consumers of `tailwindcss/colors` keep working (`scripts/diagrams.mjs`, `tests/lib/audit.mjs`, and the ghchart colour segment named in `src/theme/tokens.mjs`).

**PR sequence (decided 2026-09-22):**
- **PR1**: What (1), on Astro 5.
- **PR2**: What (2). This is the security fix, and it ships as soon as it is green.
- **PR3**: What (3).
- **PR4**: What (4).

Each PR is independently releasable. The order puts the critical fix in front of the migration that changes how the site looks.

## Out of scope

- Visual redesign. PR4 changes the toolchain, not the design. Any colour shift it introduces is a defect to minimise, not an opportunity.
- The nondeterministic mermaid SVG filenames. Two identical builds of master produce different `beoe/*.svg` names; that is pre-existing and ticketed as `#378`.
- `dependabot.yml`. The majors `ignore` stays, because it is lifted per planned migration and this migration bumps by hand.
- The 26 `MODULE_LEVEL_DIRECTIVE "use astro:head-inject"` build warnings. They are upstream: already reported as withastro/astro#18087, with a fix open in withastro/astro#18088, so this repo has no ticket. They go away with the astro release that ships the fix.

## Risks / open questions

- **PR4 palette. Resolved 2026-09-22 (Manu): pin the v3 hex values.** The seven token families are declared in `@theme` with their current hex, so Tailwind 4 changes no colour. The hex consumers (`scripts/diagrams.mjs`, `tests/lib/audit.mjs`, the ghchart segment) keep receiving hex, and AC6's screenshot budget is near zero. OKLCH was the alternative; it would have shifted the colours and needed contrast re-measured.
- **PR4 utility renames.** v4 renames or rescales utilities (`shadow-sm`, `rounded`, `ring`, and the default border colour becoming `currentColor`). The official upgrader got as far as the stylesheet and failed before the template pass, on a module lookup while the install was in flight. Re-run it after `npm install` has settled and review its diff line by line.
- **Equivalence evidence does not survive the PR.** The baseline-vs-candidate `dist/` diffs are one-off measurements, recorded in `verification.md`. What lasts is the guard tests (AC1, AC3).
- **Node.** Astro 7 needs `>=22.12`. `.nvmrc` is `22`, and the image is `node:22-bookworm-slim`; both resolve above that. The floor is noted here; nothing needs to change.

## Acceptance criteria

- [ ] **AC1 — Tailwind decoupled with zero output change (PR1).**
  - `@astrojs/tailwind` is gone from `package.json` and the lockfile.
  - On Astro 5, the built stylesheet is byte-identical to master's, apart from `global.css`, which is now appended to it rather than inlined; the cascade position is the same, after Tailwind.
  - Every page is identical to master after normalising asset hashes, mermaid filenames and that moved block.
  - A committed test fails if the built CSS loses Tailwind's preflight or a utility the site uses. It is shown red by removing the import.
- [ ] **AC2 — The advisories close (PR2).** The lockfile resolves `astro` ≥ 7.2.8, `sharp` ≥ 0.35.4, `esbuild` ≥ 0.28.1 and `yaml` ≥ 2.8.3, and `npm audit` reports 0 vulnerabilities. After merge, none of the eleven alerts listed on `#7` is open (`gh api repos/mlorentedev/web/dependabot/alerts?state=open`).
- [ ] **AC3 — Peers stay consistent (PR2).** A committed test fails when any installed package declares an `astro` peer range that the installed `astro` does not satisfy. It is shown red against `#368`'s lockfile, which is the failure class that reopens this ticket.
- [ ] **AC4 — Astro 7 without regression (PR2).**
  - `npm run build` passes, with 0 `astro check` errors, and builds the same page set as before.
  - The visible text of every page is identical to the pre-PR build.
  - `npm test`, `test:browser` and `test:a11y` are green.
- [ ] **AC5 — No deprecation left behind (PR3).** The build prints no `[astro] … deprecated` line, and `astro check` reports no `ts(6385)`. Every page is identical to the pre-PR build, mermaid SVG content included, after the same normalisation as AC1.
- [ ] **AC6 — Tailwind 4 (PR4).**
  - `tailwindcss` ^4 runs through `@tailwindcss/vite`; neither `postcss.config.mjs` nor a JS Tailwind config remains.
  - `diagrams.mjs verify` passes, and `tests/lib/audit.mjs` consumers are green.
  - 0 axe violations.
  - Screenshots of the landing pages, `/lab`, a note and `/contact`, at 320 and 1440 px on both locales, differ from the PR3 build by no more than the budget set once the palette decision is made. The budget is recorded in `verification.md`.
- [ ] **AC7 — Closed out.** `#368` is closed as superseded by PR2, and `#7` is closed by the PR that archives this spec.

## References

- Bitácora: `mlorentedev/web#7`; `#368` (Dependabot, superseded).
- Measurement comment on `#7`, 2026-09-06: the eleven gated alerts.
- ADR-055: build once, promote by digest. PR2 ships through it unchanged.
- ADR-057 §2: `strict` stays off. Each PR here is tested on the master push before build (`#373`).
