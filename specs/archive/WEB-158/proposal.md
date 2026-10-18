---
id: "WEB-158"
type: spec
status: archived # draft | implementing | verifying | archived
created: "2026-10-17"
issue: "mlorentedev/web#459"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-158

> **Naming**: file lives at `<repo>/specs/WEB-158/proposal.md`. `WEB-158` is `AREA-NNN-slug` (e.g. `TOOL-001-secret-drift`).

## Why

<!-- from issue #459: WEB-158: a focused list of what Manu does, each item with its proof, on the home -->

Someone hiring an SRE, a DevOps or platform engineer, or an all-round engineer from hardware to cloud and AI tooling
reads the home in a few seconds. The story (WEB-140) is prose: it explains the path, but a reader scanning for "does
he do Kubernetes, IaC, observability, embedded, AI harness" has to dig for it. A contractor paints the jobs on the
truck door, one per line; the home has no such list, and each line here can also link its proof.

## What

A new home block, `data-home-block="skills"`, between the story and "how the work starts", in both locales:

1. A heading and eleven items, one per line, each a short noun phrase ("Infrastructure as code (Terraform, Ansible)").
2. Every item links where it can be checked: a page on the site (`/lab/`, `/ai/`, `#story`) or a public artifact (an
   ADR, a runbook, a benchmark, a PyPI page, a thesis repo).
3. One source, `src/data/skills.ts`, holds both locales and the links, so `/` and `/es/` cannot list different items.

The eleven items were confirmed by Manu on 2026-10-17 (issue #459), drawn from the `resume` project's `cv.yml`:
Kubernetes & GitOps; IaC; CI/CD that ships the tested build; observability and alerts proven by failure; backups with
restore drills and SOPS secrets; AWS with the bill cut by 80%; the AI agent harness; MCP servers on PyPI; self-hosted
LLM inference on edge hardware; embedded firmware (C, FPGA/VHDL, FreeRTOS); camera and sensor integration, SDKs,
EMVA 1288 and test automation.

## Out of scope

- The CV's unsettled or banned figures: the Hive token saving (#238), reader counts, service counts, certifications.
- Services, prices or availability: the door block owns those.
- Any change to the story, the hero or the notes.

## Risks / open questions

- **Amends WEB-140 AC2.** The home goes from four blocks to five (hero, story, skills, door, notes). The structure
  test in `home.test.mjs` changes with it, and the skills block joins the "text only: no image, svg or card" rule.
- **AC1 of WEB-140 (first screen)** is unaffected: the block sits below the story.
- **External links rot.** Each link was checked to return 200 on 2026-10-17. The test cannot fetch (CI is offline
  for tests), so it holds links to an allowlist of public owners instead; a moved file is caught by a reader, not CI.
- **"1288" is a standard's name, not a figure.** The figure rule (every number in `data/experience.ts`) exempts it by
  name.
- **Employer constraint** (no imaging customers while employed) concerns who Manu sells to; a profile list of what
  he knows is not an offer. Decided with Manu 2026-10-17.

## Acceptance criteria

- [ ] **AC1 · Structure.** Both built homes render the blocks in order story, skills, door, notes; the skills block
  holds eleven list items and no image, SVG or card.
- [ ] **AC2 · One source.** `/` and `/es/` render the same number of items with the same link targets (locale prefix
  aside), from `src/data/skills.ts`.
- [ ] **AC3 · Every item carries proof.** Each item has exactly one link; site links resolve to a built page or an
  anchor on the home; external links point only at public owners (github.com/mlorentedev public repos, pypi.org),
  never at a private repository (`knowledge`, `resume`, `imagesensortool`).
- [ ] **AC4 · Honest copy.** No banned word family (brand-package §7, the list in `retired-labels.test.mjs`) in the
  block, in either locale; every figure in it is already in `data/experience.ts` (standard names exempt by name).

## References

- Issue: mlorentedev/web#459; parent spec `specs/WEB-140/` (AC2 amended here).
- Copy rules: vault `10_projects/web/brand-package.md` §7; `tests/retired-labels.test.mjs`.
- Source of the items: the `resume` project's `data/cv.yml` (read only).
