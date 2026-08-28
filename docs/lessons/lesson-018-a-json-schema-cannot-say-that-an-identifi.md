---
id: lesson-018-a-json-schema-cannot-say-that-an-identifi
type: lesson
status: active
created: "2026-08-27"
owner: manu
tags: [web, validation, json-schema, verification]
---

# A JSON Schema cannot say that an identifier resolves, only that it looks like one

**Context**: WEB-080's diagram pipeline validates each committed archify IR against the
tool's own `architecture.schema.json` before the build will accept it. That was presented,
in the spec and in the first commit, as *the* guarantee: a malformed diagram fails
`npm run build`.

**Problem**: It is a weaker guarantee than it reads. `common.schema.json#/$defs/id`
constrains an identifier's **shape** — a string matching a pattern. Whether that string
names a component that exists is a relation *between* parts of the document, and no
keyword in JSON Schema expresses it. Measured on the real pipeline:

```
$ node scripts/diagrams.mjs verify /tmp/dangling.architecture.json   # to: "nowhere"
diagrams: /tmp/dangling.architecture.json validates
EXIT=0
$ node scripts/diagrams.mjs verify /tmp/dupe.architecture.json       # two components, one id
diagrams: /tmp/dupe.architecture.json validates
EXIT=0
```

Both would have rendered a diagram that lies — an arrow to a machine that is not there, or
two boxes silently collapsed into one — and the build would have called them valid. The
fixture that was supposed to prove the guarantee did contain `from: "ghost"`, but it failed
on a *missing `id`* instead, so the referential case was never exercised. The test passed
and proved something other than what its name claimed.

**Solution**: A `topologyErrors()` pass after schema validation, over every position that
references an id — for this schema `connections[].from`/`.to`, `boundaries[].wraps[]`,
`meta.views[].focus[]` — plus duplicate `components[].id`. Found by review (CodeRabbit,
Major), reproduced before being believed, and covered by a **second** fixture that passes
the schema and fails on references. The tests now assert each fixture fails *for its own
reason*, so neither can pass by accidentally breaking the other way.

**Rule**: When a schema is the gate, enumerate what the schema is structurally incapable of
checking, and write that list down — referential integrity, cross-field consistency,
uniqueness across a collection, anything that needs to look at two places at once. Then ask
of each negative fixture: *which* assertion does it exercise? A fixture with three defects
proves only the first one the validator happens to reach, and reads as if it proved all
three.
