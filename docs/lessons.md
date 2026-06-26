---
id: "web-lessons"
type: lesson
status: active
tags: [web, mlorente-dev]
created: "2026-06-23"
owner: manu
---

# web — Lessons Learned

> Patterns learned, errors avoided, and gotchas for the mlorente.dev / kubelab.live
> frontend. Project-bound lessons stay here; cross-project ones go to the vault `00_meta/`.
>
> **Protocol**: Update after every important correction or discovery.

## Format

    ### [DATE] Lesson Title

    **Context**: What I was doing

    **Problem**: What went wrong or what I discovered

    **Solution**: How I resolved it

    **Rule**: Pattern to follow going forward

## Lessons

### [2026-06-25] release-please on a history-carrying repo replays the whole inherited log

**Context**: First semver release of `web` after extracting it from the kubelab
monorepo *with full git history* (ADR-053), with release-please newly wired up.

**Problem**: The first release-please run swept the *entire inherited* history into a
single "first" release — a CHANGELOG replaying kubelab-era commits (#93/#94, ADR-020,
#613…) and version `0.2.0`. That was a **downgrade**: the manifest had been seeded at
`0.1.0` while `version.txt` already carried the component's real `1.1.2`, and `0.2.0`
sorts below images that already existed in the registry (`1.0.0`…`1.1.1`). It merged
before being caught, cutting a `v0.2.0` tag + GitHub Release + Docker image.

**Solution**: Reverted (restored manifest + `version.txt` to `1.1.2`, dropped the bogus
CHANGELOG section), deleted the `v0.2.0` tag/Release/Docker tag. Anchored the changelog
with `bootstrap-sha` at the bad-release commit so the first real release only considered
post-extraction commits, and seeded the manifest to the real `1.1.2`. The next (forced)
release cut a clean `v1.2.0`.

**Rule**: When wiring release-please into a repo that carries inherited history (monorepo
extraction, fork), BEFORE the first run: seed `.release-please-manifest.json` to the
component's real current version AND set `bootstrap-sha` to the extraction boundary.
Otherwise the first release replays all history and can silently downgrade. Remove
`bootstrap-sha` once the first release PR merges.
