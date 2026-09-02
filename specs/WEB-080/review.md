---
spec: "WEB-080"
verdict: "PASS-WITH-GAPS"
reviewed_sha: "410699dda5c4cf0599a20f3916acdb387b43c17b"
reviewer: "claude-sonnet-5"
date: "2026-09-02"
---

# Adversarial review — WEB-080

> **Reviewer independence: partially satisfied, and the shortfall is declared
> rather than hidden.** The reviewer was a separate agent with no part in the
> implementation, holding read-only tools, working from the merged tree and its
> own re-execution of every command — that is real independence of *work*. But
> it ran on `claude-sonnet-5`, and the implementer was `claude-opus-5`: the same
> model family. The doctrine this repo inherits requires that an adversarial
> review "never runs on an Anthropic model", enforced elsewhere by
> `harness/reviewer-pool.json`. **This repository has no `reviewer-pool.json`,
> so nothing declined the signature** — `harness/` here contains only
> `review-attestation.json`. That absence is exactly the "configured but not
> practised" gap this review's own findings are about, and it is filed as a
> follow-up rather than papered over. Read the verdict below as a strong
> independent check, not as a satisfied family-independence rule.

**Scope**: `/lab` and `/es/lab` rebuild — PRs #251, #257, #262, #263, #264, #266, #267, #271.

**Sources**: `specs/WEB-080/{proposal,tasks,verification}.md`, `features.json`, and `site/` at `410699d`. HEAD moved to `78a6850` mid-review (a docs-only ADR-056 amendment on a different branch); `git diff --stat 410699d 78a6850 -- specs/WEB-080 site/` is empty, so no finding is affected.

## Coverage — what was run, not what was read

- `npm ci` (axe-core was absent from a pre-existing `node_modules` — environment drift on the reviewer's machine, not a spec defect; CI installs fresh)
- `npm run build` → 79 pages, 0 errors — matches the claim
- `npm test` → **94/94**, output diffed against `verification.md`
- `npm run test:browser` → **8/8** at 320/768/1440/2048 × 2 locales
- `npm run test:a11y` → **0 violations across 8 runs**, 43–44 rules passed each
- `npx astro check` → **0 errors, 0 warnings, 0 hints**, 59 files
- **axe non-vacuity reproduced independently**: reverting the provenance-link underline in `dist/lab/index.html` alone makes axe fail (`link-in-text-block`, 1.1:1) on the mutated locale only; restoring it passes again
- **Build-gate staleness reproduced**: mutating a committed IR without regenerating its SVG makes `npm run build` exit 1 at `prebuild` with "changed since its SVG was generated"
- **AC4 fixture integrity**: `services.yaml.j2` pulled from kubelab at the pinned commit `6cd9ab0ca594` over the network — **byte-identical**, sha256 matches
- **AC4 reachability re-measured independently**: all 13 links re-curled; **every HTTP status in `verification.md` § PR5 matches exactly** (2 private/404, 1 stale→corrected-and-noted, 4 mesh/302→Authelia, 6 public/200)
- Built HTML: 1 `<script>`, 0 `astro-island`, 0 `text-[Npx]`, 0 arbitrary colour values, 9 numbered sections each with an eyebrow, `IdpPage.astro` absent
- **Page-internal consistency**: "nine machines… one powered down" ↔ 9 infra rows (8 active + 1 standby) ↔ topology caption "eight of the nine" — all agree. "13 entries… 5 you can open from here" ↔ exactly 5 of 13 carry `access: public` — agrees
- Closing checklist: no agent-draft markers anywhere; no lint script, no ESLint/Prettier config, real pre-commit hooks present — the "stated skip" is true; frontmatter is `verifying`, not `archived`
- PR7 diff vs its stated scope: matches, plus a 2-line `i18n/ui.ts` addition (the scroll container's `aria-label`), an obviously necessary consequence of the same change
- **`assertViewerAffordancesGone`'s root-element heuristic probed both directions**: a simulated future archify relabelling ("Focus" → "Select") is correctly thrown on; a legitimate root-level `aria-label` alongside a stray descendant one flags only the descendant. **No hole found.**
- The XSS fix (`1366e2d`, `check.component` via `textContent`) is present and correct

## Findings

Three Minor, all REAL and reproduced. No Blocker, no Major, no acceptance criterion failed.

| # | Severity | Area | Finding | Status |
| --- | --- | --- | --- | --- |
| 1 | Minor | security (test-only) | `tests/lib/serve.mjs` did `join(distDir, decodeURIComponent(req.url))` with no containment check — path traversal (CWE-22). Reproduced: `GET /../../../../../../../etc/passwd` returned **200 with the file**. Exposure was small (localhost, ephemeral port, ~30 s per run, never in the deployed image) but it is the least-reviewed new code in the spec | **Fixed** — `resolveWithinDist()` + `tests/serve-containment.test.mjs`, 5 tests |
| 2 | Minor | test coverage | `scripts/diagrams.mjs`'s `verify(explicitFile)` branch validates schema only and never reaches the `ir-sha256` stamp check, so it structurally cannot detect a stale IR. **This does not make `features.json` f2 vacuous** — the reviewer initially judged it so and retracted after running the full `&&`-chain verbatim: it fails correctly at step 1, in `lab-diagrams.test.mjs`'s independent sha256 recomputation. What is missing is a named test over `diagrams.mjs`'s *own* stale-refusal path, which only CI's no-arg `prebuild` exercises | Ticketed |
| 3 | Minor | documentation drift | `tasks.md` and `verification.md` named the PR7 guard `assertNothingFocusable`; the function is `assertViewerAffordancesGone` | **Fixed** in this commit |

## AC4 / AC5 amendments — legitimate corrections, not quiet weakening

This was the question the review was asked to answer hardest, and the answer is that both hold.

**AC4.** The reviewer re-curled all thirteen links independently and obtained the exact first-hop codes `verification.md` records. The original wording — "the same entries **and links**" — genuinely could not have shipped six of them to a public page. `sourceHref` + `access` + `urlNote` is a **stricter** replacement than the wording it replaced: it is pinned to a commit, complete, and machine-checked against a committed fixture, where "the same links" was checked by nothing.

**AC5.** The console's own source and ADR-056 §4.3 back the claim. The reviewer independently confirmed `access-control-allow-origin: *` is really served, so "zero JS was never true, and an ADR outranks a spec's scoping note" is a correction of the record rather than a relaxation of it. The replacement — exactly one script, no hydrated island — is enforceable where the original was merely untrue.

## Rubric

| Dimension | Grade | Rationale |
| --- | --- | --- |
| Correctness | B | All six ACs independently re-verified against the built artefact; three Minor gaps under adversarial pressure, none touching an AC |
| Verification | A | Every recorded command re-run verbatim with matching output; AC4 cross-checked against live kubelab and live curl, independently of the spec's own evidence |
| Scope | A | PR7's diff matches its stated scope but for one 2-line, necessary i18n addition |
| Reliability | B | The guard chain probed in both directions and holds; the two coverage gaps are the deduction |
| Maintainability | A | Dense but precise comments; every non-obvious choice documents its own failure mode |
| Handoff-readiness | A | Evidence, lessons and promotion candidates present; the archive checklist reflects what is still open |

## Verdict

**PASS WITH GAPS.** Archive is advisable. Findings 1 and 3 were fixed on receipt; finding 2 is ticketed. The reviewer-independence shortfall declared at the top of this file is ticketed separately and is the one item a reader should weigh for themselves.
