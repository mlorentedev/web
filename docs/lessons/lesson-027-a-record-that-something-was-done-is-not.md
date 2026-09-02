---
id: lesson-027-a-record-that-something-was-done-is-not
type: lesson
status: active
created: "2026-09-01"
owner: manu
tags: [web, verification, sdd, WEB-080]
---

# A record that something was done is not evidence that it was done — including a record you wrote

**Context**: WEB-080 kept two kinds of record across seven PRs: `features.json`,
which pairs every acceptance criterion with the command that verifies it, and a
session handoff naming what the previous session had finished. Both were trusted
for weeks. Both were wrong, in ways that only a literal re-run could expose.

**Problem, first case — a verification command that asserted nothing.**
`features.json` recorded AC2's negative case as:

```sh
! node scripts/diagrams.mjs tests/fixtures/malformed.architecture.json
```

It exits 1, so the `!` makes it pass, so the criterion looked verified. It exits
1 **on a usage error** — the `verify` subcommand is missing, so the file is never
opened. Measured: a path that does not exist scores identically, and so would a
perfectly valid IR. The command had been "passing" since PR0 while asserting
nothing whatsoever about the malformed fixture it names.

```sh
$ node scripts/diagrams.mjs tests/fixtures/malformed.architecture.json
diagrams: usage: diagrams.mjs generate | verify [file]   # exit 1
$ node scripts/diagrams.mjs tests/fixtures/DOES-NOT-EXIST.json
diagrams: usage: diagrams.mjs generate | verify [file]   # exit 1 — identical
```

**Problem, second case — a handoff that said a file was committed.** The previous
session's handoff recorded that the test fixture for PR5 (kubelab's template at a
pinned commit) was "already committed". It was not. Building on it would have
produced a test comparing the data against a file that did not exist — which, for
a fixture-driven comparison, fails loudly. But the same class of claim about
something *optional* would have passed silently.

**Solution**: at every spec close, **run every recorded verification command
verbatim and paste the output**, and make each one discriminate in both
directions.

```sh
node --test tests/lab-diagrams.test.mjs \
  && node scripts/diagrams.mjs verify src/diagrams/topology.architecture.json \
  && ! node scripts/diagrams.mjs verify tests/fixtures/malformed.architecture.json \
  && node tests/lab-containment.mjs
```

The positive case is what makes the negative one mean something. A `!` in front
of a command is an assertion that it fails *for the stated reason*, and nothing
about the exit code proves the reason — so pair it with the case that must
succeed, and a wrong invocation breaks both halves instead of quietly passing
one.

For the handoff: verify before building on it. `git log --oneline -- <path>` and
`test -f` cost nothing next to a PR built on a file that is not there.

**Takeaway**: the artefacts we keep to make work auditable — a `features.json`
row, a handoff, a checklist tick, a `## Review triage` comment — are claims made
by a past self who was tired and in a hurry. They are exactly as trustworthy as
the evidence attached to them, and no more. Treat "the record says it was done"
as a hypothesis with a cheap test, and run the test at the moment it becomes
load-bearing: the spec close, the next PR that depends on it, the merge.

This is the same shape as `lesson-019` (a guard nobody proves fires) and
`lesson-022` (a number nobody questions), one level up: a *check* nobody re-runs
decays into a *record* nobody questions.

**Related**: `lesson-019`, `lesson-022`, `lesson-016` (a test that only ever runs
against the fix), `lesson-014` (a subagent's finding is a claim to verify).
