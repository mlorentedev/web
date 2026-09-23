---
tags: [spec, tasks]
created: "2026-09-22"
---

# Tasks - WEB-022

> TDD order. One task = one focused commit. `[AC<n>]` maps to `proposal.md`.
> Every "baseline" below is a build of the PR's own base commit in a throwaway
> `dotf worktree`, compared with the hash normaliser recorded in `verification.md`.

## Setup

- [x] Worktree from `origin/master` via `dotf worktree add astro-7 --issue 7` (branch `chore/astro-7-migration`)
- [x] Pre-spec measurement recorded in `verification.md`
- [x] PR sequence and Tailwind 4 scope decided by Manu (2026-09-22)
- [x] PR4 palette decision (Risk 1). Blocks PR4 only.

## Implementation

### PR1 — decouple Tailwind (Astro 5)

- [x] [AC1] Failing test `site/tests/tailwind-wiring.test.mjs`. Over `dist/`, the stylesheet carries Tailwind's preflight and utilities the site uses. Over the source, `@astrojs/tailwind` is absent, and `postcss.config.mjs` registers `tailwindcss` and `autoprefixer`.
- [x] [AC1] `npm uninstall @astrojs/tailwind` and `npm install -D autoprefixer`. Add `postcss.config.mjs` and `src/styles/tailwind.css`, and import the latter in `BaseLayout.astro`. Drop the integration from `astro.config.mjs`.
- [x] [AC1] Prove the test red: remove the import, build, and see the test fail.
- [x] [AC1] Baseline diff against master: CSS byte-identical apart from the appended `global.css`, and pages identical after normalisation. Record the result in `verification.md`.

### PR2 — Astro 7 (security)

- [x] [AC3] Failing test `site/tests/astro-peers.test.mjs`. For every lockfile package with an `astro` peer range, the installed `astro` satisfies it. Show it red against `#368`'s lockfile.
- [x] [AC2] [AC4] `npm install astro@^7.3.4 @astrojs/mdx@^8.0.2 @astrojs/markdown-remark@^7.3.0` and `npm update @astrojs/language-server`, resolved on PR1's lockfile. Never regenerate it.
- [x] [AC4] Drop `i18n.routing.redirectToDefaultLocale` from `astro.config.mjs`.
- [x] [AC2] Lockfile floors verified (astro, sharp, esbuild, yaml) and `npm audit` reports 0.
- [x] [AC4] Baseline diff against PR1: same page set, and identical visible text on every page. Build, unit, browser and a11y suites green.
- [x] [AC2] After merge, check the Dependabot alerts API for the eleven, and record the result in `verification.md`.
- [x] [AC7] `#368` closed as superseded (Dependabot closed it itself once astro moved).

### PR3 — deprecations

- [x] [AC5] `z` from `astro/zod` in `src/content.config.ts` and any other schema file.
- [x] [AC5] Move `rehypeMermaid` into `markdown.processor: unified({ rehypePlugins })`, keeping `syntaxHighlight.excludeLangs: ['mermaid']`.
- [x] [AC5] Build log free of `[astro] … deprecated`, and `astro check` has no `ts(6385)`. Baseline diff against PR2, mermaid SVG content included, compared by content, not by filename.
- [x] [AC5] Guard `site/tests/mermaid-rendered.test.mjs`: every fence renders. Shown red with the plugin switched off.
- [x] Search for the `MODULE_LEVEL_DIRECTIVE` warning upstream (housekeeping). Already reported as withastro/astro#18087, with a fix in #18088, so no ticket here.

### PR4 — Tailwind 4

- [ ] [AC6] Screenshot harness: Playwright over the pages named in AC6 at 320 and 1440 px on both locales, with a pixel-diff budget. Capture the PR3 baseline first.
- [ ] [AC6] Run `npx @tailwindcss/upgrade` on a settled install and review its diff line by line.
- [ ] [AC6] `@tailwindcss/vite` replaces `postcss.config.mjs` and `autoprefixer`. The CSS-first `@theme` replaces `tailwind.config.mjs`, per the palette decision.
- [ ] [AC6] Hex consumers (`diagrams.mjs`, `tests/lib/audit.mjs`, the ghchart colour in `tokens.mjs`) keep passing, and `diagrams.mjs verify` stays green.
- [ ] [AC6] Screenshot diff within budget, 0 axe violations, all suites green.

## Closing

- [ ] Every AC is covered by a test or a recorded measurement, and `features.json` has a non-vacuous command for each.
- [ ] `verification.md` filled in per PR.
- [ ] Independent adversarial review (`review.md`) before `/spec archive WEB-022`.
- [ ] [AC7] The archiving PR closes `#7`.
