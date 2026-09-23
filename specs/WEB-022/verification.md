---
tags: [spec, verification]
created: "2026-09-22"
---

# Verification - WEB-022

## Pre-spec measurement (2026-09-22, base `6736137`)

These measurements were taken before planning, in throwaway worktrees. None of it is committed code; the patches were discarded.

**`@astrojs/tailwind` blocks Astro 7.** The latest release, 6.0.2 (published 2025-09-18), declares `peer astro "^3.0.0 || ^4.0.0 || ^5.0.0"`, and its README says it is deprecated in favour of the Tailwind Vite plugin. With the master lockfile removed, resolving `astro@^7.3.4` fails:

```text
npm error Could not resolve dependency:
npm error peer astro@"^3.0.0 || ^4.0.0 || ^5.0.0" from @astrojs/tailwind@6.0.2
```

With the lockfile present, npm names `@astrojs/mdx` instead. That message is misleading; the fresh resolve shows the real edge.

The integration does two things (`dist/index.js`):
- it pushes `tailwindcss(config)` and `autoprefixer()` into Vite's PostCSS plugins;
- when `applyBaseStyles` is true, which is the default, it runs `injectScript('page-ssr', "import '@astrojs/tailwind/base.css'")`, and that file holds only the three `@tailwind` directives.

`BaseLayout.astro` is the only file that emits `<html>`.

**Decoupling on Astro 5 is output-identical.** After `npm uninstall @astrojs/tailwind`, with a `postcss.config.mjs` holding `[tailwindcss(), autoprefixer()]` and `src/styles/tailwind.css` imported first in `BaseLayout`:
- The stylesheet is **byte-identical** to master's for its first 64 435 bytes, which is master's whole file. The candidate then appends `global.css` (fonts, `:root`, scroll offset). On master that block was an inline `<style>` placed after the `<link>`, so its cascade position after Tailwind is unchanged.
- Every HTML page is identical to master once asset hashes and mermaid filenames are normalised and the inline block is removed. The one exception is 6 `/lab`-family pages, where the `.lab-diagram` scoped rule is still inline, alone in its own `<style>`; the rule and its position are unchanged.
- **Without `autoprefixer`, the CSS differs.** For example, `-o-tab-size:4` is lost. It is required for identity.

**The Astro 7 step.** This was resolved on the decoupled lockfile with `npm install astro@^7.3.4 @astrojs/mdx@^8.0.2 @astrojs/markdown-remark@^7.3.0`. The lockfile diff is the astro family plus what it pulls in: sharp 0.35.4 and its libvips 1.3.3, esbuild 0.28.2, shiki 4.4.3, vite 8.3.0, `@astrojs/internal-helpers`, `@astrojs/prism` and telemetry. Each change it needed:

| # | Failure | Cause | Change |
|---|---|---|---|
| 1 | `ERESOLVE` | `@astrojs/tailwind` peer ≤ 5 | PR1 |
| 2 | `markdown.rehypePlugins … run on the unified processor from @astrojs/markdown-remark, which is no longer installed by default now that Sätteri is the default Markdown processor` | Astro 7's default processor | add `@astrojs/markdown-remark` |
| 3 | `i18n.routing.redirectToDefaultLocale can be used only when i18n.routing.prefixDefaultLocale is set to true` | new validation | drop the option; in Astro 5 it had no effect with `prefixDefaultLocale: false` |

After those three changes:
- `astro check` reports 0 errors, 0 warnings and 20 hints (18 of them `ts(6385) 'z' is deprecated`).
- The build produces **87 pages**, the same set as master.
- The visible text of all 87 pages is identical to master.
- `npm test` passes 182/182, and `test:browser` and `test:a11y` both exit 0.
- `npm audit` finds 4 moderate issues, all one `yaml` advisory reached through `@astrojs/check` → `@astrojs/language-server` 2.16.10 → `yaml-language-server` → `yaml@2.7.1`. `npm update @astrojs/language-server`, within `^2.16.7`, installs 2.17.1, which brings `yaml` 2.8.3, and **`npm audit` reports 0**. On master the same command reports 9: 1 critical, 1 high, 4 moderate and 3 low.

