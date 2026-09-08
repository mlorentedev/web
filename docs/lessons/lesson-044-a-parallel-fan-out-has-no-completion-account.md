---
id: lesson-044-a-parallel-fan-out-has-no-completion-account
type: lesson
status: active
created: "2026-08-26"
owner: manu
tags: [web, verification, subagents, knowledge-placement]
---

# A parallel fan-out has no completion accounting, so a lost deliverable is silent

**Context**: `#182` (WEB-081) AC4. On 2026-08-25 seven audits ran in parallel
over this site. Six left a durable artifact. The seventh — the *referentes*
audit, whose stated deliverable was three hero/positioning options — left one
summary line in a decision queue, and the options themselves were gone. Nothing
noticed for a day, until a later session went looking for them because `#110`
was still blocked on an answer that had already been produced.

**Problem**: The failure is not that a subagent produced nothing. It produced a
good result; the result was consumed in conversation and never written down.
What makes it a *process* defect rather than bad luck is that **the fan-out had
no way to know**. Seven agents were dispatched, seven returned, the run looked
complete, and completeness was measured by *agents that returned* rather than by
*artifacts that exist*. Those two counts differ silently and always in the same
direction.

Searching afterwards proves the point rather than solving it — four vault
queries, `10_projects/web/`, this repo's `docs/`, `docs/adr/`, `specs/`, and a
repo-wide grep for `referent`, all empty, with an unrelated control query
returning normally. Absence was cheap to establish *once someone suspected it*.
The cost was the day nobody did.

This is adjacent to
[a subagent's finding is a claim to verify, not a result to act on](lesson-014-a-subagent-finding-is-a-claim-to-verify-no.md),
but it is a different check. lesson 014 is about *trusting* what an agent
reports; this is about *noticing* that one reported nothing durable at all. A
fabricated finding and a lost finding both survive a fan-out that only counts
returns.

**Solution**: Make the deliverable, not the dispatch, the unit of completion.
Before a parallel run is declared finished, list the artifacts it was supposed
to leave and check each path exists — the same shape as verifying a build by its
output rather than by its exit code.

```bash
# One line per expected artifact; a fan-out is complete when this prints nothing.
for f in "$@"; do [ -s "$f" ] || echo "MISSING: $f"; done
```

Two corollaries that cost nothing and would have caught this one:

- **Name the artifact path when dispatching**, not the topic. "Audit the
  referentes" has no completion test; "write `<path>` covering the referentes"
  has one, and the agent writes the file because it was asked for a file.
- **Persist before deciding.** `#182`'s AC2 says it plainly: a deliverable that
  exists only in a session's context is not delivered. Writing it down first
  costs one tool call; re-running the audit cost a week of `#110` staying
  blocked, and the re-run had to correct the reference set anyway because the
  original measured visual language where the open questions were positioning
  and claim.

Confirmed again on 2026-09-07: a six-angle audit of the same site lost two
angles to a session limit mid-run. That one *was* caught — because the lead
re-measured a sample of every angle's claims before using them, and the two
gaps showed up as angles with no measurements to re-check. The check works; it
just has to be run.
