# Unattended run report: web-2026-11-02-night

**Verdict:** stopped at `queue-empty` on 2026-11-02 at 08:55Z, about 9h before `expires_at`. All 7 queue items were handled. Nothing was merged.

**Next action:** merge #511, #512, #513 and #514, then answer the parked tickets.

## Waiting on you

| What | Decision |
|---|---|
| kubelab#2967 (deploy web `sha-b2f76aa` to staging) | Open. Staging still serves the build before web#505: `/notes` answers 200, not 301 |
| web#513 | Removing the `fast-uri` override leaves the lockfile as the only floor |
| web#512 | A visitor without JS sees a button that does nothing, because explaining it needs a new string |
| web#252 | May `site/vendor/` be edited? Then pin `v2.16.0` |
| web#358 | AC2 and AC4 with the content work; AC3 and AC5 as their own tickets |
| web#139 | Do #138 first, or drop the 600 and 800 weights |
| web#393 | Embedded font or one installed font package |

## Done, unmerged

| PR | Closes | Head | State |
|---|---|---|---|
| #511 | #412 | `0bd7c4d` | CLEAN, triaged |
| #512 | #130 | `7298737` | CLEAN, triaged |
| #513 | #352 | `18ddb43` | CLEAN, triaged |
| #514 | none (#358 AC1) | `df72052` | CLEAN, triaged |

Issue comments: audit counts on #270 for #352 AC2.

## Parked

All four show `Blocked` on the board, confirmed per issue over GraphQL.

- #252: scope, needs `site/vendor/archify-schemas/README.md`.
- #358 AC2 to AC5: needs `ui.ts`, `site/src/pages/**` and copy.
- #139: its prerequisite #138 is not in the queue.
- #393: needs `astro.config.mjs` or the Dockerfile, and a design choice.

## Findings

- Release Please failed on `75f891a`, `fad6676` and `b2f76aa` with `API rate limit already exceeded`. The quota is shared by all sessions. Staging images were still built and notified, but #498 may lag those three commits until the next push to master.
- `specs/archive/WEB-080/verification.md` says the `skills` CLI cannot pin a ref. Version 1.7.4 can.

## Evidence

- Cold start on `b2f76aa`: build ok, `npm test` pass 436, fail 0.
- `dotf pr triage-queue --pr N`: `[OK]` for 511, 512, 513, 514. Repo-wide, it lists only #498, the release PR.
- CodeRabbit reviewed only #511 and hit its limit on the others. PR-Agent reviewed all four.
- `npm test` and `test:browser` passed locally on all four branches. `test:a11y` ran on #512, #513 and #514, not on #511, which changes only test tooling. CI is green on all four heads.

## Budget

Iterations: 7 of 8. Items: 7 of 7. Consecutive failures: 0.

## Host

Mac mini on AC with `caffeinate`. The window was covered with no suspend seen.

## Not verified

web#505 through Traefik on staging: its deploy has not landed.
