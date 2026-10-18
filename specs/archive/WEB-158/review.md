---
spec: "WEB-158"
verdict: "PASS"
reviewed_sha: "bc9ccdcf2267fe2fedb944bec18d52c727a75b6a"
reviewer: "nan/deepseek-v4-flash"
date: "2026-10-18"
---

## Adversarial review

**Scope**: WEB-158 round 2 (`fix/web-158-review`), diff `dcd8008a32ef6c45025d1d511575057554c3bf54...HEAD`, four commits: the block (`ca5b8e5`), the whole-token figure guard (`dee5271`), the i18n grouping (`9f9f11b`), the round-1 record (`bc9ccdc`). This is the whole change, not the round-1 delta.
**Sources**: `specs/WEB-158/{proposal,tasks,verification,features}.md`, the round-1 review (`review-round1.md`), `specs/WEB-140/proposal.md`, `harness/{reviewer-pool,review-attestation}.json`, the diff at the sha above, and the built output in `site/dist/`.

### Spec and task alignment

- **AC1 (structure) — met, reproduced.** `cd site && npm run build` (astro check + build) exits 0; the built homes carry `data-home-block="skills"` between `story` and `door` in both locales; 11 `li[data-skill]`, no `img`/`svg`/card. Mutation: deleting the skills section from `dist/index.html` turns **`[en] the home's blocks come in order after the hero: story, skills, door, notes`**, **`[en] the story, the skills and the notes are text: no image, svg or card`** and **`[en] the skills block lists 11 items, each with exactly one link`** red; restoring gives 34/34 across `home.test.mjs` + `skills.test.mjs`. The order test is an exact `deepEqual`, so a removed `<HomeSkills />` cannot pass.
- **AC2 (one source) — met.** Both locales render the same 11 hrefs in the same order from `src/data/skills.ts`; ES internal links take `/es`, anchors and external links do not (`translatePath` only touches a leading `/`). Mutations caught: `/lab/` → `/nope/` (broken site link), ES `/es/lab/` → `/es/ai/` (**`both locales list the same proofs, in the same order`**).
- **AC3 (proof) — met.** Every item has exactly one link; site links resolve in `dist` (`/lab/`, `/ai/`, `/es/...`, `id="story"` in both homes). All 8 external proofs re-checked anonymously today: 200 (`kubelab` ADR-069, ADR-056, `acme-alerting`, `offsite-backup-restore`; `pypi.org/project/hive-vault`; `pollex` benchmark; `vicon-fpga-face-detection`; `emva1288-sensor-characterization`), and every repo named in the test's allowlist (`kubelab`, `hive`, `pollex`, `pdf-modifier`, `dotfiles`, `ts-bridge`) is public, so the allowlist itself does not name a private repository. Mutation: a `resume`-repo href fails **`[en] every external proof is public: an allowed owner, never a private repository`**.
- **AC4 (honest copy) — met for the copy that exists.** Mutation "Deterministic" fails **`[en] the skills block carries no banned term and no unsourced figure`**; "cut by 80%" → "cut by 4%" fails the same named test (the round-1 F2 fix works); "80" is sourced by `data/experience.ts` (`infra −80%`), and `1288` is exempt by name. See M2 for the guard's remaining blind spot.
- **Round-1 F1 is resolved at this base, not merely argued.** The branch is now based on `dcd8008`, which is after `6a88239` (#418); both built homes carry the claim the item links to: `infrastructure bill fell by 80%` (`dist/index.html`) and `factura de infraestructura bajó un 80%` (`dist/es/index.html`). The `#story` proof for item 6 is therefore real at HEAD, in both locales. The `verification.md` sentence explaining the round-1 decline is now stale — M1.
- **WEB-140 AC2 amendment is legitimate**: WEB-140 is still `status: implementing`, so the five-block rewrite is a live edit. **WEB-140 AC1 is unaffected** and re-verified: `npm run test:browser` passes at `/`, `/es/` × 1280×720 and 400×740; the first-screen target is `[data-hero-door]` in `Hero.astro`, so a block added below the story cannot push it down.
- **Tasks**: every implementation box is `[x]` with diff evidence; the one open box (PR opened) is stale — PR #461 is **MERGED** (M4).
- **Contract freshness (verified mechanically, not assumed).** I reproduced `ContractDigests` from `dotfiles/cli/internal/spec/contract_digest.go` (LF folding, frontmatter `status:` folded to `-`, checkbox ticks normalised, `features.json` re-encoded with `state`/`evidence` removed and Go's HTML escaping) and all three digests match `review-request.json`: `proposal.md` `1ad3398…`, `tasks.md` `e1977c7…`, `features.json` `dc3fd78…`. This review is therefore fresh for the archive; no contract file was touched by this run.
- **Archive pre-flights, as structured**: no `[AGENT-DRAFT]`/`[AGENT-SUGGESTION]` in the spec's author files (the review-state files — `review.md`, `review-round1.md`, the transcript, `review-request*.json` — are skipped by `IsReviewState`/`parseRound` by design, which matters because the transcript necessarily contains the literal); the three "Promotion candidates" lines are each answered `no: <reason>`, which `CheckPromotions` accepts.
- **Test retention (deletion audit)**: the only test code removed is the local `figures()` in `bio.test.mjs`, replaced by `tests/lib/figures.mjs` under a new named test file. Field 1: it could detect a bio figure absent from `experience.ts` (substring form). Field 2: the replacement is strictly stronger — mutation "cut by 4%" is now red, where the old `includes` accepted it (round-1 M9 / this round's re-run). Field 3: non-test callers of the seam — `skills.test.mjs` and `bio.test.mjs` both import the helper; no production code unlocked. Field 4: the local helper existed only inside `bio.test.mjs`; no external contract depended on it. Field 5: `cd site && node --test tests/figures.test.mjs tests/bio.test.mjs`. The `banned` list moved to `tests/lib/banned.mjs` and `retired-labels.test.mjs`'s **`no banned term on the proof pages, in either locale`** still runs against the shared list — behaviour preserved, not dropped.

### Findings

| Severity | Reality | Area | Finding | Evidence | Test (named, or UNTESTED) | Fix location (code / tests / spec / vault) |
|----------|---------|------|---------|----------|---------------------------|---------------------------------------------|
| Minor | REAL | spec artifact | `verification.md` still says the branch "was cut before #418 merged, so a build of the branch alone shows the older story". At this head that is false: the branch sits on `dcd8008` (after `6a88239`, #418) and **both built homes carry the 80% sentence**. A future reader would repeat round 1's investigation from a wrong premise. | `git log --oneline dcd8008..HEAD` → `ca5b8e5`'s parent is `dcd8008`; `grep` of `dist/index.html` / `dist/es/index.html` finds "infrastructure bill fell by 80%" / "factura de infraestructura bajó un 80%". | N/A (the round-1 F1 claim is checked by those greps) | spec (`verification.md`, outside the contract set — safe to correct now) |
| Minor | THEORETICAL | tests / AC4 guard | The whole-token figure guard ignores a figure carrying a letter suffix: `figures('cut by 80K')` → `[]`, `figures('the 1990s')` → `[]`. Such a token in the block would pass **`… no banned term and no unsourced figure`** unchecked, because the `(?![\p{L}\d])` lookahead suppresses the match rather than flagging it. The `K3s`/`S3` exemption is intended; a suffix on a *figure* is a false negative. No such token exists in the current copy. | `node -e` against the shipped helper: `80%`→`["80"]`, `−80%`→`["80"]`, `120→20–30`→`["120","20–30"]`, `EMVA 1288`→`["1288"]`; `80K`→`[]`, `1990s`→`[]`. | UNTESTED (`figures.test.mjs` has no suffix case) | tests (`tests/figures.test.mjs`: a "80K is still a figure" case, then fix or declare the leniency) |
| Minor | REAL | spec drift | AC4 names "the list in `retired-labels.test.mjs`", but the same diff moved that list to `tests/lib/banned.mjs` (imported back). The criterion now points at a file that no longer holds the list. | diff of `tests/retired-labels.test.mjs`; `skills.test.mjs` imports `./lib/banned.mjs`. | N/A | spec (`proposal.md` — contract set: **do not reword under this verdict**; record it and change it only after the archive, or in a follow-up) |
| Minor | REAL | spec artifact | `tasks.md` closing box "PR opened referencing this spec folder" is unticked while PR #461 is merged. | `gh pr view 461` → `"state":"MERGED"`, `mergedAt 2026-10-18T04:09:04Z`. | N/A | spec (`tasks.md` — ticking a box is folded by `normaliseContract`, so ticking it does **not** stale this review; unlike rewording AC4) |
| Minor | THEORETICAL | accessibility | Two links read "ADR" and two "runbook"; a screen-reader link list hears the duplicates. Round 1 raised this and it was declined on WCAG 2.4.4 list-item context, which is defensible; naming the artifact ("ADR-069", "acme alerting runbook") would disambiguate without losing the property the decision protects. | built block markup, both locales. | UNTESTED (no a11y test covers the home; `tests/lab-axe.mjs` targets `/lab`) | code (optional) |
| Question | — | i18n / copy | ES carries "harness", "review entre modelos", "merges con puerta", "benchmark", "self-hosted", "edge". Round 1 declined them as accepted trade anglicisms, but `es-no-english.test.mjs` covers only `/lab` and `/ai`, so nothing enforces the decision on the home. Confirm it is the owner's call rather than the implementer's; if it is, the existing `verification.md` note is enough. | header scope of `tests/es-no-english.test.mjs`; `dist/es/index.html` block text. | UNTESTED | spec (`verification.md` decision note) |

No Blocker, no REAL Major: every acceptance criterion has a named test, each of those tests was shown red under a mutation that breaks its criterion, the external proofs answer 200, and the round-1 Blocker does not exist at this base.

### Evaluator rubric

| Dimension | Grade (A-D) | Rationale (one line) |
|-----------|-------------|-----------------------|
| Correctness        | B | All four ACs verified with named tests and six mutations; the figure guard is blind to a suffixed figure (M2), a negative-path gap not present in this copy. |
| Verification       | B | Every claim re-run here — build, 332/332, `test:browser`, 8×HTTP 200, digest reproduction — but `verification.md` keeps one now-false statement about the branch base (M1). |
| Scope              | A | Diff matches the proposal; the `banned.mjs`/`figures.mjs` extracts, the figure fix and the WEB-140 AC2 amendment are all declared side changes. |
| Reliability        | B | Static content, no runtime error paths; link rot is accepted by the proposal and deliberately unguarded in CI. |
| Maintainability    | B | Small components, one data source, shared guards with the why documented; AC-pointer drift (M3) and duplicate link text are the blemishes. |
| Handoff-readiness  | B | Triad complete, round-1 findings each dispositioned, WEB-140 amendment recorded, promotions answered; one stale task box (M4). |

Rubric aggregates to **PASS** (all B or above, no C, no D); no severity path escalates it.

### Verdict
PASS

### Recommended next steps

The contract set is **closed** by this verdict: do not reword `proposal.md` (AC4's pointer, M3) or `features.json` now — either moves the contract digest and invalidates this review. Ticking `tasks.md`'s PR box (M4) is the exception: `normaliseContract` folds checkbox state, so it stays fresh.

1. **Now, outside the contract set — `verification.md` (M1).** Correct the round-1 F1 note: the branch is based on `dcd8008`, includes #418, and the built homes carry the 80% sentence in both locales. Keep the round-1 record itself; fix the stale sentence a future reader would trust.
2. **Tick `tasks.md`'s "PR opened" box (M4)** — digest-neutral, and it makes the task list match reality (PR #461 merged).
3. **Follow-up (tests, M2).** Add a suffix case to `figures.test.mjs` and decide the behaviour: either treat `80K` as a figure (stricter, keeps AC4 honest) or document the leniency in the helper's comment. Not blocking; the current copy has no such token.
4. **Follow-up ticket, not a contract edit (M3).** Reword AC4's pointer to `tests/lib/banned.mjs` after the archive (or carry it into the next spec that touches this folder). Record the disposition in `verification.md` now.
5. **Optional (a11y, M5/M6).** If the repeated "ADR"/"runbook" link text or the ES register is revisited, it is a copy decision for Manu, not a defect; a home-level axe run would close the untested surface both sit in.
6. **Archive is advisable as structured.** All three `dotf spec archive` pre-flights are satisfiable: the author files carry no draft tags, this review is pooled (`nan/deepseek-v4-flash`), fresh (all three contract digests reproduced against `review-request.json`) and passing, and the three promotion candidates are each answered `no: <reason>`. Run `dotf spec archive WEB-158`; the archive folds `status:`, so it will not stale this review.
