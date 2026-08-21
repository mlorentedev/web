---
id: lesson-007-dependabot-security-updates-bypass-ignore-a
type: lesson
status: active
created: "2026-08-08"
owner: manu
tags: [web, ci-automation, dependencies]
---

# Dependabot security updates bypass `ignore` — a major-version ignore will not stop them

**Context**: PR #85 proposed `astro 5.18.2 -> 7.1.1`, straight through the repo's deliberate
Astro-5 hold. The obvious diagnosis was a missing Dependabot rule, and the obvious fix was to add
a major-version ignore for `astro` + `@astrojs/*`.

**Problem**: That diagnosis was wrong, and the fix would have been a no-op. `.github/dependabot.yml`
*already* ignores every major (`dependency-name: "*"`, `version-update:semver-major`), and the rule
works — it is why routine major bumps never appear. #85 got through because **Dependabot security
updates deliberately ignore `ignore` directives**: they come from the security-alert pipeline, not
the version pipeline. Two tells distinguish them from version updates, both visible before touching
config: a security PR is always a **single package** (never folded into a `groups:` PR), and it
targets the **lowest version that clears the advisory**, not the latest release.

**Solution**: Read the alerts instead of the config. All 8 open Astro advisories turned out to have
no fix on the 5.x line (first-patched 6.1.6 through 7.1.0), which is exactly why the bot proposed a
two-major jump. The hold was not deferring those advisories, it was keeping them open permanently —
so the answer was to retarget the migration ticket (#7, Astro 6 -> 7), not to add config.

**Rule**: When a Dependabot PR violates an `ignore` rule, check whether it is a *security* update
before assuming the config is broken. Single-package + minimum-patching-version means security, and
no `ignore` entry will suppress it — only dismissing the underlying alert, or shipping the upgrade,
will. And when a version hold blocks a security patch, verify whether a fix exists on the held
branch at all: "we will upgrade later" is a different decision from "these stay open forever".
