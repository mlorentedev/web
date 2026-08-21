---
id: lesson-003-grep-c-counts-matching-lines-not-matches-use
type: lesson
status: active
created: "2026-07-09"
owner: manu
tags: [web, verification, shell]
---

# `grep -c` counts matching LINES, not matches — useless on minified HTML

**Context**: Verifying the WEB-012 landing build — counting how many `ProjectCard` / `data-metric` / bracketed-section markers appear in `dist/index.html` and `dist/es/index.html`.

**Problem**: `grep -c 'data-metric' dist/index.html` returned `1` for content that plainly appeared 8 times. Astro's build minifies HTML onto essentially one line, and `grep -c` counts matching *lines*, so it reports `1` no matter how many matches share that line — a silently wrong verification signal that reads as "the element is barely there".

**Solution**: Count matches, not lines: `grep -o 'data-metric' file | wc -l`, or normalize whitespace first (`tr '>' '>\n' < file | grep -c …`) so each element lands on its own line.

**Rule**: When grepping minified / single-line build output, never use `grep -c` for a count — use `grep -o … | wc -l`. `-c` is "lines with a match", which collapses to 0/1 on minified HTML and will quietly under-report.
