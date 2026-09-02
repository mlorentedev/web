---
id: web-lessons-index
type: index
status: active
created: "2026-06-23"
owner: manu
tags: [web, lessons, index]
---

# Lessons

28 lessons, one file each, newest first. Numbers are assigned in the order
lessons were filed and never change, so a citation stays valid.

| # | Lesson | Date | Tags |
|---|---|---|---|
| 028 | [An accessibility rule can pass by accident, so fixing a neighbouring one makes it fail](lesson-028-an-accessibility-rule-can-pass-by-accid.md) | 2026-09-01 | `#accessibility` `#testing` `#verification` |
| 027 | [A record that something was done is not evidence that it was done](lesson-027-a-record-that-something-was-done-is-not.md) | 2026-09-01 | `#verification` `#sdd` |
| 026 | [An acceptance criterion has an audience](lesson-026-an-acceptance-criterion-has-an-audience.md) | 2026-09-01 | `#sdd` `#spec` |
| 025 | [`curl -IL` reports 200 for every host behind a login](lesson-025-curl-il-reports-200-for-every-gated-host.md) | 2026-09-01 | `#verification` `#networking` |
| 024 | [A generated artefact carries its generator's interaction model](lesson-024-a-generated-artefact-carries-its-generat.md) | 2026-09-01 | `#svg` `#accessibility` `#astro` |
| 023 | [Measure the page before writing the spec's "failing" test](lesson-023-the-specs-failing-test-was-already-green.md) | 2026-08-31 | `#sdd` `#testing` `#verification` |
| 022 | [A number that is only printed is never questioned — and an assertion that cannot fail is worse](lesson-022-a-number-that-is-only-printed-is-never.md) | 2026-08-31 | `#verification` `#testing` |
| 021 | [An SVG generator that namespaces no ids is fine until you embed two of its outputs](lesson-021-an-svg-generator-that-namespaces-no-ids.md) | 2026-08-31 | `#svg` `#accessibility` `#astro` |
| 020 | [`node --test <dir>` resolves the directory as a module on Node 26](lesson-020-node-test-dir-resolves-the-directory-as.md) | 2026-08-27 | `#testing` `#node` |
| 019 | [A guard that cries wolf is worse than the hazard it guards, and an untested guard will](lesson-019-a-guard-that-cries-wolf-is-worse-than-th.md) | 2026-08-27 | `#verification` `#testing` `#review` |
| 018 | [A JSON Schema cannot say that an identifier resolves, only that it looks like one](lesson-018-a-json-schema-cannot-say-that-an-identifi.md) | 2026-08-27 | `#validation` `#json-schema` `#verification` |
| 017 | [A comment can be true of the design and false of the deployment](lesson-017-a-comment-can-be-true-of-the-design-and-fa.md) | 2026-08-26 | `#documentation` `#verification` |
| 016 | [A test that only ever runs against the fix proves nothing](lesson-016-a-test-that-only-ever-runs-against-the-fix.md) | 2026-08-26 | `#verification` `#testing` |
| 015 | [A step that was skipped and a step with nothing to do look identical](lesson-015-a-step-that-was-skipped-and-a-step-with-no.md) | 2026-08-26 | `#ci` `#delivery` `#observability` |
| 014 | [A subagent's finding is a claim to verify, not a result to act on](lesson-014-a-subagent-finding-is-a-claim-to-verify-no.md) | 2026-08-25 | `#verification` `#agents` |
| 013 | [Removing a theme override reveals the plugin default, it does not remove the property](lesson-013-removing-a-theme-override-reveals-the-plug.md) | 2026-08-24 | `#tailwind` `#css` |
| 012 | [HTML entities inside a `t()` value render literally](lesson-012-html-entities-inside-a-t-value-render-liter.md) | 2026-08-24 | `#i18n` `#astro` |
| 011 | [A job with no timeout turns one stalled build into a release that silently never publishes](lesson-011-a-job-with-no-timeout-turns-a-stalled-build.md) | 2026-08-24 | `#ci-automation` `#docker` |
| 010 | [An untranslated default prop leaks the default locale into every page that omits it](lesson-010-an-untranslated-default-prop-leaks-the-defau.md) | 2026-08-21 | `#i18n` `#astro` |
| 009 | [Obsidian wikilinks render as literal text on GitHub](lesson-009-obsidian-wikilinks-render-as-literal-text-on.md) | 2026-08-21 | `#docs` `#github` |
| 008 | [A bare content date formatted without `timeZone` renders a day early](lesson-008-a-bare-content-date-formatted-without-timezo.md) | 2026-08-21 | `#i18n` `#dates` |
| 007 | [Dependabot security updates bypass `ignore` — a major-version ignore will not stop them](lesson-007-dependabot-security-updates-bypass-ignore-a.md) | 2026-08-08 | `#ci-automation` `#dependencies` |
| 006 | [Astro inlines small module scripts — grep the HTML, not for an `_astro/*.js` chunk](lesson-006-astro-inlines-small-module-scripts-grep-the.md) | 2026-07-10 | `#astro` `#verification` |
| 005 | [A build-time external fetch needs a committed fallback, or a flaky API breaks deploys](lesson-005-a-build-time-external-fetch-needs-a-committe.md) | 2026-07-10 | `#astro` `#build` |
| 004 | [Bilingual data is a type-contract change — grep ALL consumers, not the obvious ones](lesson-004-bilingual-data-is-a-type-contract-change-gre.md) | 2026-07-09 | `#i18n` `#typescript` |
| 003 | [`grep -c` counts matching LINES, not matches — useless on minified HTML](lesson-003-grep-c-counts-matching-lines-not-matches-use.md) | 2026-07-09 | `#verification` `#shell` |
| 002 | [Feature-flag grep: verify the precise signal, not a broad token](lesson-002-feature-flag-grep-verify-the-precise-signal.md) | 2026-06-28 | `#verification` `#feature-flags` |
| 001 | [release-please on a history-carrying repo replays the whole inherited log](lesson-001-release-please-on-a-history-carrying-repo-re.md) | 2026-06-25 | `#ci-automation` `#release-please` |

New lessons: see [`_format.md`](_format.md) — one file per lesson, appended at the
next free number, front-matter required.
