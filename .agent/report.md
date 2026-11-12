# Run report: web-rework-20261112

- Armed 2026-11-12T07:04Z, window until 19:04Z. Ended at 12:20Z with `reason: queue-empty`.
- Authority: merge never (there is no merge grant on master). Nothing was merged.

## Items

| Item | Outcome |
|---|---|
| #594 WEB-197, dark mode (system setting only) | PR #658, draft, CI green, triaged at `5faad2b`. The draft palette reads each ramp backwards, with step 500 taking 400; axe is clean on 72 pages in both schemes. Type families are still open on the ticket. |
| #592 WEB-195, changelog and `kubelab.yaml` | Parked and set to Blocked. `kubelab.yaml` was already done: the Dockerfile copies it and LabContract shows it, so the owner's "option B" question did not apply. A generated changelog needs two decisions, posted on the ticket: the language of a row, and which PRs count. |

## Findings during the run

- My first attempt at the prose colours, as unlayered `.prose` rules, changed light mode: it beat `text-white` and the `prose-*` modifiers. The axe run in both schemes caught it. Recorded as lesson 085.
- The independent review found brand marks that vanish on dark (axe cannot see SVG non-text contrast), lost prose hover, gaps in the test, a mismatched `theme-color`, and the print case. All are fixed in `5faad2b`.
- Follow-ups, listed in the PR and not ticketed until the owner picks a palette:
  - write the `tailwind.config.mjs` prose hex as `var()`;
  - regenerate the diagrams with role variables.

## Coordination

- Peer run web-ci-deps-20261112 took #270, #620, #288 and #427 (#656 and #657 are open).
- #657 (the gateway-path diagram) needs a /lab include after it merges.
- The two runs collided once on the path of this worktree. The peer restored the envelope; it was verified against the commit.

## Owner decisions waiting

- #658: the dark ground (pure black or `panel-950`), the accent at 300, and dark bands turning light.
- #594: the type families.
- #592: the language of a changelog row and the PR filter.
- Copy review tomorrow: #593 /ai copy, #588 Hive card lines, #589 contact sentence.
