---
id: lesson-037-a-mutation-you-did-not-verify-mutated-is-not
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, testing, verification]
---

# A mutation you did not verify actually mutated is not evidence — in either direction

**Context**: `#289` added a guard that refuses a release PR closing an open
issue. Both reviewers independently found the same defect in the first version —
the query asked for `first: 50` and would read a truncated list as a complete
one — so the fix added `pageInfo { hasNextPage }`, a `decide()` branch returning
`UNANSWERABLE`, and a test that reads the workflow file to assert the selection
stays there.

This repository does not accept a green test as proof that a guard works
([`lesson-016`](lesson-016-a-test-that-only-ever-runs-against-the-fix.md),
[`lesson-022`](lesson-022-a-number-that-is-only-printed-is-never.md)), so each new
test was mutated to confirm it could fail.

**Problem**: The first mutation reported a pass.

```
=== MUTATION A: drop pageInfo from the workflow query ===
ℹ pass 20
ℹ fail 0
```

Read at face value, that says the new workflow-file test is vacuous — it asserts
something that holds whether or not the query selects `pageInfo`. The honest
response would have been to rewrite the test.

It was not vacuous. The mutation had not happened. The replacement string carried
a guessed indentation:

```python
t.replace("                    pageInfo { hasNextPage }\n", "")
```

`str.replace` does not complain when it matches nothing. The file was untouched,
so of course every test still passed. Re-run against the bare substring, with an
assertion that it was present and then absent, it failed exactly as designed:

```
✖ the workflow asks GitHub whether the list is complete
ℹ pass 19   ℹ fail 1
```

**Solution**: A mutation is an experiment, and an experiment needs its own
control. Assert that the change landed before drawing anything from the result:

```python
assert 'pageInfo { hasNextPage }' in t          # it was there
p.write_text(t.replace('pageInfo { hasNextPage }', ''))
print("still present?", 'pageInfo { hasNextPage }' in p.read_text())   # and now it is not
```

For the record, the five mutations on `#289` after this correction: `decide()`
ignoring `hasNextPage` → 2 failures; dropping `pageInfo` from the query → 1;
dropping `closing-refs` from `gate.needs` → 1; flipping `#244` to `CLOSED` in the
fixture → 3; treating a missing `nodes` array as clean → 5. Restored: 20 pass.

**Rule**: When mutation testing, verify the mutation. A silent no-op —
`str.replace` that matches nothing, `sed` whose pattern misses, an edit to a file
the test does not read — produces a green run that is indistinguishable from a
vacuous test, and the two call for opposite responses: one means rewrite the
test, the other means fix your tooling. Guessing between them is how a good test
gets deleted for failing to fail.

This is the same shape as the lessons it serves, one level up: those say an
assertion that cannot fail proves nothing. This says an assertion that was never
challenged proves nothing either, however carefully you thought you challenged
it.
