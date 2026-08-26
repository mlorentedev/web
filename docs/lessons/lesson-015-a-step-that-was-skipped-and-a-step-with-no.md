---
id: lesson-015-a-step-that-was-skipped-and-a-step-with-no
type: lesson
status: active
created: "2026-08-26"
owner: manu
tags: [web, ci, delivery, observability, process]
---

# A step that was skipped and a step with nothing to do look identical

**Context**: Auditing the delivery path before promoting a release. Three unrelated problems turned out
to be the same one wearing different clothes.

**Problem**: In each case a thing that should have happened did not, and every signal available said
everything was fine.

- **A release with no image (#172).** The arm64 build stalled under QEMU and was killed at the
  six-hour ceiling, so `Promote digest to semver` was *skipped*. GitHub renders a skipped job in grey,
  not red, and the workflow reported success. `v1.10.1` exists as a git tag with no artifact behind it.
  Five earlier releases were lost the same way before a timeout was added — and a timeout is a
  mitigation, not a check.
- **A gate nobody pulls (#190).** Prod promotion is `workflow_dispatch` by design (kubelab ADR-046).
  Its run history is two entries, both on 2026-06-16, the day after it was built. Argo CD kept syncing
  faithfully — production served a **ten-week-old** build, with the newsletter posting to a mesh-only
  address no visitor can reach. Nothing was broken; nobody had pressed the button, and nothing said so.
- **Analytics that never collected (#189).** GA4 was absent from the deployed HTML and Cloudflare Web
  Analytics could not be injecting, because the host is deliberately unproxied. A misconfigured
  analytics setup and a site with no visitors produce the same empty dashboard.

**Solution**: Assert the *consequence*, not the configuration. `scripts/registry_hygiene.py audit`
fails when a published release has no image behind it, which is the check that would have caught all
five lost releases. The registry prune reports what it kept as well as what it deleted. The equivalent
for #190 is anything that makes a prod/staging version gap visible without someone thinking to look.

**Rule**: Wherever a step can be skipped, silently defaulted, or simply never triggered, the absence of
that step must produce a signal of its own. Ask of every green pipeline: *what would this look like if
the important part had not run?* If the answer is "exactly the same", the pipeline is not reporting
success — it is reporting that nothing crashed. The fix is never more discipline about remembering to
check; it is making the silence impossible.
