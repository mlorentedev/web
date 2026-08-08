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
- [x] Open question "hive metric source" decided: Hive repo stargazers (flagship), GitHub-sourced

## Increment 1 — baked GitHub metrics (this PR)

- [x] [AC1] Add `src/data/github.ts`: typed `GithubMetrics` shape + `fetchGithubMetrics()` that
      calls the public REST API (`/users/mlorentedev/repos?per_page=100`, one call) at build time,
      derives `{ publicRepos, totalStars, topLanguages[], hiveStars }`, and returns a hardcoded
      `FALLBACK` on any throw / non-200 (build never fails on GitHub downtime).
- [x] [AC1] Add i18n keys (`proof.heading`, `proof.repos`, `proof.stars`, `proof.hive`,
      `proof.languages`) to the ui dict for EN + ES.
- [x] [AC1] Create `src/components/ProofSurface.astro`: `await fetchGithubMetrics()` in frontmatter,
      render `[ 06 / … ]` bracketed section (cyan accent, `tabular-nums`, `data-proof` +
      `data-stat` attrs) mirroring `CredibilityBand` markup, with the languages as a tag list.
- [x] [AC2] Wire `<ProofSurface lang={lang} />` into `index.astro` and `es/index.astro` after
      `LatestNotesSection` (`[ 05 ]`), keeping the spine `00 … 06`.
- [x] [AC1..3] Verify: `astro check` 0/0/0 (39 files); `astro build` 75 pages; `dist/{index,es/index}.html`
      both carry `data-proof` + the `[ 06 ]` label; forced fetch failure -> build exit 0 on `FALLBACK`.

## Increment 2 — live client-side hydration (this PR)

- [x] Extract pure `deriveMetrics(rawRepos)` + `REPOS_ENDPOINT` in `github.ts` so build-time and
      client share one derivation (no drift).
- [x] Add a vanilla `<script>` island in `ProofSurface.astro` (deferred via `requestIdleCallback`):
      read a TTL'd `localStorage` cache; on stale/absent, live-fetch the public REST API; apply via
      `data-value` / `[data-languages] ul` (textContent + `replaceChildren`, injection-safe); no-op
      on non-200 / parse error so the baked value stays (no empty state, no layout shift).
- [x] Add `data-value` hook to the baked number spans.
- [x] Verify (static, repo has no browser harness): `astro check` 0/0/0 (39 files); `astro build`
      75 pages; island inlined on both `dist/{index,es/index}.html` (cache key + `deriveMetrics` +
      endpoint + FALLBACK + 1 module script); `deriveMetrics` proven on live data by the baked build
      (21/14/8). DOM-glue (localStorage write, number swap) is standard browser API — spot-check in a
      browser (no test tooling in-repo; adding one is out of scope).

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
