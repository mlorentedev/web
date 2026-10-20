---
spec: "WEB-140"
verdict: "PASS-WITH-GAPS"
reviewed_sha: "c841b057906caa0279ddcd809ad5cbbdd35f7353"
reviewer: "nan/glm5.3-flash"
date: "2026-10-19"
---

## Adversarial review

**Scope**: WEB-140 — the home becomes the cover letter (hero, story, one-source door, notes; five sections leave the home).
**Sources**: `specs/WEB-140/{proposal,tasks,verification}.md`, `specs/WEB-140/features.json`; diff `git diff 0d28679963c6b428d82a87246abd0ad87b13e7df...HEAD` (launcher-resolved base, whole change); repo `mlorentedev/web`.

### Spec and task alignment

- The four-PR plan collapsed onto master as PRs #410 (HomePage stubs), #416 (trim + five sections deleted), #418 (story), #419 (door + first-screen test), #461 (skills block, the WEB-158 amendment), #467 (whole-token figures). The diff for WEB-140's own files matches the proposal, including the 2026-09-25 amendment (prose home, no `proofs.ts`) and the 2026-10-17 WEB-158 amendment (skills block between story and door).
- All six ACs have named tests: AC1 `tests/home-first-screen.mjs` (4 viewports × locales), AC2 `home.test.mjs` ("the built X home has exactly one <h1>", "renders none of the retired sections", "blocks come in order", "no image, svg or card"), AC3 `home.test.mjs` "one source" (offer text and door mailto equal /contact's, element-by-element), AC4 `bio.test.mjs` (locale links, built-route resolution, figures held to `experience.ts`, no figure in the agents sentence, 300–450 words), AC5 `home.test.mjs` "honesty" + "states no node or service count and no uptime", AC6 the full suite.
- Dead-code claims verified against the tree, not the prose: `IdpStrip`, `ProjectsSection`, `ProofSurface`, `CommunitySection`, `Timeline`, `LabProbe`, `LabSlos`, `CredibilityBand`, `data/github.ts` and `localizeExperience` are gone; `data/experience.ts` was repurposed to the figures source its header now documents; `hero.explorePlatform`/`hero.whatIBuild` have no consumers left and only `hero.story` was added. The marker-based retired-section test catches a section returning under any heading.
- Fresh evidence, produced in this review session at `c841b05`: `npm run build` → astro check 0 errors, 87 pages; `npm test` → **355/355 pass, 0 fail, 0 skipped**; `node tests/home-first-screen.mjs` → **4/4** (`/` and `/es/` at 1280×720 and 400×740, label, H1 and door above the fold).

### Adversarial pass (what could still fail)

- **Figure gate bites (mutation-verified).** I edited `en-bio.mdx` 120 → 130 and re-ran the figure test: it fails with `figures with no source in experience.ts: 130`, then passes after revert. The whole-token extraction (`tests/lib/figures.mjs`) also blocks the suffix-hiding and digit-inside-a-number bypasses that WEB-158's review found; red-green confirmed, not asserted.
- **One-source cannot drift.** `HomeDoor.astro` renders the *same* contact MDX entry as `/contact` (`getCollection('pages', page === 'contact')`) with `h1 → h2` mapping, so the offer ladder (`data/offer.ts` via `Offer.astro`) and the door (`Door.astro`) are one source by construction; the tests compare rendered offer text and mailto between the built pages, so a pasted copy would be caught.
- **HomeDoor/HomeStory throw on missing content** rather than rendering an empty block; every count test is preceded by a rendered-non-empty guard (lesson-019), so a build that silently drops the bio cannot pass.
- **Honesty ban is string-based, not semantic.** The regex list (EN+ES availability phrasings, node/service counts, `99.9%`) is broad, and the `data-busy` carve-out is scoped to a single `<p>`. A wording outside the list would pass — inherent to a text ban; accepted, the banned-copy surface is small and `retired-labels.test.mjs` holds the rest.
- **ES story links `/projects/` (EN-only page)** — explicitly recorded in the proposal as known/accepted; no test asserts it. Surfaced below, not re-litigated.
- **Word count is computed on the markdown source** (syntax stripped, link text kept), not the rendered HTML; close enough to the rendered prose that the 300–450 band is meaningful, and any figure the source carries is independently gated.

### Findings

| Severity | Reality | Area | Finding | Evidence | Test (named, or UNTESTED) | Fix location (code / tests / spec / vault) |
|----------|---------|------|---------|----------|---------------------------|---------------------------------------------|
| Minor | REAL | spec artifacts | `tasks.md` closing rows unticked although their substance is satisfied or N/A: "Lint passes" (there is no lint script in `site/package.json`; lint is the pre-commit hooks, run in CI), "PR opened referencing this spec folder" (work landed via #410/#416/#418/#419/#461/#467), "One branch per PR" (superseded by landing on master), "No unrelated changes in the diff" (true only of WEB-140's own subset; the launcher's cumulative base also carries WEB-141/WEB-158/CI work that has its own specs and reviews) | `tasks.md` Closing section vs `package.json` scripts and `git log 0d28679..HEAD` | UNTESTED | verification.md disposition (contract set is closed under this verdict — do not edit `tasks.md`) |
| Minor | REAL | spec artifacts | `verification.md` "Promotion candidates" still holds unfilled template placeholders (`<yes / no …>`) and the archive checklist is unticked; the promotion decision (repo lesson / ADR / pattern) is being deferred to archive time | `verification.md` bottom sections | UNTESTED | verification.md (outside the contract set — fill before running `dotf spec archive`) |
| Question / assumption | documented | i18n | The ES story links `/projects/` with Spanish link text "proyectos", landing Spanish readers on the EN-only page. Accepted in the proposal ("Known, accepted"); no test pins it, so nothing would fail if the acceptance silently changed | `es-bio.mdx`; proposal §Known-accepted | UNTESTED | none needed now; candidate for a follow-up ticket if `/projects` is ever localized |
| Minor | SPECULATIVE | tests | The AC1 test asserts position at two fixed viewports, not between them; an intermediate width could still push the door below the fold without a red test | `tests/home-first-screen.mjs` VIEWPORTS | `node tests/home-first-screen.mjs` (covers only the two widths) | surface only; do not gate — sampling viewports is the standard trade for layout tests |

### Evaluator rubric

| Dimension | Grade (A-D) | Rationale (one line) |
|-----------|-------------|----------------------|
| Correctness        | A | All six ACs verified fresh in this session (355/355, first-screen 4/4) and the figure gate proven by mutation to fail on an unsourced figure. |
| Verification       | A | `verification.md` carries reproducible commands; every one re-run here returned the claimed result. |
| Scope              | B | WEB-140's own subset matches the proposal incl. both amendments; the cumulative launcher base necessarily also carries sibling specs' work (each with its own spec/review). |
| Reliability        | B | Static output; missing content throws at build time; all structure tests carry rendered-non-empty guards, so a silently empty block cannot pass. |
| Maintainability    | A | Small typed components, shared test libs (`figures.mjs`, `banned.mjs`), orphaned code and i18n keys actually deleted, `experience.ts` repurposed with an updated contract header. |
| Handoff-readiness  | B | Verification evidence and implementation decisions are recorded, but promotion candidates are unanswered and `tasks.md` closing rows are stale. |

### Verdict

PASS WITH GAPS — no Blockers, no Majors, rubric has no C or D; the four findings above are minors/question, all tracked, none in code.

### Recommended next steps

For the implementer to disposition in `verification.md` (the contract set — `proposal.md`, `tasks.md`, `features.json` — is closed by this verdict; editing any of the three invalidates this review):

- **verification.md**: fill the three "Promotion candidates" answers (one line each, even if all "no") and tick the archive checklist entries as they are executed — this is the only real gap between the current state and a clean archive.
- **verification.md**: record a disposition for the stale `tasks.md` closing rows (applied/declined with reason), so the unticked boxes are decisions, not omissions.
- **Follow-up ticket (optional)**: pin the ES→`/projects/` EN-only link with a test or a localization ticket, so the accepted risk stays a decision.

**(a) Verdict: PASS WITH GAPS. (b) `dotf spec archive WEB-140` is advisable once `verification.md` carries the promotion-candidate answers and the dispositions above — the gate itself will accept or refuse; nothing in the code or the tests blocks it. (c) N/A — no FAIL.**