The rest of the differences are not regressions:
- The CSS is minified by Vite 8 (for example `rgb(59 130 246 / .5)` becomes `#3b82f680`).
- Inline scripts are re-minified.
- There are 26 `MODULE_LEVEL_DIRECTIVE "use astro:head-inject"` warnings, one per MDX file.

**Mermaid filenames are nondeterministic on master.** Two consecutive builds of master, with the same lockfile and the same Chromium, write 13 `beoe/*.svg` files under different names. Any comparison must match SVGs by content, never by name. This is ticketed as `#378` and is outside this spec.

**Tailwind 4, measured on the Astro 7 state.** `npx @tailwindcss/upgrade` did three things before it failed:
- it bumped `tailwindcss` to 4.3.3;
- it rewrote `tailwind.css` to `@import 'tailwindcss'`, added `@config '../../tailwind.config.mjs'`, and added a `border-color` compatibility layer, because the default is now `currentcolor`;
- it reported that the JS config "could not be automatically migrated".

The template pass then failed with `Cannot find module 'tailwindcss/colors'`, which the settled v4 install does export. In v4 the palette is OKLCH: `cyan-700` is `oklch(52% 0.105 223.128)`, where v3 had `#0e7490`.

### Normaliser

Page comparisons in this spec apply four steps:
- replace `/_astro/<name>.<8-char hash>.css` with a constant;
- replace `/beoe/<id>.svg` with a constant;
- strip `astro-<hash>` and `data-astro-cid-<hash>`;
- for "visible text", drop `<script>` and `<style>`, remove tags, unescape entities and collapse whitespace.

## Evidence

- [x] AC1 -> PR1, measured 2026-09-22 against a master (`6736137`) build with the same lockfile family:
  - `site/tests/tailwind-wiring.test.mjs` is 3/3 green. Before the change, 2 of the 3 failed ("package.json still depends on @astrojs/tailwind", "site/postcss.config.mjs must exist"); the `dist/` test passed on master, because that is the behaviour being preserved.
  - Mutation: deleting the `tailwind.css` import from `BaseLayout` still **builds (exit 0)**, and the test fails with `404.html: no Tailwind preflight in the CSS it ships`.
  - CSS: master's stylesheet (64 434 bytes plus a final newline) is a byte-identical prefix of PR1's. PR1 then appends `global.css`. `autoprefixer` 10.6.1 as a direct dev dependency produced the same bytes as the 10.4.27 the integration carried.
  - Pages: the same 101 non-asset files, and **0 differ** after normalisation and removal of the moved `global.css` block.
  - Mermaid: all 13 SVGs are identical in content once the random `m<digits>` id prefix (`#378`) is normalised.
