---
id: lesson-039-api-quota-is-shared-state-and-spending-it-b
type: lesson
status: active
created: "2026-09-05"
owner: manu
tags: [web, kubelab, verification, ci-automation, agents]
---

# API quota is shared state, and spending it breaks other people's CI

**Context**: While triaging the backlog I wanted to know a single fact — the board
status of one freshly filed issue. I asked for it with `gh project item-list 1
--owner mlorentedev --format json --limit 200`, got an answer I distrusted, and
asked again with `--limit 800`.

**Problem**: Roughly two hours later, kubelab's `Web Image Receiver` failed
mid-step on a dispatch from this repository:

```
* [new branch]      deploy/staging-web-sha-4329aeb -> deploy/staging-web-sha-4329aeb
GraphQL: API rate limit already exceeded for user ID 13562150.
##[error]Process completed with exit code 1.
```

`git push` had succeeded and `gh pr create` had not. The staging overlay bump
existed on a branch nobody was ever offered. The lane recovered on the next push
only because another commit happened to follow; had it been the last push of the
night, staging would have sat with no offer behind a red run nobody reads.

**Root cause**: The GitHub GraphQL quota is **per account**, not per tool, per
machine, or per session. Every CI job, every local `gh` invocation and every agent
authenticating as the same user draws from one 5,000-point-per-hour bucket. And
Projects V2 is GraphQL-only and **point-scored per nested node**, so
`item-list --limit 800` with `fieldValues(first:20)` is close to the most
expensive request available. Two of them, for one fact.

The insult on top of the injury: the answer was wrong anyway. `item-list`
truncates silently at `--limit` (asking for 800 returned exactly 800), the board
spans repositories, and filtering rows by issue number alone matched a *different*
repository's `#308`. The cheap, correct query was one issue lookup:

```bash
gh api graphql -f query='{repository(owner:"O",name:"R"){issue(number:N){
  state projectItems(first:5){nodes{fieldValues(first:20){nodes{
  ... on ProjectV2ItemFieldSingleSelectValue{name}}}}}}}}'
```

**Rule**: Treat API budget as **shared mutable state with a blast radius outside
your session**, in the same class as a git stash or a deploy branch — not as a
private resource that merely inconveniences you when it runs out. Concretely:

1. **Ask about the object, never list-and-filter.** If the question is about one
   issue, PR or item, query that one. A listing you filter client-side is only as
   sound as the listing, and `count == limit` is the tell it was truncated.
2. **Never reach for Projects V2 listings for a fact a REST call answers.**
   Projects V2 has no REST API at all, so it is the one surface with no fallback —
   which makes it the worst place to spend the budget everything else shares.
3. **`gh api rate_limit` will not warn you and will not exonerate you.** Measured
   2026-09-02: all fifteen buckets reported 100% remaining while every GraphQL call
   was refused. It is not a gauge.
4. **When it does run out, REST still works.** `gh api -X POST repos/O/R/issues`
   and `.../pulls` succeeded throughout this outage. That is a recovery path for a
   human at a terminal, and its absence in CI is a defect worth filing — it was
   filed as `kubelab#1651`.

**Why this is not merely "be efficient"**: efficiency arguments are about cost to
yourself and lose to convenience. This is a correctness and blast-radius argument.
An agent that burns the budget answering its own question degrades a shared
production system, and does it invisibly — the failure surfaces in another
repository, minutes later, in a job the agent is not watching, attributed to
nothing. Nothing connects the two unless someone goes looking, which is precisely
why it needs to be a rule rather than a habit.

Related: `lesson-036` (read the declaration before concluding from an
observation), `lesson-037` (verify the mutation mutated), `kubelab#1651`,
`kubelab#1645`, `web#283`.
