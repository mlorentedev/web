---
id: lesson-043-a-caret-on-a-0-x-dependency-pins-the-minor-n
type: lesson
status: active
created: "2026-09-06"
owner: manu
tags: [web, dependencies, npm, semver]
---

# A caret on a `0.x` dependency pins the minor, not the major

**Context**: `#270` (`#329`). Deciding which Dependabot advisories a
lockfile-only bump could close. `sharp@0.34.5` was flagged with the patch at
`0.35.0`, and `astro` declares `sharp: "^0.34.0"`. A caret reads as *"minor and
patch updates are fine"*, so `0.35.0` looked like a routine bump away.

**Problem**: It is unreachable. `^` pins the **left-most non-zero** digit, and
for a `0.x.y` version that digit is the *minor*:

```
^1.34.0   ->  >=1.34.0 <2.0.0     minor bumps allowed
^0.34.0   ->  >=0.34.0 <0.35.0    minor bumps FORBIDDEN
^0.0.34   ->  >=0.0.34 <0.0.35    patch bumps forbidden too
```

So `^0.34.0` excludes `0.35.0` by exactly one tick, and no amount of
`npm update` will cross it. The same shape hid a second one in the same tree:
`astro` declares `esbuild: "^0.27.3"`, capping at `<0.28.0` against a patch at
`0.28.1`.

Read across the whole set, the gate is never *transitive vs direct* — all six
of these are transitive — but always what the parent declares:

| dep | parent's range | patched at | reachable? |
| --- | --- | --- | --- |
| `nanoid` | `postcss` → `^3.3.16` | 3.3.18 | yes |
| `picomatch` | `anymatch` → `^2.0.4` | 2.3.2 | yes |
| `postcss-selector-parser` | `postcss-nested` → `^6.1.1` | 6.1.3 | yes |
| `sharp` | `astro` → `^0.34.0` | 0.35.0 | **no** |
| `esbuild` | `astro` → `^0.27.3` | 0.28.1 | **no** |
| `yaml` | `yaml-language-server` → `"2.7.1"` | 2.8.3 | **no** |

The three reachable rows all carry a caret at or above `1.0.0`, where it means
what people expect. The two blocked carets are the `0.x` ones — and the third
blocked row is an exact pin, which at least *looks* like the constraint it is.

The trap is that a `^0.` range *looks* permissive. Reading `^0.34.0` with `^1.34.0`
semantics — the ones that apply to most dependencies in any given file —
predicts a bump that cannot happen. On `#270` that misprediction moved three
advisories from "clearable now" to "gated on the `astro` major", turning the
eight that ticket expected into eleven.

**Solution**: Read the leading digit before reading the caret.

```bash
node -p "require('./node_modules/<parent>/package.json').dependencies['<dep>']"
# ^0.34.0  -> the ceiling is 0.35.0, not 1.0.0
```

The general check is to ask the resolver whether the patched version satisfies
the declared range, rather than to read the range yourself:

```bash
node -e "const s=require('semver');
  console.log(s.satisfies('0.35.0','^0.34.0'), s.validRange('^0.34.0'))"
# false >=0.34.0 <0.35.0-0
```

Use this form and not the `npx semver` CLI: measured 2026-09-06, that prints
npm's own notices and **exits 0 whether or not the version satisfies**, so it
answers "no" in a way `set -e` cannot see. `satisfies()` returns an explicit
boolean, which is the whole point of asking.

**Rule**: `^` does not mean "same major" — it means "same left-most non-zero
digit", and below `1.0.0` that is the minor. Since pre-`1.0` packages are
everywhere in a JavaScript tree (`sharp`, `esbuild`, and most build tooling),
treat every `^0.` range as a **minor pin** and check the ceiling explicitly
before predicting that any update will reach a given version. The consequence
is not cosmetic: it decides whether a security patch is one command away or
blocked behind someone else's major.

See also
[a dependency alert names a package, not the copy that is vulnerable](lesson-042-a-dependency-alert-names-a-package-not-the-c.md),
the same investigation — that one is about which copies are in range, this one
about whether the fix can be reached at all.
