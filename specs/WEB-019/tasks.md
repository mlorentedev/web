---
tags: [spec, tasks, templates]
created: "2026-07-10"
---

# Tasks - WEB-019

> Delivered in increments under one issue (#46), like WEB-012. Each increment = one atomic PR.
> `[P]` = parallel-safe; `[AC<n>]` = satisfies acceptance criterion n. Astro components have no
> unit harness here — the "test" is `astro check` + a `dist/` grep + a forced-failure smoke, the
> same evidence model WEB-012 / WEB-026 used.

## Setup

- [x] Branch created from master: `feat/WEB-019-proof-surface`
- [x] `proposal.md` complete; acceptance criteria testable
- [ ] Open question "hive metric source" decided at start of increment 1 (lean: Hive repo GitHub stats)

## Increment 1 — baked GitHub metrics (this PR)

- [ ] [AC1] Add `src/data/github.ts`: typed `GithubMetrics` shape + `fetchGithubMetrics()` that
      calls the public REST API (`/users/mlorentedev`, `/users/mlorentedev/repos?per_page=100`) at
      build time, derives `{ publicRepos, totalStars, topLanguages[] }`, and returns a hardcoded
      `FALLBACK` object on any throw / non-200 (build must never fail on GitHub downtime).
- [ ] [AC1] Add i18n keys (`proof.heading`, `proof.repos`, `proof.stars`, `proof.languages`,
      `proof.hive`) to the ui dict for EN + ES.
- [ ] [AC1] Create `src/components/ProofSurface.astro`: `await fetchGithubMetrics()` in frontmatter,
      render `[ 06 / … ]` bracketed section (cyan accent, `tabular-nums`, `data-proof` +
      `data-stat` attrs) mirroring `CredibilityBand` markup.
- [ ] [AC2] Wire `<ProofSurface lang={lang} />` into `index.astro` and `es/index.astro` after
      `LatestNotesSection` (`[ 05 ]`), keeping the spine `00 … 06`.
- [ ] [AC3] Refactor: extract the fallback + language-count helper for clarity; confirm no unused
      imports (`astro check` clean).
- [ ] [AC1..3] Verify: `astro check` 0/0/0; `astro build`; grep `dist/index.html` +
      `dist/es/index.html` for `data-proof` and the 06 label; force a fetch failure (bad host / offline)
      and confirm the build still completes on `FALLBACK`.

## Increment 2 — live client-side hydration (future PR)

- [ ] Island (`client:idle`) reading a TTL'd `localStorage` cache; live-fetch public REST on stale;
      update baked DOM in place; no-op on 403/429; no layout shift.
- [ ] Verify: JS-on updates numbers + writes cache; forced fetch error keeps baked value visible.

## Increment 3 — contribution heatmap (future PR, blocked on token decision)

- [ ] Resolve token scope (PAT `read:user` vs default Actions token) and add CI secret in web repo.
- [ ] Build-time GraphQL `contributionsCollection` fetch → baked compact heatmap; commit last-good
      snapshot as offline fallback.
- [ ] Weekly scheduled workflow to rebuild for freshness.
- [ ] Verify: heatmap renders; build succeeds without the token via committed snapshot.

## Closing (per increment)

- [ ] Every acceptance criterion for the increment covered by evidence
- [ ] Matching `features.json` entry with a non-vacuous verification command
- [ ] `astro check` + build pass; no scope creep in the diff
- [ ] `verification.md` updated; PR opened referencing this spec folder

## Machine-readable features

See sibling `features.json`. The agent may not set `"state": "passing"` — only the harness may,
after running `verification` and capturing exit 0.
