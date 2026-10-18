---
spec: "WEB-158"
verdict: "FAIL"
reviewed_sha: "1d24217bedae93b8b36e6ea1d4921ded083b8245"
reviewer: "nan/deepseek-v4-flash"
date: "2026-10-18"
---

## Adversarial review

**Scope**: WEB-158 (`feat/web-158-skills-list`), diff `3c67f510ff860781e191bc9652a6ac8109df6862...HEAD` (3 commits: spec, banned-register refactor, the block itself).
**Sources**: `specs/WEB-158/{proposal,tasks,verification,features}.md`, `specs/WEB-140/proposal.md` (AC2 amendment), the diff at the sha above, and the built output in `site/dist/`.

### Spec and task alignment

- **AC1 (structure)** — met and independently reproduced. `npm run build` (astro check + build) exits 0; the built homes carry `data-home-block="skills"` between `story` and `door` in both locales; 11 `li[data-skill]`, no `img`/`svg`/card. Mutation M1 (remove `<HomeSkills />` from `HomePage.astro`) turns the two order tests, the two text-only tests and the skills tests red (the run's output was truncated at 8 failing lines, all red), so the assertions read the built artifact rather than a constant.
- **AC2 (one source)** — met. Both locales render the same 11 hrefs in the same order from `src/data/skills.ts`; ES internal links are `/es`-prefixed, anchors and external links are not (`useTranslatedPath` only touches `href.startsWith('/')`). M2 (`/lab/` → `/nope/`) and M3 (`#story` → `#storyy`) are both caught.
- **AC3 (proof)** — **letter met, intent broken for one item.** Every item has exactly one link; all site links resolve (`/lab/`, `/ai/`, and `/es/...` exist in `dist`; `id="story"` exists on both homes). All 8 external proofs returned HTTP 200 when re-checked by curl -L on 2026-10-18, so the hand-checked links in `verification.md` still hold. M4 (a `resume` private-repo href) is caught by the allow/deny pair. But item 6's proof is empty — see F1.
- **AC4 (honest copy)** — met for the copy that exists (M5, inserting "Deterministic", fails the banned test; "80" genuinely occurs in `data/experience.ts`), but the figure guard is weak — see F2.
- **Tasks** — every implementation box is `[x]` and each has diff evidence, except the last (PR not yet opened), which is honest. The `banned.mjs` refactor is declared in tasks and is behaviour-preserving: `retired-labels.test.mjs` still passes unchanged.
- **WEB-140 AC2 amendment** — legitimate: WEB-140's frontmatter is still `status: implementing`, not archived, so amending its acceptance criteria is a live edit, not a rewrite of the audit trail. `npm run test:browser` passes at `/`, `/es/` × 1280×720 and 400×740, so WEB-140 **AC1** is genuinely unaffected — the hero carries `data-hero-door`, not the door section, so a block added below the story cannot push it under the fold.
- **Contract staleness** — `proposal.md`, `tasks.md`, `features.json` last modified 21:30–21:35, before `review-request.json` was written at 01:59; nothing in this review touched them. Raw sha256 differs from the recorded `contract_digests`, which is consistent with the launcher normalising checkbox ticks and the harness-owned `state`/`evidence`; the mtimes are the evidence that nothing changed after the request.

### Findings

| Severity | Reality | Area | Finding | Evidence | Test (named, or UNTESTED) | Fix location (code / tests / spec / vault) |
|----------|---------|------|---------|----------|---------------------------|---------------------------------------------|
| Blocker | REAL | copy / proof integrity | Item 6 — "AWS in production, with the infrastructure bill cut by **80%**" — links `#story` labelled "in the story", but the story contains neither "AWS" nor "80" in either locale. The link resolves, so the AC3 test is satisfied while the proof it promises does not exist. | Story text extracted from `dist/index.html` and `dist/es/index.html`: zero occurrences of "80" and no "AWS"; same for `site/src/content/pages/{en,es}-bio.mdx`. `verification.md` states the opposite ("its figure's only source is the CV, already quoted in the story") — that sentence is false. `src/data/experience.ts` (which does hold `−80%`) is imported **nowhere** under `site/src`, so it is not a public proof either. | The named test `[en]/[es] every site link in the skills block lands on a built page or an anchor on the home` passes — it checks that `#story` exists, not that the anchor supports the claim. The link↔claim relation is UNTESTED. | code (`site/src/data/skills.ts`: give item 6 a proof that shows the figure, or restate the item to what the story actually proves — the onboarding 120→20–30 days / Kubernetes platform) + spec (`verification.md` correction) |
| Major | REAL | tests / AC4 guard | The figure check is a substring test — `experienceSrc.includes(f)` — so a fabricated one-digit figure passes. Mutation M9 changed "cut by 80%" to "cut by **4%**" and the whole suite stayed green (11 pass, 0 fail) because the digit 4 occurs somewhere in `experience.ts`. Any figure that is a substring of any other number or date in that file is accepted, which is the common case for 1-digit figures and many 2-digit ones. Compounding it: `experience.ts` is rendered nowhere, so the "source of truth" the guard checks against is invisible to a reader. | Mutation M9 output: `pass 11 / fail 0`. `grep -rn "from '.*experience'" site/src` → no importer; only comments and the `home.experience` i18n key reference it. For contrast, M6 ("300%", absent from the file) *is* caught, so the check has some force. | Named test exists — `[en]/[es] the skills block carries no banned term and no unsourced figure` — but does not prove the criterion for figures whose digits appear incidentally; mark the criterion partially UNTESTED. | tests (extract numeric tokens from `experience.ts` and compare whole tokens, with a red-green case for `4%`); spec decision on whether an unrendered file can be the figure source (`verification.md`) |
| Minor | REAL | spec artifact | All four `features.json` entries remain `"state": "pending"` with `"evidence": ""` while `verification.md` claims all four pass with 319/319. Machine-readable and human-readable records contradict each other. | `specs/WEB-158/features.json` vs `verification.md` §Evidence. WEB-140 and WEB-141 are in the same shape, so this may be a repo-wide convention rather than drift. | N/A (record-keeping, not behaviour) | spec (`features.json` is contract set — only on a re-review round; otherwise leave and document the convention) |
| Minor | REAL | maintainability | `home.skills` was inserted inside the `// Experience timeline (WEB-012)` comment block in `src/i18n/ui.ts`, in both locales, so one comment now groups two unrelated keys. | diff hunk at `ui.ts` lines 399 and 857. | N/A | code |
| Minor | REAL | maintainability | `retired-labels.test.mjs` keeps a stray double blank line where the `banned` array was removed. | diff hunk after the import block; empty line pair before `const proofPages`. | N/A | code |
| Minor | THEORETICAL | accessibility | Two items share the link text "ADR" and two share "runbook". A screen-reader link list reads "ADR, ADR, runbook, runbook…". The short labels are a documented decision (`verification.md` §Decisions: "link text names the artifact"), so this is a trade-off, not an oversight — but the artifact *name* ("ADR-069", "acme alerting runbook") would disambiguate without losing that property. | built block markup, both locales. | UNTESTED (no a11y test covers the home; `tests/lab-axe.mjs` targets /lab) | code (optional) |
| Minor | SPECULATIVE | i18n | The ES copy carries English terms ("review entre modelos", "harness", "merges con puerta", "benchmark", "self-hosted", "edge"). `es-no-english.test.mjs` deliberately covers only /lab and /ai, so the home is unguarded; whether the brand rule extends here is a copy decision, not a defect. | `tests/es-no-english.test.mjs` header scope; built `dist/es/index.html` block text. | UNTESTED | spec (a decision note for `verification.md`) |

### Evaluator rubric

| Dimension | Grade (A-D) | Rationale (one line) |
|-----------|-------------|----------------------|
| Correctness        | C | AC1/AC2/AC4 hold under mutation; AC3's letter holds but one item's promised proof is absent, and one acceptance criterion's guard (AC4 figures) is bypassable. |
| Verification       | C | Commands are reproducible and all pass (build, 319/319, test:browser), but `verification.md` asserts a fact about the story that is demonstrably false. |
| Scope              | A | Diff matches the proposal; the shared `banned.mjs` refactor and the WEB-140 AC2 amendment are both declared and are the only side changes. |
| Reliability        | B | Static content, no runtime error paths; link rot is acknowledged and deliberately unguarded by CI. |
| Maintainability    | B | Small functions, low cyclomatic complexity, comments explain why; two small blemishes (misplaced i18n key comment, stray blank line). |
| Handoff-readiness  | B | Triad updated, WEB-140 amendment recorded, promotion candidates reasoned; `features.json` states left pending per repo convention. |

Rubric alone (two C, no D) would aggregate to PASS WITH GAPS; the **Blocker** forces **FAIL** independently.

### Verdict
FAIL

### Recommended next steps

Contract set is open (this is a FAIL, so a re-review follows). None of the required fixes is *in* the contract set — F1 is code plus `verification.md`, F2 is tests — so the next round can reuse these contract digests.

1. **F1 — code, `site/src/data/skills.ts`.** Give item 6 a proof that actually shows the claim. Two honest options: link a public artifact that states the AWS cost reduction (an ADR/runbook on `mlorentedev/kubelab`), or restate the item to something the story does prove ("the Kubernetes platform that took customer onboarding from 120 days to 20–30", `#story`), dropping the 80% figure from this block. Do not point a "proof" link at a section that never mentions the claim.
2. **F1 — spec, `verification.md`.** Delete or correct the decision note "its figure's only source is the CV, already quoted in the story". It is false as written, and it is the sentence a future reader will trust instead of re-checking.
3. **F2 — tests, `site/tests/skills.test.mjs`.** Parse the numeric tokens `experience.ts` declares (not `includes` on the file text) and compare the block's figures against that set, with a red-green case: "cut by 4%" must fail, "cut by 80%" must pass. Consider whether `experience.ts` — imported nowhere since WEB-140 dropped the Timeline — is still the right figure source; if it is, say so in `verification.md`; if not, ticket its retirement.
4. **Minor items** (i18n comment grouping, stray blank line, `features.json` state): disposition each in `verification.md` as applied, or ticketed with a root cause. The a11y link-text and ES anglicism items are decisions, not defects — record the decision rather than leaving them unmentioned.
5. Re-run `dotf spec review WEB-158` after 1–3. The named minimum to flip to PASS: F1 fixed, its `verification.md` note corrected, and F2's guard proven red-green.

**Archive advisory**: do not archive in the current state.
