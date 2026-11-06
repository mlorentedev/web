# Ledger: web-polish-ci-20261106t0655z

| # | UTC | Item | Outcome | Evidence |
|---|---|---|---|---|
| 1 | 06:58 | #360 WEB-133 | parked (design decision, AC2 only; others already on master) | comment 6679135117; board Blocked NOT recorded: GraphQL rate-limited, retry |
| 2 | 07:05 | #619 WEB-201 (carry-over) | fixed apt cache key (`env.ImageVersion` empty in expressions) at 74cdbfd; filed #620 WEB-202 (Actions cache 10.66 GB > 10 GB, buildkit mode=max) | apt step 19 s cold, 12 s warm; key saved as `pw-apt-Linux-X64-1.64.1-` |
| 3 | 07:14 | #356 WEB-129 | PR #621 draft (AC2, AC3); AC1/AC4 parked with options | 592/593 pass, browser 0, a11y 0 |
| 4 | 07:20 | #351 WEB-124 | PR #622 draft; mutation proof pending | delivery-gate 7/7, actionlint clean |
| 5 | 07:28 | #501 WEB-165 | parked (canon vs local fix), board Blocked | comment 6679642285 |
| 6 | 07:33 | board | #360 Blocked, #501 Blocked, #620 Backlog, #356 In Progress: verified by GraphQL read | |
| 7 | 07:33 | #619 | triaged, marked ready (CI change: stays for Manu) | comment 6679714649 |
| 8 | 07:41 | #346 WEB-119 | baseline posted (1 CRITICAL, 6 HIGH, all from the pinned nginx base, clean in the current digest); PR #623 draft (AC1, AC4, AC5); AC3 waits on the Dependabot docker bump (root Dockerfile is outside write_paths) | comment 6679834268; delivery-gate 7/7 |
| 9 | 07:58 | #619 | CodeRabbit 7 findings: 6 applied at df22f29 (save steps, lesson slug and guarantees), 1 declined (warm <15 s: apt-get update runs inside install-deps) | delivery-gate 7/7, mutation of the save key fails the test |
| 10 | 08:02 | #621 | PR-Agent 2 findings applied at d845d50 (fenced code, bare <) | 593/594 pass, a11y 0, browser 0 |
| 11 | 07:50 | #622 | mutation pushed at c7ace46 (lessons row order) | waiting for PR gate |
| 12 | 07:52 | #623 | PR build scanned: SARIF trivy-web, 53 results on refs/pull/623/merge | code-scanning analyses API |
| 13 | 09:03 | run | ended queue-empty; report written; retired two merged worktrees | triage-queue exit 1 on #498 only |
