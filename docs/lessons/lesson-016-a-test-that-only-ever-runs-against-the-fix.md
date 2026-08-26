---
id: lesson-016-a-test-that-only-ever-runs-against-the-fix
type: lesson
status: active
created: "2026-08-26"
owner: manu
tags: [web, verification, testing, method]
---

# A test that only ever runs against the fix proves nothing

**Context**: Fixing the cookie banner (#106), which died outright when `localStorage` threw. The repo
has no browser harness, so the change was driven by hand in Chrome against `npm run preview` — the
shipped inline script lifted out of the rendered page into an iframe whose `localStorage` throws on
every access. Eighteen assertions, all green.

**Problem**: Eighteen green assertions say the new code works. They say **nothing** about whether the
harness can tell the difference. A test that passes on the fix and would also have passed on the bug is
measuring something other than the bug — and there is no way to know which from the passing run alone.

**Solution**: Run the pre-fix code through the identical harness. Lifting the old script out of `HEAD`
and dropping it into the same throwing-storage iframe produced: banner never unhidden, and clicking
Accept a no-op because no listener had been attached. The defect was real and the harness detects it.

Repeated on the registry audit in the same session: removing `1.10.1` from `KNOWN_MISSING_IMAGES` made
the check fail with exit 1, proving it flags a missing release image rather than passing either way.

Both control runs took about two minutes. The first also caught a mistake — the verdict assertion was
inverted, so it printed `inconclusive` while the underlying data confirmed the bug. Without the control
run the inverted logic would have shipped in the PR body as evidence.

**Rule**: Before presenting a verification as evidence, run it against the broken state and confirm it
fails. Green on the fix plus red on the bug is evidence; green on the fix alone is a demonstration that
the code runs. This matters most where there is no test suite to inherit the discipline from — a
by-hand check is exactly the kind that gets written to confirm what its author already believes.
