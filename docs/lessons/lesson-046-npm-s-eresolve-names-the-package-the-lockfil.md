---
id: lesson-046-npm-s-eresolve-names-the-package-the-lockfil
type: lesson
status: active
created: "2026-09-22"
owner: manu
tags: [web, dependencies, npm, verification]
---

# npm's ERESOLVE names the package the lockfile anchors, not the one that conflicts

**Context**: WEB-022 (`#7`). We bumped `astro` 5 → 7 and `@astrojs/mdx` 4 → 8
together in `site/package.json`, then ran `npm install` against the existing
lockfile.

**Problem**: npm refused with an ERESOLVE, and the error blamed the package we
had bumped **correctly**:

```text
Found: @astrojs/mdx@4.3.14
Could not resolve dependency: @astrojs/mdx@"^8.0.2" from the root project
Conflicting peer dependency: astro@7.3.4
  peer astro@"^7.2.10" from @astrojs/mdx@8.0.2
```

Read literally, that says mdx 8 conflicts with astro 7. It doesn't: mdx 8
*requires* astro 7. The real conflict was `@astrojs/tailwind` 6.0.2, whose
`peer astro "^3.0.0 || ^4.0.0 || ^5.0.0"` rules astro 7 out. That package
appears nowhere in the message. As far as we can tell from the output, npm
starts from the tree the lockfile describes and reports the first edge it
cannot move, not the edge that forbids the move. Dependabot's `#368` carries
the same lockfile shape: astro 7 next to mdx 4 and tailwind 6.

**Solution**: resolve without the lockfile, in a throwaway worktree, to find
the real edge. The lockfile is only there to seed the search.

```bash
tmpdir="$(mktemp -d)"                          # measurement only
mv package-lock.json "$tmpdir/" && npm install
# peer astro@"^3.0.0 || ^4.0.0 || ^5.0.0" from @astrojs/tailwind@6.0.2
mv "$tmpdir/package-lock.json" . && rm -rf "$tmpdir" node_modules
```

Then throw that result away. The real change starts from the committed
lockfile: first `npm uninstall` the blocker, then install the bump. The diff
then shows only what moved. A regenerated lockfile moves every transitive
dependency at once, and in this repo that looked like a diagram regression:
all 13 mermaid SVGs changed name. That turned out to be `#378`.

The lasting guard does not use npm's error at all.
`site/tests/astro-peers.test.mjs` reads every `peerDependencies.astro` range
from the lockfile and checks each against the installed `astro`. Against
`#368`'s lockfile it names both real culprits, `@astrojs/mdx@4.3.14` and
`@astrojs/tailwind@6.0.2`.

**Observed pattern** (npm 12.0.2, Node 24): in this report, `Found: X` named
the package the lockfile held, and the edge it printed was not the one that
blocked the move. That is one report, not a rule for every resolver error. When
an ERESOLVE names a package you bumped on purpose, resolve without the lockfile
before believing it.
