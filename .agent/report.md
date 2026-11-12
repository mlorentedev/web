# Run report: web-ci-deps-20261112

Armed 2026-11-12T07:04:20Z, expires 19:04:20Z. Merge: never. Queue: web#270 web#162 web#427 web#288 web#620.
Peer run `web-rework-20261112` (content session) owns `chore-autopilot-run-2026-11-12`, plus #594 and #592.

## Items

| Item | Outcome | Evidence |
|---|---|---|
| #270 | PR #656 (ready, triaged 07:50Z): npm overrides for postcss-selector-parser ^6.1.5 and katex ^0.18.2. PR-Agent's katex finding declined after a live render of mermaid math on katex 0.18.10; CodeRabbit's linked-issue check answered (open alerts are exactly 78 and 70) | `npm audit --omit=dev` 0 vulnerabilities; `dist/` byte-identical to master (0 files differ); npm test 648/646/0; issuecomment-6817951515 |
| #162 | Owner chose A (advisor, delegated by Manu). Filed kubelab#3343 with the per-field table. Decision comment on #162 | Board: Blocked, confirmed by query |
| #260 | Not in the queue; decided by its ACs: stays open. Comment: #289 guards the harm, the root cause is not fixed | issuecomment-6817235860 |
| #427 | PR #657 (ready 11:21Z; triaged 11:55Z at `f445b2c`: boundary-membership test and cluster-only stray check applied, unconnected-services and SDD/i18n findings declined with reasons): gateway-path IR, SVG and drift test; the /lab include is left out on purpose (pages are frozen; the peer reworks /lab) | npm test 651/649/0; 7 diagrams verified; drift test proven red (grafana → public) |
| #288 | Evidence posted: #656's PR-Agent review, the first after #653, has no ticket table. Close left to Manu (one AC half met) | issuecomment-6817954951 |
| #620 | Dead tonight: Manu holds the release, so no master build will read `buildcache` | — |

## Incidents

- 07:03Z, worktree collision. This run's `dotf wt add chore-autopilot-run-2026-11-12 … | tail -1` failed because the peer had created that path seconds earlier. The pipe masked the exit code, and the chain went on to write `.agent/unattended.yml` in the peer's worktree. The commit failed yamllint, but my cleanup staged a deletion of the peer's committed envelope (`dcf901c`). I restored it from HEAD within a minute; the peer confirmed its tree matches origin. Root cause: piping a command whose failure must stop the chain. Rule from here: `set -e` and no pipe on `wt add`, then assert the branch before writing. No dotfiles ticket filed: the autopilot skill's own snippet already fails closed (`resolve_wt` + `exit 1`), and the defect was this run's ad-hoc command.
