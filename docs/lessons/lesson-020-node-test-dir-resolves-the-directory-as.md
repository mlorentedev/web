---
id: lesson-020-node-test-dir-resolves-the-directory-as
type: lesson
status: active
created: "2026-08-27"
owner: manu
tags: [web, testing, node]
---

# `node --test <dir>` resolves the directory as a module on Node 26

**Context**: WEB-080 added this repo's first test runner. `tasks.md` specified
`"test": "node --test tests/"`, which is the documented form and works on Node 20–22.

**Problem**: On Node 26.3.0 it does not run anything:

```
$ node --test tests/
Error: Cannot find module '/home/manu/Projects/web/site/tests'
    at Module._resolveFilename …
  code: 'MODULE_NOT_FOUND'
✖ tests (24.784814ms)
ℹ pass 0
ℹ fail 1
```

The directory is resolved as an entry module instead of as a test directory. Note the shape
of the failure: it reports `fail 1` and exits non-zero, so it *looks* like a failing test
rather than a runner that never started. A suite that silently ran zero tests while
reporting a failure is a confusing few minutes; the reverse — reporting success — would
have been worse.

The repo pins Node 22 in `.nvmrc` and `node:22-bookworm-slim` in the Dockerfile, so **CI
would have been fine and only local runs on a newer Node would break** — the kind of split
that gets diagnosed as "works in CI, broken on my machine".

**Solution**: The glob form works on both: `node --test "tests/*.test.mjs"`. Quoted, so the
shell does not expand it. Verified 6/6 and later 12/12 on **22.13.1 and 26.3.0** before the
claim that it works on both was written down.

**Rule**: The runtime this repo pins is not the runtime a developer has active. When adding
tooling to `package.json`, run it under the pinned version *and* under whatever `node -v`
says locally — the gap between them is invisible until someone else hits it. Stating
"works on 22 and 26" in a spec is a claim; run both before writing it.
