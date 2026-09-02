---
id: lesson-026-an-acceptance-criterion-has-an-audience
type: lesson
status: active
created: "2026-09-01"
owner: manu
tags: [web, sdd, spec, WEB-080]
---

# An acceptance criterion has an audience, and a spec that does not name it can be satisfied to the letter and still be wrong

**Context**: WEB-080's AC4 said the Lab's AI & Automations section must carry
"the same entries **and links**" as kubelab's homepage template at a pinned
commit. It reads like the tightest kind of criterion: a fixed source, a fixed
commit, machine-checkable, no room to argue.

**Problem**: it cannot be met on a public page, and shipping it verbatim would
have satisfied the criterion by putting **six dead links on the site**.

The template feeds `home.kubelab.live`, which lives **behind the mesh**, where
every one of those links is correct. `/lab` is public, where four of them are
Authelia login walls, two point at a private repository, and a seventh 404s for
everyone. The criterion was written by reading the source file and never asking
*who would be standing in front of the result*. Both surfaces render "the same
links"; only one of them has a reader who can follow them.

The tell was there in the codebase already — `platform.ts` carries the comment
*"Public services only — internal endpoints are not shipped to the client"* — and
PR3 had already rendered that boundary as a per-service `public` / `mesh` badge.
The spec simply did not connect the two, because AC4 was about *fidelity to a
source* and the boundary is about *fidelity to a reader*.

**Solution**: split the criterion along the axis that was missing, and amend the
spec in place with the measurement that forced it.

- **Faithfulness** moved to `sourceHref` — every entry pins the template's link
  verbatim, compared against a committed fixture of that file at that commit.
  Machine-checked, complete, and reproducible regardless of what kubelab does
  next.
- **Reachability** became its own honest assertion: each entry declares
  `public` / `mesh` / `private`, a link is *rendered* only for `public`, and any
  URL that departs from its `sourceHref` carries a note saying why.

The amendment is written into `proposal.md` beside the original wording, with the
first-hop HEAD table in `verification.md`, rather than the criterion being
quietly reworded. A spec whose history is edited away cannot be audited.

**Takeaway**: every acceptance criterion has an implied audience, and when a
criterion is copied from a system with a different audience it arrives looking
rigorous and being wrong. Ask of each one: *who is standing in front of this, and
what can they see, reach and do?* Migration criteria are the highest-risk case,
because faithfulness to the source is easy to measure and is not the same
property as correctness for the destination — and the more machine-checkable the
criterion looks, the less likely anyone is to re-ask the question.

Corollary for the amendment itself: amend the spec, do not silently narrow the
work. "We could not meet AC4 as written, here is the measurement and here is what
replaced it" is a decision. Shipping something narrower and ticking the box is
not.

**Related**: `lesson-025` (the check that hid this for a while), `lesson-023`
(measure before trusting the spec), `lesson-027` (a recorded command that
asserts nothing).
