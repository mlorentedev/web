---
id: lesson-017-a-comment-can-be-true-of-the-design-and-fa
type: lesson
status: active
created: "2026-08-26"
owner: manu
tags: [web, documentation, verification, process]
---

# A comment can be true of the design and false of the deployment

**Context**: One session, four separate documents that described the system accurately as intended and
inaccurately as built.

**Problem**: Each one was believed, and each cost time or a wrong decision.

- `site.ts` stated *"Cloudflare Web Analytics is injected automatically at the edge (proxied site) —
  do not add the beacon here or it would load twice."* The host is not proxied: `dig` resolves straight
  to the origin and responses carry no `cf-ray`. Nothing had been collecting for months, and the comment
  is precisely why nobody added a beacon.
- `secure-headers.yaml:4` names *"Source of truth for header values: `edge.traefik.headers_*` in
  `common.yaml`"*. That key does not exist. A maintainer who trusts it edits a file nothing reads.
- `release.yml`'s header says *"kubelab's gated promote-prod.yml then ships that semver tag"*, which
  reads as an automatic handoff. It is a manual dispatch that has run twice, in June.
- The privacy policy described registration forms, a membership and client invoicing — none of which
  exist. The one document whose job is disclosure disclosed the wrong things.

The failure ran in both directions. Twice a decision record was **right** and had simply not been read:
the unproxied host is deliberate (kubelab ADR-049 C16 classes proxy-on as a posture change), and the
domain split was already settled in ADR-017. Assuming the deployment was authoritative would have
overturned two good decisions.

**Solution**: Verify by consequence, then reconcile against the decision record — both, in that order,
and never one alone. `curl`, `dig` and the response headers established what is true today; ADR-049 and
ADR-017 established whether that state was chosen. A first recommendation to enable the Cloudflare proxy
was withdrawn on the second step.

**Rule**: A comment asserting infrastructure state is a claim with a date on it, and the date is
invisible. Check it against the running system before relying on it, and check the running system
against the ADRs before "fixing" it — deployment reality tells you *what*, the decision record tells you
*whether it was meant*. When a comment turns out to be wrong, correct it in place rather than deleting
it: the next reader will otherwise re-derive the same wrong conclusion from the same silence.
