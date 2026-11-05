---
id: lesson-077-a-second-astro-build-over-fixture-content-wr
type: lesson
status: active
created: "2026-11-04"
owner: manu
tags: [web, astro, testing, worktrees]
---

# A second astro build over fixture content writes the fixtures into the content store the next real build reads

**Context**: WEB-138 proves that a future-dated note ships on its date by running `astro build`
twice over `site/tests/fixtures/notes/`, with `NOTES_DIR` pointing the glob loader there and
`--outDir` writing to a scratch directory.

**Problem**: `--outDir` moves the pages, not the content layer. Astro keeps its data store at
`cacheDir` (`node_modules/.astro/data-store.json`) and writes generated modules to
`site/.astro/`. After the fixture builds, the store held the fixture notes. In this setup the
worktrees share one `node_modules` through a symlink, so every worktree's store held them:
`grep -c fixture-past-note node_modules/.astro/data-store.json` returned 1. A real build
re-synced it and the count went back to 0, but a dev server or a build that trusted the
cache would have served a fake note until then.

**Solution**: `astro.config.mjs` reads `cacheDir: process.env.ASTRO_CACHE_DIR`, and the test
gives each build its own scratch cache next to its scratch output, then removes both. After
the test, the shared store has no fixture. `site/.astro/content-modules.mjs` still names the
fixture files until the next real build rewrites it; that directory is per worktree and
gitignored, and `npm run build` regenerates it before anything reads it.

**Rule**: A test that builds over substitute content redirects every place the build writes,
not only the output: the content store (`cacheDir`) as well as `outDir`. Check the store
after the run, because the output directory being clean proves nothing about it.
