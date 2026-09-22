---
id: lesson-045-under-a-graphql-rate-limit-the-gh-cli-does-n
type: lesson
status: active
created: "2026-09-07"
owner: manu
tags: [web, github, verification, tooling]
---

# Under a GraphQL rate limit the gh CLI does not fail loudly, it answers wrongly

**Context**: A bulk board session — 23 issues filed, 9 closed, 10 commented
across `web` and `kubelab`. Partway through, the account hit GitHub's **secondary
GraphQL rate limit** (`API rate limit already exceeded for user ID …`).
`gh api rate_limit` reported `5000/5000 remaining` throughout, because that
endpoint describes the *primary* limit and knows nothing about the secondary one.

**Problem**: The limit did not stop the work. It made three tools answer wrongly,
each in a way that reads as success.

**1. Half the `gh` surface is GraphQL, and it is the half that touches issues.**
`gh issue comment`, `gh issue close`, `gh issue edit`, `gh pr create`,
`gh pr edit` and every `gh project` subcommand go through GraphQL. `gh api`
against a REST endpoint does not. So during the limit, *creating* issues worked
and *closing* them did not — and in a script the two are indistinguishable.

The same limit took down `add-to-project.yml` for twenty consecutive runs, since
`actions/add-to-project` uses the Projects V2 GraphQL API under the same account.
The issues existed and none reached the board.

**2. `&&` plus a trailing `echo` reports a success that did not happen.**

```bash
gh issue comment 175 --body "…" >/dev/null && gh issue close 175 ; echo "#175 closed"
```

The comment failed, `&&` short-circuited the close, and the `echo` — after a `;`,
not a `&&` — printed anyway. `#175` stayed open with no comment while the
terminal said otherwise. It surfaced only in a final pass that asked the API for
`state` and `state_reason` per issue. This is
[a mutation you did not verify mutated is not a mutation](lesson-037-a-mutation-you-did-not-verify-mutated-is-not.md)
with a new mechanism: not an unverified change, but a *falsely reported* one.

**3. `gh project item-list` truncates at its `--limit` and says nothing.**
Asked for the 23 new issues it returned exactly 1000 rows and **none of them**,
which reads as "the backfill failed" and was in fact "the listing stopped before
reaching them". On a multi-repo board holding more than 1000 items, the limit is
reached before the newest rows are. The question that cannot truncate is asked of
the issue, not of the project:

```bash
gh api graphql -f query='
query($o:String!,$r:String!,$n:Int!){
  repository(owner:$o,name:$r){ issue(number:$n){ projectItems(first:5){ nodes{
    project{ number }
    fieldValues(first:20){ nodes{
      ... on ProjectV2ItemFieldSingleSelectValue{ field{ ... on ProjectV2FieldCommon{ name } } name }
      ... on ProjectV2ItemFieldTextValue{ field{ ... on ProjectV2FieldCommon{ name } } text }
    } }
  } } } }' -F o=mlorentedev -F r=web -F n=342
```

**Solution**: three rules for any bulk GitHub operation.

- **Reach for `gh api` (REST) first** — issue create / comment / close / label,
  PR create / edit. It is more verbose, and it survives the limit that takes the
  ergonomic commands down.
- **Never end a mutation chain with an unconditional `echo`.** Report from the
  API's answer, not from the shell reaching the end of the line. One loop over
  `gh api repos/O/R/issues/N --jq .state` at the end is the entire cost.
- **Do not read absence from a listing that hit its limit.** A query returning
  exactly `--limit` rows is truncated by definition; ask per object instead.

`gh api rate_limit` is not the check — it lies by answering a different question.
The only reliable probe is a cheap real call, `gh api graphql -f query='{viewer{login}}'`,
which either answers or names the limit.
