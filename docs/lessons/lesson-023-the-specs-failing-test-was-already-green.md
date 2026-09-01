---
id: lesson-023-the-specs-failing-test-was-already-green
type: lesson
status: active
created: "2026-08-31"
owner: manu
tags: [web, sdd, testing, WEB-080]
---

# Measure the page before writing the spec's "failing" test

**Context**: WEB-080 plans seven PRs, each opening with a failing test named in
`tasks.md`. Twice now the test the spec budgeted as the driver was already
passing before a line was written.

**Problem**:

| PR | What `tasks.md` said would be red | What was actually true |
|---|---|---|
| PR1 | "the page has **1 section**", so assert ≥ 5 | It had **seven**, each with its eyebrow |
| PR3 | "the built page lists exactly `services.length` service rows and `nodes.length` node rows" | It already emitted **14** `data-service-row` and **9** `data-node-row` |

Both were written when the spec was drafted, from an impression of the page
rather than from a measurement of it. Neither was a lie — they were just never
checked.

The cost is subtle and it is not wasted effort. It is that a **green count gets
read as evidence the PR did something**. Ship PR3, see fourteen rows asserted and
passing, and the natural conclusion is that PR3 built them. It did not; it
restyled them and added provenance.

**Solution**: measure first, then write the test, then record which assertions
were already true and *why they are kept anyway*:

```js
/**
 * ## What was already true before PR3, and is a guard rather than a driver
 *
 * Measured on 2026-08-31, the old page already emitted 14 `data-service-row`
 * and 9 `data-node-row` — the counts were green before a line was written.
 * Kept, because the rebuild must not regress them, but recorded as a guard so
 * nobody reads a passing count as evidence PR3 did something.
 */
```

Then state what *was* red, so the PR's actual contribution is legible: for PR3
the provenance (`generated_at` / `source_commit` appeared **0** times anywhere),
the machine-readable access boundary, the scoped token audit, and zero client JS.

**A second, sharper instance of the same habit.** The row-count assertion PR3
first shipped counted `data-access` values and compared the totals to the
manifest. Every total matched. But swap the access boundary of two services and
the totals are *unchanged* — on a section whose entire purpose is to say who can
reach what, the test passed while the page could name the wrong service public.
Raised in review; now each row carries `data-service-slug` and is checked against
its own manifest entry.

**Takeaway**: a spec's acceptance criteria are a hypothesis about the current
state, and hypotheses expire. Before writing the failing test, run the assertion
against today's artifact and look at the number. If it is green, you have learned
something about the spec, not about the code — fix the spec in the same commit.

**Related**: `lesson-016` (a test that only ever runs against the fix),
`lesson-022` (a number that is only printed is never questioned).
