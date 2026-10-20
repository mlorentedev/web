---
id: lesson-065-a-version-written-into-a-reviewer-s-rules-pa
type: lesson
status: active
created: "2026-10-19"
owner: manu
tags: [web, review, agents, docs]
---

# A version written into a reviewer's rules passes the old stack after an upgrade

**Context**: WEB-161 corrected `AGENTS.md`, which still described the site as Astro 5 and
Tailwind CSS 3 after the Astro 7 and Tailwind 4 migration. The same PR added
`scripts/check-agents-stack.sh`, which fails when the majors in `AGENTS.md` disagree with
`site/package.json`.

**Problem**: PR-Agent reviewed that PR twice. Both times its harness-compliance pass printed
`Astro 5 static architecture: PASS`, including on the head where `AGENTS.md` already said
Astro 7. The line came from its own rules in `.pr_agent.toml`, which named the major as part
of the rule. That was a second copy of the stack, in another agent's instructions, and the
new guard did not read it. The reviewer kept certifying a stack the site no longer ran, and
the PASS looked like confirmation.

**Solution**: The rule in `.pr_agent.toml` now names the invariant it enforces (Astro's
`output: 'static'`, no runtime backend on the critical path) and no version. The stack's
majors now live in one place, `AGENTS.md`, and the guard keeps that one place equal to
`site/package.json`. Search used to find the copy:
`git grep -nE "Astro 5|Tailwind( CSS)? ?3" -- . ':!docs/lessons' ':!docs/adr'`.

**Rule**: A rule given to a reviewer or an agent states the invariant, not the version it
was written against. A version number in a rule is a copy of the dependency file that
nothing updates. When a fact must live in prose, keep it in one file and guard that file
against its source. After correcting a stack description, grep every agent-instruction
file (`AGENTS.md`, `.pr_agent.toml`, `.github/`, `harness/`) for the old value.
