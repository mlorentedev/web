---
id: lesson-034-a-release-pr-closes-every-issue-its-commits
type: lesson
status: active
created: "2026-09-03"
owner: manu
tags: [web, release-please, github, verification]
---

# A release PR closes every issue its commits named, and `grep` cannot see which

**Context**: Preparing `#184` (`chore(master): release 1.12.0`) for merge. The
recorded plan said to check what it would close, edit the one live reference from
`closes` to `refs`, and hand it over.

**Problem**: Two separate things were nearly missed, and either alone would have
closed a ticket with work outstanding.

The first is the mechanism. release-please builds the release PR body from the
changelog, and the changelog reproduces the commit subjects **including their
closing keywords**. `#248` was an interim fix — one global `alt` for eleven
diagrams — but its squash commit `9f29f1c` said `closes #244`, and `#244` is
open on purpose: a per-diagram `alt` and three diagrams still need reshaping. The
release PR inherited that keyword and would have closed the ticket on merge.

The second is that the obvious check does not work. The changelog writes links,
not bare references:

```
* **a11y:** give rendered diagrams an accessible name ([#248](…)), closes [#244](https://github.com/mlorentedev/web/issues/244)
```

So the natural grep finds nothing and reports the PR clean:

```
$ grep -n -iE '(closes|fixes|resolves)[[:space:]]*#' pr184-body.md
$                                     # no output — and #244 was there all along
```

GitHub parses the markdown-link form as a closing keyword. The grep does not.

**Solution**: Ask GitHub what it will act on, rather than reading the text
yourself.

```bash
gh api graphql -f query='{repository(owner:"mlorentedev",name:"web"){
  pullRequest(number:184){closingIssuesReferences(first:20){nodes{number state title}}}}}'
```

That returned five nodes, one `OPEN`. Editing `closes [#244](…)` to `refs
[#244](…)` — a one-line diff — and re-running the same query returned four, all
`CLOSED`.

Two details make the fix hold. The body is only one of two paths GitHub reads, so
the commit path was checked too — `squash_merge_commit_message` is
`COMMIT_MESSAGES`, and the branch's single commit has an empty body, so no
keyword arrives that way. And `gh pr edit` fails on this repo with `Projects
(classic) is being deprecated … (repository.pullRequest.projectCards)`; the REST
equivalent `gh api -X PATCH repos/O/R/pulls/184 -F body=@file` works. That is the
same REST-instead-of-GraphQL escape as the rate-limit case, with a different
cause — a deprecated field rather than a quota.

**Rule**: Before merging a release PR, run `closingIssuesReferences` and check
every node's `state`; a node that is `OPEN` is a ticket about to be closed by a
commit message written weeks ago. Never substitute a grep — a closing keyword
survives markdown link syntax, and more generally, when a platform will act on
text, ask the platform what it parsed instead of re-implementing its parser.

The edit is undone by the next push to `master`, because the body regenerates, so
it belongs immediately before the merge and is re-verified with the same query
afterwards. The mechanical fix is filed as `#286`.