- [x] AC2 -> PR2 (#380, merged as `aef8f88`):
  - Before the merge, the lockfile resolved `astro` 7.3.4, `sharp` 0.35.4, `esbuild` 0.28.2 and `yaml` {2.8.3, 2.9.0}, and `npm audit` reported 0, down from 9 on master.
  - After the merge, `gh api repos/mlorentedev/web/dependabot/alerts?state=open` returns **0**. Dependabot marked **14** alerts fixed between 01:35:57Z and 01:36:01Z on 2026-09-23: 1 critical (AVIF RCE), 4 high (sharp libheif, sharp libvips, SSRF, slot-name XSS), 6 medium (including `yaml`) and 3 low (including `esbuild`). That is more than the eleven counted on `#7` on 2026-09-06, because advisories were published after that count.
- [x] AC3 -> PR2: `site/tests/astro-peers.test.mjs`.
  - It is green on PR1's lockfile (astro 5, integrations at 5) and on PR2's.
  - With `#368`'s lockfile swapped in, it fails: `astro 7.2.8 is outside the peer range of: @astrojs/mdx@4.3.14 wants astro ^5.0.0; @astrojs/tailwind@6.0.2 wants astro ^3.0.0 || ^4.0.0 || ^5.0.0`.
  - `semver` becomes a direct dev dependency. It was already in the tree transitively.
- [x] AC4 -> PR2, against a PR1 build:
  - The build produces the same 87 pages and the same 101 non-asset files.
  - Visible text differs on **0** pages.
  - All 14 non-HTML files (sitemaps, RSS, robots, version, fonts, images) are byte-identical.
  - `astro check` reports 0 errors and 20 hints; the 18 `ts(6385)` hints are PR3's work.
  - `npm test` is 186/186, `test:browser` reports "All widths contained", and `test:a11y` reports 0 violations.
  - PR1's wiring test first failed here on the preflight marker, because Vite 8 minifies differently. It was fixed on PR1 (`c44f670`) to match the rule's stable head.
- [x] AC5 -> PR3, against a master (`aef8f88`) build:
  - The build log has 0 `[astro] … deprecated` lines (master had 2) and 0 `ts(6385)` (master had 18).
  - The build produces the same 115 files. All non-asset files are identical after hash normalisation, the CSS is byte-identical, and all 13 mermaid SVGs are identical by content once the random id prefix is normalised (`#378`).
  - `npm test` is 187/187, and `test:browser` and `test:a11y` both exit 0.
  - **Gap found and closed:** with the mermaid plugin switched off, the build still exits 0, ships raw `language-mermaid` blocks and writes 0 SVGs, and every existing suite passed. `notes-diagrams.test.mjs` iterates over the diagrams it finds, so with zero it asserts nothing. The new `site/tests/mermaid-rendered.test.mjs` counts fences in the source (13 across 10 notes) and fails on that mutant with `notes/building-a-homelab-idp: mermaid shipped as source, not rendered`.
- [x] AC6 -> PR4, against a build of master `a3a1fe2` (Tailwind 3.4.19). The baseline is reproducible: build that commit and run `node tests/visual-diff.mjs capture` and `shots` there.
  - **Pixels:** 20 full-page screenshots (`/`, `/es/`, `/lab/`, `/es/lab/`, `/contact/`, `/es/contact/`, a note, `/notes/`, `/tags/homelab/` and `/legal/privacy/`, at 320 and 1440 px) are **0 px different** from master. Moving `gray-600` by one unit in the blue channel turns 8 of the 20 red.
  - **Correction, found by the adversarial review (2026-09-22).** The first version of this evidence said "master against itself is 20/20 identical". That was true of one pair of runs, not of the tool. The reviewer's own control, two captures of one build, differed on `/lab` and `/es/lab`. The Lab's reachability console called the live `api.kubelab.live/health` and printed the visitor's clock and the round-trip time, all of which change on every load. With the network pinned, 4 of 20 still differed by 137 to 1,016 px, and cropping the changed strip showed `08:31:51 PM · round trip: 9 ms` against `08:39:49 PM · round trip: 7 ms`.
    - `tests/visual-diff.mjs` now serves the console the healthy fixture `lab-axe.mjs` uses, aborts every other request that leaves the local server, and replaces the two live readings (`[data-probe-clock]`, `[data-probe-latency]`) with fixed text.
    - Re-measured after the fix: three screenshot passes of one build are 20/20 identical, and master before Tailwind 4 (`a3a1fe2`) against after (`ba500ba`) is **20/20 at 0 px**, `/lab` included. The earlier 0 px on `/lab` held only because both captures happened to catch the same readings.
  - **Computed styles:** across all 87 pages × 2 widths (26 174 elements), colours, type, shadows, radii, gradients and line heights are identical. The only remaining differences are geometry bookkeeping. Tailwind 4's `space-*` puts the margin on the other side of each child, and `divide-y` moves each separator line from the top of one item into the bottom of the previous one. Items shift by at most 1 px as boxes, while their content and the line keep the same position, which the pixels confirm.
  - The first Tailwind 4 build was **not** identical. Each difference was found by the diff and fixed at its cause:
    - OKLCH palette: pinned as v3 hex in `@theme`, with v4's palette cleared.
    - `@tailwindcss/typography` shipping OKLCH `--tw-prose-*`: set from the v3 `gray` ramp in `tailwind.config.mjs`.
    - `shadow-sm` and `rounded-sm` rescaled, and `outline-none` changed meaning: renamed to `shadow-xs`, `rounded-xs` and `outline-hidden`, per the upgrade guide. The upgrader had not done it.
    - **Four `shadow-xs` on master rendered nothing**, because v3 has no such class. Under v4 they would have *added* shadows, so they were removed.
    - Responsive `text-*` no longer overriding `leading-*`: 9 class lists got the responsive `leading-*` that v3 was applying implicitly.
    - `text-*` line heights became unitless, so an inline `<code>` inside `prose-p:text-base` shrank from 24 px to 21 px and moved 292 elements by 1 px: the 24 `prose-*:text-*` overrides now use the `/N` line height.
    - Gradients interpolated in OKLab: `bg-linear-to-br/srgb`.
    - Form fields made transparent: the email input got `bg-white`.
    - Button cursor and placeholder colour: restored in `@layer base`, as the upgrade guide suggests.
  - **The upgrader rewrote test inputs.** In `audit-helpers.test.mjs` it turned the guard's must-catch strings into modern syntax (`text-[#fff]` became `text-white`), which would have weakened the colour guard silently. Those edits were reverted. The guard now also catches Tailwind 4's `bg-(--x)` shorthand and its suffix `!`, red before the change.
  - `diagrams.mjs verify` passes. `generate` needs the archify renderer, which is not installed locally, so the tints were not re-rendered. They are equal by construction: `palette.mjs` was dumped from the same `tailwindcss@3.4.19` palette `diagrams.mjs` read before.
  - `tests/tailwind-wiring.test.mjs` has 4 tests. It fails if the CSS palette and `palette.mjs` disagree (a one-unit mutation) and if `--color-*: initial` is removed.
  - Suites: `npm test` is 188/188, `test:browser` reports "All widths contained", and `test:a11y` reports 0 violations. `npm audit` reports 0.
  - Cascade note: v4 emits its CSS in `@layer`s, so the site's unlayered `global.css` now outranks every utility regardless of order. It changes nothing measured today, but a rule added to `global.css` will beat a utility on the same element.
- [ ] AC7 -> `#368` was closed by Dependabot itself on 2026-09-23 ("astro is updatable in another way"). `#381`, a second Dependabot security PR opened between the two merges on astro 5, is obsolete now that master is on 7.3.4. `#7` is closed by the archiving PR.

## Test status

- PR1: `npm run build` exits 0 (87 pages; `astro check` 0 errors and the same 2 pre-existing hints). `npm test` is 185/185. `test:browser` reports "All widths contained". `test:a11y` reports "0 axe violations at 320 and 1440 on both locales, in both console states".
- No regressions in existing test suite: yes (PR1).

## Decisions made during implementation

- 2026-09-22, Manu: PR4 pins the v3 palette as hex in `@theme` (Risk 1).
- 2026-09-22: the typography customisation stays in a JS config through `@config`, the plugin's documented v4 API (AC6 amended).
- 2026-09-22: where v3 behaviour was accidental (responsive text size overriding `leading-relaxed`, dormant `shadow-xs`), PR4 reproduces what v3 *rendered*, not what the classes *said*. Honouring the author's `leading-relaxed` is a design change for another PR.
- 2026-09-22, Manu: three PRs, and Tailwind 4 inside this migration. Together those give four PRs, ordered so that the security fix (PR2) does not wait on the visual one (PR4).

## Promotion candidates

- [ ] Lesson for `docs/lessons/`? Likely: npm's ERESOLVE names the wrong package when a lockfile is present. Re-resolve without it to find the real edge.
- [ ] ADR-worthy decision? <yes / no>
- [ ] New pattern candidate? <yes / no>

## Archive checklist

- [ ] `proposal.md` frontmatter set to `status: archived`
- [ ] Folder moved: `specs/WEB-022/` -> `specs/archive/WEB-022/`
- [ ] `#7` closed by the archiving PR
- [ ] Promotions above executed (if any)
