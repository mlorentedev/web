---
id: "WEB-141"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-09-24"
issue: "mlorentedev/web#402"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-141

> **Naming**: file lives at `<repo>/specs/WEB-141/proposal.md`. `WEB-141` is `AREA-NNN-slug` (e.g. `TOOL-001-secret-drift`).

## Why

<!-- from issue #402: WEB-141: the Lab and AI pages become proof pages — whose problem, what constraint, the measured result, where to verify -->

Every positioning study since June reaches the same conclusion: for a senior technical reader, authority is
verifiable work, not claims. The home is being rebuilt as a cover letter (#398) that sends that reader to `/lab`
and `/ai` as its proof. Today `/ai` makes claims in the register #390 retired, with no problem stated and no
number. `/lab`'s proof is partly false: labels that lie, counts that disagree, catalog cards that open nothing. A
hiring manager who follows the proof link and finds one false label stops trusting the whole letter, and the site
fails at the one click that matters.

## What

1. **`/lab` and `/ai` open with a proof in the four-question format**: whose problem it was, what constrained
   it, the measured result, and where to verify it. Both locales. The proofs come from one source,
   `src/data/proofs.ts`, which the home (WEB-140, #398) also reads. `/lab` proves KubeLab, live. `/ai` proves
   Hive and the agents, and Hive's figure appears only with its method, as #238 asks: 46–95% by session type,
   never the ~94% headline. Until #238 settles, `/ai` shows the claim with no figure.
2. **Every claim on `/lab` is measured and names its source.** Access labels match a measurement (#292), counts
   come from `platform.json` (#133, #355), and figures carry their method (#340). What cannot be measured is
   removed, not left half-true. `platform.json` stops being hand-kept. It is produced by the kubelab exporter
   (mlorentedev/kubelab#1347, #162), and the figures come from OBS-027's public series
   (mlorentedev/kubelab#1727), read at build time. Those producers land as PRs in kubelab (kubelab ADR-053).
3. **The `/lab/idp` catalog and the architecture page**: every card and every flow opens something a visitor can
   verify, or says why it cannot. The perimeter scanners test the domain that serves the site, not a redirect.
   Cards for internal surfaces (Argo CD, Grafana and the like) open sanitized captures or recordings of the real
   surface: the proof idea from #223, with no new service to operate.
4. **Live, read-only operator surfaces** (gated): selected dashboards reachable from the internet, read-only,
   sanitized, behind a proxy with rate limits. This changes the public manifest boundary in ADR-056 §3, so it needs
   an accepted ADR amending it before any code, plus its kubelab half (proxy and ingress).
5. **An "ask about the work" chat on `/ai`** (gated): it answers questions about the work from public content
   only. It is never a way to hire, and its call to action points at the door (#390). The backend
   (`/v1/knowledge/chat`) lives in kubelab. It needs rate limiting and a spend cap. #45 is reopened with this
   decision before anything is built.

**Delivery order** (so the site stops making false claims first): phase 1 removes or corrects what is false;
phase 2 adds the kubelab producers and the measured figures; phase 3 adds the captures; phase 4 adds the live
surfaces once their ADR is accepted; phase 5 adds the chat once #45 is reopened.

## Out of scope

- **The home and contact.** Their sections, the hero, the door and the offer belong to WEB-140 (#398) and #390.
  The home H1 (#247) is not touched. This spec only supplies the `kubelab` and `agents` entries of
  `src/data/proofs.ts`, which the home renders.
- **The `/lab` eyebrow.** `lab.hero.eyebrow` is changed under #390, in #404. This spec owns the rest of the `lab.*`,
  `ai.*` and `idp.*` copy.

## Risks / open questions

Items marked **gate** must be resolved before their phase starts. None blocks phase 1.

1. **Gate for phase 4 (live surfaces):** an accepted ADR amending ADR-056 §3 (the public manifest boundary),
   with its kubelab half for the proxy and ingress. It must name which dashboards, what sanitization, which proxy
   and which limits.
2. **Gate for phase 5 (chat):** the content filter (public content only, never private notes), the model spend
   cap and its rate limit, and what happens at the cap (the chat switches off and says so).
3. **Gate for phase 3 (captures):** a written definition of "sanitized", the same rule as ADR-056 §3: no
   addressing, no internal hostnames, no `url` on non-public services. A test enforces it.
4. **Dependencies in kubelab:** the exporter (mlorentedev/kubelab#1347) and OBS-027
   (mlorentedev/kubelab#1727). If they slip, the affected figure is removed; it is never hand-written again.
5. **#238:** until the Hive note is published with its method, `/ai` carries no figure.
6. **Coordination with WEB-140:** the shape of `src/data/proofs.ts` is agreed (`{id, claim, result, href}` per
   locale). If the home links to anchors on `/lab`, those anchors stay stable.
7. **Size:** five phases across two repositories. Each PR stays under ~300 lines and closes something on its own,
   so stopping half-way never leaves the site worse than before.

## Acceptance criteria

- [ ] **AC1 — proofs in the format.** `/lab` and `/ai` each open with a proof read from `src/data/proofs.ts`, in
      both locales. A test fails if a proof lacks any of the four fields, or if its `href` does not resolve to an
      existing route in both locales. The one exception is the `agents` result, which stays empty while #238 is
      open.
- [ ] **AC2 — nothing hand-written on `/lab`.** Counts come from the `platform.json` the kubelab exporter
      produces, and CI fails when the committed file and the exporter output disagree. Every figure links to its
      method, and every access label matches the measured access table (#292).
- [ ] **AC3 — a verifiable catalog.** Every `/lab/idp` card opens a public URL or a sanitized capture. No card
      targets `kubelab.live` or any other redirect, and every capture passes the sanitization test (no IPs, no
      internal hostnames).
- [ ] **AC4 — no retired or banned terms.** No retired label and no term the brand package bans appears on
      `/lab`, `/ai` or `/lab/idp`, in either locale. This extends the retired-labels test (#404). The Spanish
      pages carry no English strings (the Lab and AI part of #354).
- [ ] **AC5 — live surfaces (phase 4, gated).** Nothing ships before the ADR is accepted. Every exposed surface is
      read-only (a write attempt is refused) and rate-limited, checked by a smoke test.
- [ ] **AC6 — chat (phase 5, gated).** It answers from public content only, it switches off with a message at
      the spend cap, and its call to action points at the door. There is a test for each.
- [ ] **AC7 — nothing that works today breaks.** The `/lab` single-JSON-LD invariant, the sitemap-to-HTML
      alternates test (`seo-canonical-hreflang.test.mjs`) and the WEB-080 suite (`lab-*.test.mjs`,
      `lab-containment.mjs`) stay green.
- [ ] **AC8 — captures are light and accessible.** Every capture has alt text and loads lazily, each page stays
      within the weight budget `lab-weight.test.mjs` enforces, and axe (`lab-axe.mjs`) passes on every changed
      page.
- [ ] **AC9 — every measurement is dated.** Each figure says when it was measured, and each capture says when it
      was taken, so an old proof reads as old instead of passing for current.

## References

- Bitácora board: #402 (see the `issue:` frontmatter field). Sequenced with WEB-140 (#398).
- Defects in scope: #292, #272, #340, #133, #355, #162, #31, the Lab and AI part of #354, and the chat in #45.
- Related ADRs: ADR-056 (live platform cockpit; §3 is the public manifest boundary), ADR-059 (`kubelab.live` is a
  308), and kubelab ADR-053 (the two-repo flow).
- Upstream in kubelab: mlorentedev/kubelab#1347 (exporter), mlorentedev/kubelab#1727 (OBS-027).
