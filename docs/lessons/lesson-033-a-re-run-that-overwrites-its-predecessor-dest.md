---
id: lesson-033-a-re-run-that-overwrites-its-predecessor-dest
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, spec-driven-development, verification]
---

# A re-run that overwrites its predecessor destroys the evidence that justified it

**Context**: WEB-080's adversarial review had to be re-run, because the first
one was signed by `claude-sonnet-5` against a `claude-opus-5` implementation and
the pool exists to refuse exactly that. The re-run was the whole point of `#277`
and `#283`.

**Problem**: `dotf spec review` hands the drawn reviewer a prompt that says, in
`ReviewPrompt` (`review_launch.go:278`):

> Write your verdict to `specs/<id>/review.md`, **overwriting what is there**.

That is correct for the ordinary case — a verdict has one current value and the
gate parses one file. But round 1 was not worthless: it had found a real path
traversal (CWE-22), reproduced with a 200 and the file contents, that nothing
else in seven PRs had caught. Launching the re-run as documented would have
deleted the only record of the finding that most justified re-reviewing at all.

The reflex fix — `git mv` it aside first — has its own trap. The staleness
checker watches `contractFiles`, and touching one invalidates the very review
being launched:

```go
var contractFiles = []string{"proposal.md", "tasks.md", "features.json"}
```

**Solution**: Verify the name is not watched, then preserve rather than move.
`review-round1-*.md` is not in `contractFiles`, so a second file in the spec
folder costs nothing. The copy was taken before launching, held outside the repo
so the reviewer's working tree stayed pristine, and restored afterwards —
byte-identical, confirmed by hash:

```
$ sha1sum scratch/review-round1-claude-sonnet-5.md specs/WEB-080/review.md
a15ba53a790a827890408d33e6959819149b7758  scratch/review-round1-claude-sonnet-5.md
a15ba53a790a827890408d33e6959819149b7758  specs/WEB-080/review.md
```

It carries its own disqualification in its frontmatter —
`reviewer_independence: "family-shortfall"` — so it can never be mistaken for a
verdict that counts. Both rounds now sit in `specs/archive/WEB-080/`, and the
`verify(explicitFile)` gap that round 2 reproduced by mutation turned out to be
the same one round 1 had already filed as `#278`: two reviewers on different
model families, arriving by different routes. That agreement is only visible
because both records survived.

**Rule**: Before re-running any tool that writes to a fixed path, ask what is at
that path and whether it is reproducible. A verdict, a report, a generated
artifact with findings in it — if the previous run cost thirty minutes and found
something, the overwrite is a deletion. Check the destination's own staleness or
contract rules before choosing where to put the copy, and prefer a name the
tooling ignores over moving something the tooling watches.
