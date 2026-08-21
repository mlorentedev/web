---
id: lesson-009-obsidian-wikilinks-render-as-literal-text-on
type: lesson
status: active
created: "2026-08-21"
owner: manu
tags: [web, docs, github]
---

# Obsidian wikilinks render as literal text on GitHub

**Context**: `docs/lessons.md` had been split into one file per lesson, with an
`_index.md` linking them. Structurally correct, and the index was unusable.

**Problem**: Both the stub and the index used Obsidian wikilink syntax —
`[[docs/lessons/lesson-001-slug|title]]`. Obsidian resolves those; **GitHub does not**, and
renders them as literal text, brackets and pipe included. Repo docs live under the
knowledge-placement model precisely so they can be read on GitHub by people who do not have
the vault, so the one surface the split existed to serve was the one where every link was
dead text.

**Solution**: Converted to relative markdown — `[title](lesson-001-slug.md)`. Added a check
that every relative link in the index resolves to a real file, that every `id` matches its
filename, and that no `[[` survives outside the two files that quote the syntax on
purpose — `_format.md` and this lesson.

**Rule**: Anything under a repo's `docs/` is GitHub-rendered, so it uses relative markdown
links, never wikilinks. Vault notes may use wikilinks; repo docs may not. When migrating
content out of the vault into a repo, converting link syntax is part of the migration, not
a follow-up — and it is worth a mechanical check, because a broken wikilink still *looks*
like a link in the source.
