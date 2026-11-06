# Run report: web-polish-ci-20261106t0655z

**Verdict:** ended `queue-empty` at about 09:00 UTC, 6 h before `expires_at` (14:55 UTC).
Every queued item was either opened as a PR or parked with options; nothing was merged
(`merge: never`).

## Waiting on Manu

| PR | Ticket | State at end | Note |
|---|---|---|---|
| #619 | WEB-201 (#613) | ready, green at `45ed45e`, triaged | CI change. CodeRabbit and PR-Agent findings applied except the warm < 15 s target (declined: `apt-get update` runs inside `install-deps`; measured 3 s + 12 s) |
| #621 | WEB-129 (#356), AC2 + AC3 | ready, green at `d845d50`, triaged | reading time and table of contents on notes; two new i18n keys per locale; no copy changed |
| #622 | WEB-124 (#351) | ready, green at `9064259`, triaged | CI change. Mutation proof: `c7ace46` red, `9064259` green. Required contexts unchanged |
| #623 | WEB-119 (#346), AC1 + AC4 + AC5 | ready, green at `ed93af0`, triaged | CI change. PR builds are now scanned (SARIF on `refs/pull/623/merge`) |

## Parked, each with two options on the ticket

- **#360 WEB-133** (AC2 only; the other criteria are already on master): button variants are a design choice. Options: (A) ink-900 primary, one size, the 404 loses its cyan; (B) one variant per current treatment, zero visual diff. Board: Blocked.
- **#356 WEB-129** AC1 + AC4 (`related` field): needs `site/src/content.config.ts`, which is outside `write_paths`, and the clusters are the author's call. Options: (A) field, rendering and check with empty lists, clusters in a later content PR; (B) write the clusters on the ticket first, then one PR. Board: In Progress (because #621 is open).
- **#501 WEB-165**: the dotfiles canon of `pr-agent.yml` already solves the stalled-model case another way. Options: (A) sync this repo to the canon (other models and secrets); (B) port only the per-attempt step budgets locally (about 40 lines, more drift). Board: Blocked.
- **#346 WEB-119** AC3 (block on CRITICAL): waits on Dependabot's docker bump. Baseline posted on the ticket: the pinned `nginx:1.31-alpine` carries 1 CRITICAL and 6 HIGH, and the tag's current digest has none. The root `Dockerfile` is outside `write_paths` (the envelope names `site/Dockerfile`), so the run did not bump it.

## Filed

- **#620 WEB-202**: the repository's Actions cache is 10.66 GB, over the 10 GB limit, mostly buildkit blobs from `cache-to: type=gha,mode=max`. The LRU window is about a day, so the new Chromium and apt caches can be evicted. Board: Backlog.

## Evidence

- Ledger: `ledger.md` in this directory, one row per action.
- #621: `npm run build && npm test` gave 594 tests, 593 pass, 1 skipped; `test:browser` and `test:a11y` exit 0.
- #619, #622, #623: `node --test tests/delivery-gate.test.mjs` 7/7 on each branch, `actionlint` clean, and every new assertion was checked by mutating the workflow and watching it fail.
- `dotf pr triage-queue`: exit 1 on #498 only (the release PR, the owner's, another thread's).

## Budget

8 iterations allowed. The run used 6 items (5 queued plus 1 carry-over) and stayed under 60 min per item. There was no fix loop and no consecutive failure.

## Host

`caffeinate -is -t 28800` was held for the whole window. The Mac did not suspend.

## Housekeeping

Retired `feat-note-og-cards` (#612 merged) and `feat-note-modified-dates` (#618 merged).
The worktrees of open PRs stay: `fix-ci-chromium-cache`, `feat-note-toc-reading-time`,
`fix-hygiene-in-pr-gate`, `fix-trivy-pr-builds`. The launch worktree `fix-focus-visible`
stays as well.

## Next action

Review and merge #621 first (no CI change). Then #622, #619 and #623. When Dependabot's docker group
bumps the nginx digest, apply #346 AC3 in one line, as the workflow note says.
