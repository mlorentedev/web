---
id: lesson-022-a-number-that-is-only-printed-is-never
type: lesson
status: active
created: "2026-08-31"
owner: manu
tags: [web, testing, verification, WEB-080]
---

# A number that is only printed is never questioned — and an assertion that cannot fail is worse

**Context**: WEB-080 PR4 enabled `tests/lab-containment.mjs` in CI. It had been
written in PR0 and run by hand a few times since.

**Problem**: three defects, all in code whose whole job was to catch defects.

**1. Output that could not be wrong.** On every run it printed a line like:

```
✓ /lab @ 320px — document contained, 2 diagram(s), 0 scrolling internally
```

`0 scrolling internally` at 320 px cannot be true of a 754 px diagram in a 320 px
viewport — something has to absorb the overflow. It counted `<figure>` elements
whose `scrollWidth > clientWidth`, while the element that actually scrolls is a
`div` inside the figure. Nobody questioned the number for the same reason nobody
questions any decoration: it was printed, never asserted, so being wrong cost
nothing.

Turning it into an assertion — *below the legibility floor, every diagram must
scroll or the check fails* — immediately caught a real bug: `min-w-[754px]` sat on
a wrapper with `p-3`, so the padding took 24 px off the content box and the
diagram rendered at **730 px**, under the floor, at two widths on both locales.

**2. A red that meant nothing.** The script required a server already listening on
`:4321` and did not start one. Without it, all eight checks failed with
`ERR_CONNECTION_REFUSED` and it reported "8 check(s) failed" — the same red
whatever the page looked like. It serves `dist/` itself now.

**3. An assertion that could not fail, written while complaining about assertions
that cannot fail.** Review asked what happens if the SVG generator emits a
reference syntax the id-namespacing does not rewrite. The first guard checked that
every reference *started with the prefix* — which is true by construction
immediately after prefixing them. It asserted nothing at all.

The property that matters is that a reference **resolves** to a declared id: if a
syntax is missed, the ids around it still get prefixed and that reference is left
pointing at a name no element has.

**Solution / rule**: three questions before trusting any check.

- **Can this line be wrong and still print?** If yes it is decoration. Assert it or
  delete it — a wrong number that is never checked trains everyone to skim.
- **Can this fail for a reason unrelated to what it measures?** A missing server, a
  missing build, an unreachable host. Make the check own its preconditions.
- **Can this assertion fail at all?** Try to break it *by execution*, not by
  reading it. Both fixed guards here were proven by injecting the defect and
  watching the build fail.

**Takeaway**: the third one is the uncomfortable part — the vacuous guard was
written *in the same commit* as an argument about vacuous guards. Reading your own
assertion and agreeing with it is not evidence. Running it against a deliberate
failure is.

**Related**: `lesson-019` (a guard that cries wolf), `lesson-016` (a test that only
ever runs against the fix), `lesson-021` (namespacing the diagram ids).
