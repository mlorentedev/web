---
id: lesson-042-a-dependency-alert-names-a-package-not-the-c
type: lesson
status: active
created: "2026-09-06"
owner: manu
tags: [web, dependencies, verification, npm]
---

# A dependency alert names a package, not the copy that is vulnerable

**Context**: `#270` (`#329`). Fifteen open Dependabot alerts on
`site/package-lock.json`, filed as *"the separable nine vs the eight `astro`"*
— nine transitive advisories assumed clearable by a lockfile bump, with `astro`
held behind its major (`#7`).

**Problem**: Both halves of that framing were wrong, and each in a way that
would have produced work with nothing to show for it.

**An alert names a package; the tree holds several copies of it.** Four of the
seven flagged packages had two installed versions, and in three of those only
one copy was in range:

```
esbuild                  0.27.3 and 0.25.12   advisory: >= 0.27.3, < 0.28.1
postcss-selector-parser  6.1.2  and 6.0.10    advisory: >= 6.1.0, < 6.1.3
```

`esbuild@0.25.12` and `postcss-selector-parser@6.0.10` sit *below* their
advisory's lower bound and were never vulnerable. Reading the alert as "this
package is bad" churns them for nothing — and worse, makes the fix look
incomplete when they stay at their old versions.

**What gates the fix is the parent's declared range, not whether the dependency
is transitive.** Every one of these is transitive; that fact predicts nothing:

| dep | parent's range | patched at | reachable? |
| --- | --- | --- | --- |
| `nanoid` | `postcss` → `^3.3.16` | 3.3.18 | yes |
| `picomatch` | `anymatch` → `^2.0.4` | 2.3.2 | yes |
| `postcss-selector-parser` | `postcss-nested` → `^6.1.1` | 6.1.3 | yes |
| `sharp` | `astro` → `^0.34.0` | 0.35.0 | **no** |
| `esbuild` | `astro` → `^0.27.3` | 0.28.1 | **no** |
| `yaml` | `yaml-language-server` → `"2.7.1"` | 2.8.3 | **no** |

The two `astro` rows are the trap. A caret on a `0.x` version pins the
left-most **non-zero** digit, so `^0.34.0` means `>=0.34.0 <0.35.0` — the patch
is one tick outside a range that looks permissive. Three advisories therefore
fold into the `astro` major that was assumed to gate only eight, making it
eleven.

**Solution**: Judge every installed copy against the range from the alert
payload, rather than the package against the advisory's title.

```bash
gh api repos/O/R/dependabot/alerts --paginate \
  -q '.[] | select(.state=="open") | [.security_advisory.severity,
      .dependency.package.name,
      .security_vulnerability.vulnerable_version_range,
      .security_vulnerability.first_patched_version.identifier] | @tsv'

npm ls --all --json     # then test each installed version against that range
```

Then read the parent's declared range for each blocked one — that is the
sentence that says whether a lockfile bump can reach the patch at all, before
any is attempted. Measured on `#329`: **7 vulnerable copies before, 4 after**,
exactly the three predicted reachable, with `package.json` untouched and a
21-line lockfile diff.

**Rule**: An identifier that names a *class* is not evidence about any
*instance* of it. Before acting on a dependency alert, ask two questions in
order — **which installed copies are actually in the range**, and **what does
each one's parent permit**. The first stops work on copies that were never
affected; the second predicts, before the install runs, which advisories a
lockfile bump can close and which are gated on something bigger. A count of
alerts is not a count of vulnerable things, and "it is transitive" is not a
reason to expect it to move.

See also
[Dependabot security updates bypass `ignore`](lesson-007-dependabot-security-updates-bypass-ignore-a.md)
— the other case where the alert's own framing misleads about what will happen
— and [a mutation you did not verify mutated is not evidence](lesson-037-a-mutation-you-did-not-verify-mutated-is-not.md),
which is why the before/after copy count was measured rather than inferred from
a green `npm audit`.
