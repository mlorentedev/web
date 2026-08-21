---
id: web-lessons-format
type: reference
status: active
created: "2026-08-21"
owner: manu
tags: [web, lessons, format]
---

# Lesson format

One lesson per file: `docs/lessons/lesson-NNN-<slug>.md`.

The set is flat — there are few enough lessons that categories would cost more than
they save. If it grows past roughly 40, split into `docs/lessons/<category>/` the way
[`kubelab`](https://github.com/mlorentedev/kubelab/tree/master/docs/lessons) does.

Numbers are assigned in the order lessons were filed and never change, so a citation
stays valid. A new lesson takes the next free number — do not renumber to keep the set
sorted, the index does the sorting.

## Front-matter (required)

```yaml
---
id: lesson-NNN-<slug>        # must equal the filename without .md
type: lesson
status: active
created: "YYYY-MM-DD"        # when the lesson was learned, not when filed
owner: manu
tags: [web, <topic>, ...]
---
```

The slug is the title, lowercased, non-alphanumerics collapsed to `-`, truncated to 44
characters. `id` and filename must match — a mismatch breaks the index.

## Body

The heading is the lesson's claim, stated as a finding rather than a topic —
"`grep -c` counts LINES, not matches", not "About grep". Then four sections:

```markdown
# <the claim>

**Context**: What was being done.

**Problem**: What went wrong, or what turned out to be true.

**Solution**: How it was resolved, with the command or diff that proves it.

**Rule**: The pattern to follow next time — the part worth reading alone.
```

**Links must be relative markdown**, not Obsidian wikilinks — that is,
`[title](lesson-003-slug.md)` and never `[[lesson-003-slug|title]]`. Wikilinks render as
literal text on GitHub, which is where these are read.

**Protocol**: write the lesson in the session that produced it. A correction noticed and
not written down is the one that recurs.

After adding a file, add its row to [`_index.md`](_index.md) and bump the count in its
opening line.
