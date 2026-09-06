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

```text
esbuild                  0.27.3 and 0.25.12   advisory: >= 0.27.3, < 0.28.1
postcss-selector-parser  6.1.2  and 6.0.10    advisory: >= 6.1.0, < 6.1.3
```

`esbuild@0.25.12` and `postcss-selector-parser@6.0.10` sit *below* their
advisory's lower bound and were never vulnerable. Reading the alert as "this
package is bad" churns them for nothing — and worse, makes the fix look
incomplete when they stay at their old versions.

The second half of that framing — *transitive therefore separable* — was wrong
too, but for a different reason with a different cure, so it lives in
[a caret on a `0.x` dependency pins the minor](lesson-043-a-caret-on-a-0-x-dependency-pins-the-minor-n.md).
This lesson is about **which copies are affected**; that one is about **whether
the fix can be reached**.

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

Measured on `#329`: **7 vulnerable copies before, 4 after** — a count of copies,
which is the honest unit, against fifteen alerts naming seven packages.

**Rule**: An identifier that names a *class* is not evidence about any
*instance* of it. Before acting on a dependency alert, enumerate the installed
copies and test each against the range in the alert payload, because the count
of alerts is not the count of vulnerable things and the package name does not
say which copy it means. Two of the seven here needed nothing at all; that is
work not done and a "fix" not falsely reported as incomplete.

See also
[Dependabot security updates bypass `ignore`](lesson-007-dependabot-security-updates-bypass-ignore-a.md)
— the other case where the alert's own framing misleads about what will happen
— and [a mutation you did not verify mutated is not evidence](lesson-037-a-mutation-you-did-not-verify-mutated-is-not.md),
which is why the before/after copy count was measured rather than inferred from
a green `npm audit`.
