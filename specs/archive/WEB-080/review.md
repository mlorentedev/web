---
spec: "WEB-080"
verdict: "PASS-WITH-GAPS"
reviewed_sha: "d914178e778c970e05375497ee432e04a6648826"
reviewer: "nan/deepseek-v4-flash"
date: "2026-09-03"
---

## Adversarial review

**Scope**: WEB-080 — rebuild `/lab` and `/es/lab` as the single public platform surface (PRs #250/#251, #257, #262, #263, #264, #266, #267, #271, #279, #282, #283).

**Sources**: `specs/WEB-080/{proposal,tasks,verification}.md`, `features.json`, `harness/reviewer-pool.json`, and `site/` at `d914178e`.

**Reviewer independence**: satisfied. This review was drawn from `harness/reviewer-pool.json` as `nan/deepseek-v4-flash` — a non-Anthropic, reasoning-class pool member. The pool now exists in this repo (committed in `d914178e`, #283) precisely because the previous review ran `claude-sonnet-5` against a `claude-opus-5` implementation (the same family, and what held the archive). That shortfall is resolved here; it is not a residual finding. I had no part in the implementation, hold read-only tools, and re-executed the verification from the merged tree.

### Coverage — what was run, not what was read

- `npm test` → **99/99** (up from the 94 the earlier review recorded; the `serve-containment` regression tests landed since). 0 fail.
- `npm run build` → `astro check` **0 errors / 0 warnings / 0 hints** over 59 files, **79 pages** built, clean.
- `npx astro check` → re-run standalone: **0 errors, 0 warnings, 0 hints** over 59 files.
- `npm run test:audit` (AC1) → **6/6**. Built page: **9 `<section>`s, 9 eyebrow markers `[ NN / ]`**, **0** `text-[Npx]`.
- `npm run test:browser` (AC2 containment) → **8/8** at 320/768/1440/2048 × both locales; document never scrolls sideways.
- `npm run test:a11y` (AC5 axe) → **0 violations across 8 runs** (2 widths × 2 locales × 2 console states), 43–44 rules passed.
- **AC2 negative cases, reproduced by mutation** (reverted): mutating a committed IR's label → the no-arg `verify` (the build gate) fails with "changed since its SVG was generated"; `lab-diagrams.test.mjs` fails (stamp recompute). The malformed fixture fails `verify` with "does not validate".
- **AC2 build-gate staleness** confirmed independently: a stale IR fails `npm run build` (the `prebuild` gate).
- **Axe non-vacuity, reproduced**: reverting the provenance link's `underline` in `dist/lab/index.html` alone makes axe fail (`link-in-text-block`, 1.1:1) on `/lab` only; restoring it passes. Exit 1 → 0.
- **Path traversal (prior finding 1) — FIXED, re-confirmed**: live reproduction against `serveDist()`: `/..%2f..%2f..%2f..%2f..%2f..%2fetc/passwd` → **403**; the absolute-style traversal → **404**; `/lab/index.html` → **200**. No file outside `dist/` is served. `serve-containment.test.mjs` (5 tests, now in the `npm test` glob, probing 12 depths + `%2f` + backslash + absolute) passes, and its "escape probes are real escapes" test guarantees the list is not vacuous.
- **AC1 colour guard non-vacuity**: `audit-helpers.test.mjs` proves `colourEscapes()` fires on `bg-[#7c3aed]`, `[color:…]`, `rgb(`, `hsl(`, etc., and passes through token utilities and non-colour arbitrary values. The PR6 hole (`bg-[#7c3aed]` sailing past a name-only matcher) is closed.
- **AC5 shape on the built page**: exactly **1** `<script>`, **0** `astro-island`, **0** external `src` scripts; `IdpPage.astro` absent.
- **XSS (prior fix) confirmed present and correct**: the inline console builds component rows via `document.createElement` + `.textContent`, never `innerHTML` for untrusted data (the only `innerHTML` is clearing to `""`).
- **No `[AGENT-DRAFT]` / `[AGENT-SUGGESTION]` tags** in `proposal.md`, `tasks.md`, `features.json` or `verification.md`.

**Two things this run could not independently reproduce**, and both are stated rather than hidden:

1. **AC4 fixture fidelity to kubelab.** The migration's faithfulness rests on `site/tests/fixtures/services.yaml.j2` being byte-identical to kubelab `infra/k8s/base/services/homepage-templates/services.yaml.j2` at `6cd9ab0ca5948297281b6d53798db97c562ea431`. That comparison needs the private `mlorentedev/kubelab` repo over the network, which this run does not have. The earlier review verified it byte-identical (sha256 match). What I did verify: the fixture is committed, internally consistent, and `lab-ai-migration.test.mjs` (9 tests) is non-vacuous against it — it parses the frozen Jinja line-wise, asserts 4 groups / 13 entries each with a pinned `href`, asserts the data names the source repo/path/commit, asserts the group names/order/entries match exactly, asserts `sourceHref` pins the fixture link verbatim, and asserts a `url` ships only for `access: public`.
2. **Live link reachability (the PR5 first-hop HEAD table).** Re-curling the 13 links from a genuinely public path needs a non-tailnet DNS view; I confirmed the *data* is internally consistent — 13 entries = 5 `public` (each shipping a `https://` url) + 6 `mesh` (no url) + 2 `private` (no url), and the one `url` that departs from its `sourceHref` (the renamed ADR-038) carries a `urlNote`. The reachability *outcome* is asserted by the tests and documented in `verification.md` § PR5.

### Spec and task alignment

- **AC1** (design system measured): verified. `lab-audit.test.mjs` 6/6 over `dist/`; 9 sections each with its eyebrow; zero off-token families; zero arbitrary sizes; the raw-colour guard is non-vacuous.
- **AC2** (diagrams from source): verified in effect. `lab-diagrams.test.mjs` asserts schema + accessibility payload + `ir-sha256` stamp; the build gate (`prebuild` → no-arg `verify`) fails a malformed **or stale** IR; `lab-containment.mjs` 8/8. One gap (see finding 1): the *explicit-file* `verify <file>` branch does not reach the stamp check. The AC2 guarantee itself holds.
- **AC3** (data-driven + `es` twins): verified. `lab-data.test.mjs` 10/10; `astro check` 0/0/0. Provenance (`generated_at`, `source_commit`) rendered by `LabProvenance`; every visible field has an `es` twin.
- **AC4** (faithful migration): verified against the committed fixture (see limitation 1). Entries, order, `sourceHref` set, and access boundaries match; the stale-ADR departure is documented, not silent.
- **AC5** (no regression): verified. 1 script, 0 islands, `IdpPage.astro` gone, `IdpStrip` from `platform.ts`, 0 axe violations; the axe and containment checks are non-vacuous.
- **AC6** (weight budget): verified. `lab-weight.test.mjs` 5/5 — 103,927 B (en) / 104,490 B (es) against **150,000 B**, 69%.

The two AC4/AC5 **amendments** in `proposal.md` are legitimate corrections, not quiet weakening. AC4 amended "same entries and links" → `sourceHref` (pinned, complete, machine-checked) + `access` + `urlNote`, because six of thirteen links genuinely cannot ship to a public page; this is a *stricter* replacement than it supersedes (the original was checked by nothing). AC5 drops the false "zero JS" claim and replaces it with the enforceable "exactly one script, no island"; the console is an ADR-056 §4.3 decision and an ADR outranks a spec scoping note. Both changes carry their measurement and rationale.

### Findings

| Severity | Reality | Area | Finding | Evidence | Test (named, or UNTESTED) | Fix location |
|----------|---------|------|---------|----------|---------------------------|--------------|
| Minor | REAL | diagrams pipeline | `verify(explicitFile)` in `scripts/diagrams.mjs` validates the schema and `topologyErrors()` but **never reaches the `ir-sha256` stamp check**, so the standalone subcommand cannot detect a stale IR. Confirmed: I mutated a committed IR's label, then `node scripts/diagrams.mjs verify src/diagrams/topology.architecture.json` exited **0** with "validates", while the no-arg `verify` (the build gate) and `lab-diagrams.test.mjs` both failed correctly. AC2's guarantee is **still met** — the build gate and `lab-diagrams.test.mjs` catch a stale IR, and `features.json` f2's chain opens with `lab-diagrams.test.mjs` — so this is a gap in the subcommand, not an AC violation. | reproduced | `lab-diagrams.test.mjs` → "every generated SVG is stamped with the sha256 of the IR it came from" (covers the gate); the subcommand's *own* stale path is **UNTESTED** (only the no-arg `prebuild` verify exercises it) | code + tests: add the stamp check to the explicit-file branch and add a named regression test (fixture with a deliberately altered stamp via the ordinary `verify <file>` path) |
| Minor | THEORETICAL | console (AC5) | If the API ever responds with no `checks` array (schema drift), `i.checks ?? []` yields `[]`, so `filter(...).length` = 0 and `y === r.length` → `0 === 0` is true; the console then paints **"0/0 healthy" in `ok-400` (green)** rather than signalling "no data". The fixture always returns 4 checks and the live API does too, so this is not observed; it is a silent-failure shape in an otherwise well-guarded console (timeout abort, try/catch, `textContent`). | code read of the inline console; no repro | UNTESTED (no test drives a zero-`checks` response) | code: guard on `checks` presence before summarising — surface only, does not gate |
| Question / assumption | SPECULATIVE | AC4 | The fixture's fidelity to kubelab@`6cd9ab0c` is **not independently reproducible from this repo** (private kubelab repo / network access). It rests on the earlier review's byte-identical sha256 verification plus the fixture's own asserted metadata and the non-vacuous migration test. | limitation of this run, not a defect | `lab-ai-migration.test.mjs` → "the fixture still holds the four groups this section migrates" and source-metadata assertions | — (note only; no code/tests/spec change indicated) |

## Evaluator rubric

| Dimension | Grade (A-D) | Rationale (one line) |
|-----------|-------------|----------------------|
| Correctness | B | All six ACs independently re-verified against the built artefact; negative paths (malformed/stale IR, axe non-vacuity, path traversal, colour guard, containment) covered; the one deduction is the `verify(explicitFile)` stamp gap, which does not break any AC's functional guarantee. |
| Verification | A | Every recorded command re-run verbatim with matching output; non-vacuity reproduced by mutation (stale IR → build fails; underline revert → axe fails; traversal → blocked). Caveat: AC4's fixture↔kubelab fidelity is not independently reproducible here. |
| Scope | B | Implementation spans PR0–PR7 plus a docs/CI follow-up; each commit is atomic. Assessed per-commit against the spec's structure (no single monolithic diff — the work is on merged `master`). No material creep observed; PR7's diff matches its stated scope (plus one necessary i18n addition). |
| Reliability | B | Error paths handled (serve 403/404, console try/catch, diagrams fail-fast, self-enforcing guards); deductions are the `verify(explicitFile)` gap and the console's silent "0/0 healthy" on an unexpected response shape. |
| Maintainability | A | Short single-purpose functions; comments explain WHY and document each failure mode; guards enforce assumptions (colour escapes, id namespacing, viewer-affordance strip, `minify`) rather than relying on them; pure helpers extracted into `tests/lib/` and tested. |
| Handoff-readiness | A | `proposal.md` amended with AC4/AC5 evidence; `verification.md` exhaustive per PR; lessons captured in `docs/lessons/` (git log: #265, #273, #279, #282); promotion candidates flagged; archive checklist reflects the still-open process items. |

### Verdict

**PASS WITH GAPS.** No Blocker, no Major, no rubric grade below B. All six acceptance criteria are verified against the built artefact. The one unfixed finding — the `verify(explicitFile)` staleness gap — is a `REAL` Minor that does not break any AC's functional guarantee (the build gate and `lab-diagrams.test.mjs` both catch a stale IR) and is ticketed. The THEORETICAL console edge and the AC4 verification limitation are surfaced without gating.

### Recommended next steps (before archive)

1. **Fix (or formally accept) the `verify(explicitFile)` stamp gap** — have the explicit-file branch also recompute and check the `ir-sha256`, and add a named regression test covering it (a fixture with an altered stamp run through the ordinary `verify <file>` path). This is the one substantive item still open from the earlier review.
2. **Track the console "0/0 healthy" edge** as a follow-up (surface only); consider a one-line guard on `checks` presence.
3. **Archive is advisable.** No blocker or major, rubric all B+, and — decisive here — this review is on a non-Anthropic pool member (`nan/deepseek-v4-flash`), so the independence shortfall that held the prior review is gone, and this repository now has the reviewer-pool mechanism to enforce it. `proposal.md`/`tasks.md`/`features.json` have not changed since the reviewed SHA (`d914178e`), so the fresh/`reviewed_sha` gate holds.
