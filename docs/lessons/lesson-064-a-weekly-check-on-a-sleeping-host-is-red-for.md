---
id: lesson-064-a-weekly-check-on-a-sleeping-host-is-red-for
type: lesson
status: active
created: "2026-10-18"
owner: manu
tags: [web, testing, ci, lab]
---

# A weekly check on a sleeping host is red for the schedule, not the service

**Context**: The proof that opens `/lab` (WEB-141 AC1) cites the measured access table,
`site/src/data/service-access.json`, as its result, and says it is checked again every week.
Before marking the PR ready, the claim was checked against the workflow that makes it:
`gh run list --workflow access-check.yml`.

**Problem**: The weekly run had failed three times in a row (2026-09-28, 2026-10-05 and
2026-10-12), always on the same row: `gitea is still "app-login"`, measured `unreachable`,
after two ten-second timeouts. Gitea runs on the Beelink, a machine that is switched on only
when needed (kubelab ADR-028). At 06:17 UTC on a Monday it is asleep. Run by hand while
it was awake, the same check passed. So the row was true whenever anyone could see the
service, and the check failed on its schedule rather than on any change. Nobody acted on
three red runs, and the page kept claiming that a weekly check stood behind the table.

**Solution**: The table gained an `onDemand` mark for a row on such a host. `access` stays
what a visitor meets while the host is up. `matches()` in `site/tests/lib/access.mjs` also
accepts `unreachable` for that row and nothing else, so a gate that disappears or moves
still fails. `/lab` shows the row as on demand. The full live check passed on 2026-10-18
(15 of 15), and `measured` moved to that date.

**Rule**: Before a page cites a scheduled check, read its last runs, not its definition.
When a scheduled check fails on the same row every time, first ask whether the schedule
can ever meet the thing it checks. If the check can never pass, it is measuring the
calendar. Model the real state in the data and keep it failing on everything else.
