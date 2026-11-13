---
id: "lesson-075-each-review-round-found-a-new-hole-in-a-rege"
type: lesson
status: active
title: "Each review round found a new hole in a regex HTML tokenizer; the parser already in the tree closed them all"
created: "2026-11-04"
owner: manu
tags: [web, testing, html]
---

# Each review round found a new hole in a regex HTML tokenizer; the parser already in the tree closed them all

**Context**: `site/tests/no-client-js.test.mjs` (WEB-179) refuses every way a built page
could run code: a non-JSON-LD `<script>`, an `on*` handler, or a `javascript:` URL. It read
the markup with regexes for a tag, an attribute and a script body.

**Problem**: Each review found a page that runs code and that the detector passed:
- first, a `>` and an `onclick=` inside a quoted value;
- then a repeated attribute (the `Map` kept the last value, the browser keeps the first),
  and an entity-encoded `&#106;avascript:`;
- then an empty `type=`, and a literal `<script>` inside an attribute that made the
  body strip swallow the markup up to the next real `</script>`.

Every fix was correct, and every fix left the next case open. A regex reimplements the
HTML5 tokenizer one rule at a time, and the reviewer could always name the next rule.

**Solution**: Parse with `parse5`, the HTML5 parser that `hast-util-from-html` already
installed (7.3.0, now declared as a dev dependency; the lockfile gains one line). The parser
applies the tokenizer's rules: first attribute wins, entities are decoded, script bodies
are raw text, and a bare `=` takes the next word as its value. Every detector case passes,
including `<a href= onclick="x()">`. The browser reads that as an `href` whose value is
`onclick="x()"`, with no handler, and the regex version had the case wrong. A built page
with an injected handler and script still fails, naming the page and both findings.

**Rule**: When a test needs to read HTML the way a browser does, use a spec-conformant
parser from the first commit, and check `package-lock.json` for one already in the tree. A
regex tokenizer becomes a list of exceptions that stays open, and each review adds to it.
