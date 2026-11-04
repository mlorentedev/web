# Architecture decisions

This repository's own decisions are the `ADR-NNN-*.md` files in this directory
(ADR-055 to ADR-060). Every other ADR number cited in this repository belongs to
another one, and the numbers collide: kubelab and dotfiles each have their own
ADR-018, ADR-025, ADR-032 and so on. A citation means the document listed here.

`scripts/check-doc-refs.sh` fails when an ADR number cited in `.github/`,
`scripts/`, `docs/`, `AGENTS.md`, `README.md` or the `Makefile` is neither a
file here nor a row below.

| ADR | Repository | Decision |
|---|---|---|
| ADR-017 | kubelab | [Domain strategy](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-017-domain-strategy.md) |
| ADR-018 | dotfiles | [Task placement: the bitácora board, not the vault](https://github.com/mlorentedev/dotfiles/blob/main/docs/adr/adr-018-de-vault-task-placement.md) |
| ADR-020 | kubelab | [IaC lifecycle strategy](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-020-iac-lifecycle-strategy.md) |
| ADR-021 | dotfiles | [CLI orchestration roadmap, including `compile-harness`](https://github.com/mlorentedev/dotfiles/blob/main/docs/adr/adr-021-cli-orchestration-roadmap.md) |
| ADR-025 | dotfiles | [Cross-machine path resolution (`machine.json`)](https://github.com/mlorentedev/dotfiles/blob/main/docs/adr/adr-025-cross-machine-path-resolution.md) |
| ADR-028 | kubelab | [Operational topology: which hosts run when](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-028-operational-topology.md) |
| ADR-032 | dotfiles | [Cross-harness agent orchestration, including the NaN inference pool](https://github.com/mlorentedev/dotfiles/blob/main/docs/adr/adr-032-cross-harness-agent-orchestration.md) |
| ADR-037 | kubelab | [Environment promotion strategy](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-037-environment-promotion-strategy.md) |
| ADR-038 | kubelab | [Secret delivery paths](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-038-secret-delivery-paths.md) |
| ADR-046 | kubelab | [GitOps delivery and promotion](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-046-gitops-delivery-promotion-strategy.md) |
| ADR-048 | kubelab | [Platform and consumer repository boundary](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-048-platform-consumer-repo-boundary.md) |
| ADR-049 | kubelab | [Edge and object storage placement](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-049-edge-object-storage-placement-doctrine.md) |
| ADR-053 | kubelab | [Platform and product repositories: the two-repo flow](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-053-platform-product-repos.md) |
| ADR-054 | kubelab | [Web runtime config: same-origin `/api`](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-054-web-runtime-config.md) |
| ADR-063 | kubelab | [Hub cloud provider migration](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-063-hub-cloud-provider-migration.md) |
| ADR-067 | kubelab | [Product contract and agent access (`kubelab.yaml`)](https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-067-product-contract-and-agent-access.md) |

Numbers cited only inside `site/tests/fixtures/` (ADR-027, ADR-029) are quotes
of other repositories' documents, kept verbatim, and resolve in the repository
each fixture names.
