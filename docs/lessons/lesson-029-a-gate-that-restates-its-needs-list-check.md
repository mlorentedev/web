---
id: lesson-029-a-gate-that-restates-its-needs-list-check
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, ci, github-actions, verification, WEB-080]
---

# A gate that restates its `needs` list checks less than it waits for

**Context**: `#275` measured that `master` required **zero** status checks —
every gate this repo had built was advisory, and `#269` had merged untriaged as
proof. The obstacle was mechanical: `validate` reports as `Validate build /
Build pr-<N>`, so the context string carries the PR number and a required
context naming one PR never matches another. `#276` added an aggregator job with
a fixed name, `PR gate`, for branch protection to require instead.

**Problem**: the job listed its dependencies twice, and only one of the two
lists was named in the comment.

```yaml
needs: [test, validate]                 # ← the list everyone edits
steps:
  - env:
      TEST_RESULT: ${{ needs.test.result }}
      VALIDATE_RESULT: ${{ needs.validate.result }}
    run: |
      for pair in "Test:$TEST_RESULT" "Validate build:$VALIDATE_RESULT"; do
```

Adding a job to `needs` without adding it to the `for` loop produces a gate that
**waits for that job and then ignores what it did.** Not a missing check — a
check that is present, green, and reporting on a subset it does not disclose.

The comment above the job said, in as many words, *"adding a job above means
adding it to `needs` here; nothing else has to be touched."* That sentence was
written in the same commit as the second list. Being the author of both is not
the same as noticing they contradict each other: the sentence describes the
design, and the code is the deployment (`lesson-017`).

What makes this worth a numbered lesson rather than a diff is the shape.
**The job existed to remove a class of defect — a required check that cannot
fire — and reintroduced that class one level down.** A gate whose coverage
silently lags its own dependency list is worse than no gate, because the whole
point of adding it was that people would stop checking by hand.

**Solution**: derive the list instead of restating it.

```yaml
      - name: Require every job in `needs` to have succeeded
        env:
          NEEDS_JSON: ${{ toJSON(needs) }}
        run: |
          set -euo pipefail
          total=$(printf '%s' "$NEEDS_JSON" | jq 'length')
          if [ "$total" -eq 0 ]; then
            echo "::error::the gate has no dependencies — it would pass without checking anything"
            exit 1
          fi
          failed=$(printf '%s' "$NEEDS_JSON" |
            jq -r 'to_entries[] | select(.value.result != "success") | "\(.key) (\(.value.result))"')
          [ -z "$failed" ] || { printf '%s\n' "$failed" | while IFS= read -r j; do
            echo "::error::$j did not succeed"; done; exit 1; }
          echo "All $total required job(s) succeeded."
```

`toJSON(needs)` serialises the whole context — `{"test":{"result":"success"},…}`
— so every dependency is checked **by construction** and `needs` becomes the only
list. It goes through `env` rather than into the script body, the standard
precaution for an interpolated context.

Three details that are not incidental:

- **`if: always()` is what makes it a gate rather than a formality.** Without it
  the job is skipped when a dependency fails, and a *skipped* required check does
  not block a merge — GitHub reports it neutral. The job has to run and fail.
- **Each result is compared to `success` explicitly**, because `needs` treats a
  **skipped** dependency as satisfied. A job skipped by a path filter, a
  cancelled run, or one that never started for want of a runner would all
  otherwise read as a pass.
- **It asserts it has something to check.** A gate with an empty `needs` verifies
  nothing and reports green doing it — `lesson-019`'s shape, an assertion that
  cannot fail, and the one failure mode the derived version newly makes possible.

**Verification**: seven serialised `needs` payloads through the exact script
before pushing — `success` → 0; `failure`, `skipped`, `cancelled` and `{}` → 1,
each naming the job; and a third job added to `needs` correctly failing *and*
passing the gate, **which is the case the previous script got wrong**. Then
confirmed in real CI by the log line `All 2 required job(s) succeeded`, a string
that exists only in the new version — because a green square proves the job ran,
not which version of it did.

**Takeaway**: any time a workflow names the same thing twice, one of the two is
going to drift, and in CI the drift is silent by default because the visible
signal is a green square either way. Prefer deriving over restating — `toJSON`,
matrix outputs, whatever the context offers. And when you write a comment
claiming "nothing else has to be touched", treat it as a hypothesis about your
own file and go and check, because that sentence is only ever written by someone
who has just finished touching several things.

**Related**: `lesson-019` (a guard that cannot fail), `lesson-015` (a skipped
step and a step with nothing to do look identical), `lesson-017` (true of the
design, false of the deployment), `lesson-022` (a number nobody questions).
