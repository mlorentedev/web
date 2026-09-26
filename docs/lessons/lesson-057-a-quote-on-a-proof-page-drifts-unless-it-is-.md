---
id: lesson-057-a-quote-on-a-proof-page-drifts-unless-it-is-
type: lesson
status: active
created: "2026-09-25"
owner: manu
tags: [web, verification, content, testing]
---

# A quote on a proof page drifts unless it is pinned to a blob

**Context**: The `/ai` page shows four cards, each a code block presented as an
excerpt of a file, with a link to that file. They were written by hand when the
section was built and linked to `blob/master`.

**Problem**: None of the four blocks was what its file said: 0 of 6, 2 of 5, 0 of 5
and 0 of 5 lines longer than 25 characters were in the linked files. One file was
the P0–P3 board rubric under a card titled "concurrency budgeting"; another lived
in a different repository. Nothing tied a quote to its source, so nothing noticed.
Two traps showed up while fixing it:

- Measuring line by line is too weak as a rule. Without the length filter, 11 of
  14 lines of one card were "in the source", because lines like `{` match
  anything, and lines found one by one can still be stitched into a rule the file
  never states.
- A verbatim quote is still copy on the page. `retired-labels.test.mjs` reads
  every `<pre>` through `readableText()`, so quoting a real line that says "zero
  debt" fails the banned-register check even though the words are the source's.

**Solution**: `site/tests/ai-artifact-excerpts.test.mjs`. Each source is committed
under `tests/fixtures/ai-artifacts/` from `git show <commit>:<path>`; the test
recomputes the git blob id from the fixture bytes and compares it to the recorded
one (checked upstream with `gh api repos/<repo>/contents/<path>?ref=<commit> --jq
.sha`). Each card must link to `blob/<commit>/<path>`, and each run of its snippet,
split on an elision line `[…]`, must match whole lines of the fixture. The fixture
directory is excluded from pre-commit, whose whitespace fixers would change the
bytes the blob id is computed from. Mutations checked: one word changed in a
quote, a link moved back to `blob/master`, and a byte appended to a fixture each
turn the right test red.

**Rule**: A quote shown as proof is a claim about another file. Pin it to a
commit, link the reader to that commit, and test it against the pinned bytes as
contiguous whole lines. Choose quotes that also pass the page's own copy rules,
because the checks read them like any other text.
