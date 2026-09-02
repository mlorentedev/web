---
id: lesson-031-two-numbering-sequences-in-one-namespac
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, documentation, adr, knowledge-base]
---

# Two numbering sequences in one namespace, and nothing tells you which one you are in

**Context**: `#236` asks where the engineering-harness material should live, and
the recommended shape is essays that **link the artefacts** — ADRs, lessons,
archived specs — because the artefacts are the argument. Counting what there is
to link came first.

**Problem**: the count could not be turned into links, because an ADR number
does not identify a document.

```
ADRs numbered by repo:  web=2, kubelab=63, dotfiles=36
Numbers existing in more than one repo:  36
```

Every dotfiles ADR from 001 to 036 collides with a kubelab ADR of the same
number, plus `ADR-056` in web and kubelab. `ADR-025` is
`cross-machine-path-resolution` **and** `magicdns-internal-naming`. `ADR-018` is
`de-vault-task-placement` **and** `ghost-cms-rejection`.

The sharper diagnosis is not "duplicates" but **two schemes sharing one
namespace, one of them invisible**:

- **web and kubelab deliberately share a sequence.** `web/docs/adr/ADR-056`
  declares `Extends / refines: ADR-053, ADR-054`, and neither is in web — they
  are kubelab's. web numbered its own two ADRs **055 and 056 to continue
  kubelab's count**. That convention works, and it is the reason it is invisible:
  from inside web, bare cross-repo numbers resolve correctly.
- **dotfiles runs an independent sequence from 001**, which is also reasonable in
  isolation, and is why it overlaps kubelab wholesale.

Neither repo is doing anything wrong locally. The defect only exists in the
space between them, which is exactly the space nobody owns.

**Where it already bites**: `~/.claude/CLAUDE.md` — compiled from the vault and
injected into *every* agent in *every* repo — cites `ADR-025` and `ADR-018`
bare. Both are in the collision block. An agent working in kubelab that resolves
`ADR-025` locally gets the wrong document and is confidently wrong about the
thing the doctrine was trying to tell it.

And it is load-bearing for this repo specifically: **a public page cannot link an
ADR by a reference that resolves to two documents.** A wrong link on a page whose
entire claim is rigour refutes the claim more effectively than having no link.

**Solution**: not taken here — filed as `dotfiles#1437` with three options, the
recommendation being to give dotfiles a disjoint band (200+) and renumber its 36,
because that preserves the one convention that is working and touches one repo.
What matters for a lesson is the *check*, which did not exist:

```bash
# every ADR number, across every repo, must resolve to exactly one document
find "$REPOS"/*/docs/adr -name '[Aa][Dd][Rr]-*.md' -printf '%f\n' \
  | sed -E 's/^[Aa][Dd][Rr]-([0-9]{3}).*/\1/' | sort | uniq -d
```

Note the case-insensitive glob: web writes `ADR-056-*.md`, kubelab writes
`adr-056-*.md`, and dotfiles mixes numbered files with unnumbered ones like
`dotfiles-architecture-map.md`. Any resolver has to tolerate all three, which is
its own small argument for fixing the convention rather than the tooling.

**Takeaway**: an identifier that is only unique *within* a repository stops being
an identifier the moment anything cites it from outside — and cross-repo citation
is not an edge case here, it is what the ADRs are for. When a scheme is shared by
convention rather than enforced by a check, the convention holds exactly as long
as everyone who extends it knows it exists. Nobody extending dotfiles from 001
was doing anything unreasonable; there was simply nothing to tell them. **Write
the uniqueness check when you write the second repo, not when a page tries to
link one.**

**Related**: `lesson-027` (a record that something was done is not evidence),
`lesson-018` (a schema cannot say an identifier resolves, only that it looks like
one), `lesson-021` (a generator that namespaces no ids is fine until you embed
two of its outputs) — the same defect one layer up: local uniqueness that stops
holding when two sources share a document.
