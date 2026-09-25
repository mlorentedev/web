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
   (mlorentedev/kubelab#1727), read at build time. Those producers land as PRs in kubelab (ADR-053).
3. **The `/lab/idp` catalog and the architecture page**: every card and every flow opens something a visitor can
   verify, or says why it cannot. The perimeter scanners test the domain that serves the site, not a redirect.
   Cards for internal surfaces (Argo CD, Grafana and the like) open sanitized captures or recordings of the real
   surface: the proof idea from #223, with no new service to operate.
4. **Live, read-only operator surfaces** (gated): selected dashboards reachable from the internet, read-only,
   sanitized, behind a proxy with rate limits. This changes ADR-056 §3's access boundary, so it needs an accepted
   ADR in kubelab before any code.
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

Failure modes, dependencies, and unknowns to clarify before implementation. If any item here is unresolved, do not move to `tasks.md` yet.

-
-

## Acceptance criteria

Observable outcomes. Each must be testable.

- [ ] Outcome 1
- [ ] Outcome 2
- [ ] Outcome 3

## References

- Bitácora board: the GitHub issue / Project item tracking this spec (see the `issue:` frontmatter field)
- Related ADR: `<repo>/docs/adr/adr-XXX.md` (if any)
- Related patterns: `00_meta/patterns/<pattern>.md` (if any)
