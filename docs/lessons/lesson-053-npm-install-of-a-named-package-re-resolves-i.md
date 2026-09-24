---
id: lesson-053-npm-install-of-a-named-package-re-resolves-i
type: lesson
status: active
created: "2026-09-23"
owner: manu
tags: [web, npm, dependencies, lockfile]
---

# npm install of a named package re-resolves its whole subtree

**Context**: WEB-136 replaced `@beoe/rehype-mermaid` with a local plugin built on the two libraries it wrapped, `@beoe/rehype-code-hook-img` and `mermaid-isomorphic`. Both were already in the lockfile as its dependencies, at 0.4.1 and 3.1.0. The change only needed to promote them to direct dependencies.

**Problem**: `npm install @beoe/rehype-code-hook-img@^0.4.1 mermaid-isomorphic@^3.1.0` promoted them, and also moved 23 other lockfile entries to newer versions inside their ranges. Among them were `mermaid` 11.17.1 → 11.17.2, `dompurify`, `cytoscape`, and `@antfu/install-pkg` across a major (1.1.0 → 2.1.0). Naming a package tells npm to resolve that package again, and its dependencies come along. For a change whose whole claim is "the diagrams render exactly as before, only the ids are stable", a renderer bump would have been an unmeasured variable.

**Solution**: Restore the lockfile, edit `package.json` by hand (remove the wrapper, add the two with the ranges the lockfile already satisfies), and run a bare `npm install`. npm then keeps every locked version that still satisfies its range. The lockfile diff was only the wrapper and its four nested copies. The comparison script below shows it, and it is worth running before every dependency commit:

```sh
node -e "const o=require('./old-lock.json').packages, n=require('./package-lock.json').packages;
for (const k of new Set([...Object.keys(o), ...Object.keys(n)]))
  if (k && o[k]?.version !== n[k]?.version) console.log(o[k]?.version, '->', n[k]?.version, k)"
```

**Rule**: To add or promote a dependency without moving anything else, edit `package.json` and run `npm install` with no arguments. `npm install <name>` is an upgrade of that name's subtree. Diff the lockfile by package and version, not by line count, before committing.
