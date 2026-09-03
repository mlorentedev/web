---
id: lesson-036-a-black-box-probe-tells-you-what-happens-nev
type: lesson
status: active
created: "2026-09-02"
owner: manu
tags: [web, verification, security, review]
---

# A black-box probe tells you what happens, never why — and "this looks accidental" is not a finding

**Context**: Scoping WEB-105, which rebuilds the Lab's Services section around a
measured access column. The section labels four services `Mesh only` that resolve
publicly, so the next question was what an unauthenticated visitor actually
meets. Probed from outside the tailnet:

```
grafana.kubelab.live   302 → https://auth.kubelab.live/?rd=…   gated
traefik.kubelab.live   302 → https://auth.kubelab.live/?rd=…   gated
argo.kubelab.live      200   <title>Argo CD</title>            NOT gated
status.kubelab.live    200 → /dashboard  Uptime Kuma           NOT gated
```

**Problem**: I filed those last two as a security finding — `kubelab#1580`,
*"Argo CD is reachable from the internet without Authelia, while Grafana and
Traefik are behind it"* — on the argument that the inconsistency "does not look
deliberate."

Both are deliberate, and both are declared in files I had not read. Manu's
answer was simply to point at the repository:

```yaml
# infra/k8s/overlays/prod/argocd.yaml
      middlewares:
        - name: secure-headers
        - name: rate-limit
        - name: crowdsec-bouncer
        # No authelia ForwardAuth — Argo CD uses native OIDC (ARGO-010)
```

```yaml
# infra/k8s/overlays/prod/authelia-config/configuration.yml
    # PUBLIC apps (no auth required)
    - domain: 'status.kubelab.live'
      policy: bypass
```

Argo CD authenticates as an OIDC client of Authelia — the same posture as MinIO
and Gitea, which that config groups together explicitly — precisely so there is
no double login. Its API had already refused me (`/api/v1/applications` → `401`),
which I recorded and then reasoned past. The ticket was closed `not_planned`
with a retraction.

**Solution**: Read the declaration before drawing a conclusion from the
observation. The correction cost one `grep` and it improved the spec more than
the finding would have, because that same `access_control` block turned out to
declare **four** access postures where the page models a boolean:

| Class | Declared as | Hosts |
|---|---|---|
| `public` | `policy: bypass` | `api`, `status`, `auth` |
| `sso` | forward-auth bypassed, OIDC handles login | `gitea`, `minio`, `argo` |
| `authelia` | `policy: one_factor` | `grafana`, `traefik`, `n8n` |
| `mesh` | `default_policy: deny` from the internet | `headscale`, `loki`, … |

So WEB-105's check became *measured == declared* rather than merely *render what
was measured* — a build that fails when the cluster and its stated policy
disagree. That is only possible because the declaration exists as a file.

The probing was not wasted: it found `wiki.kubelab.live` still granted `bypass`
while returning `NXDOMAIN`, dead policy for a host removed months ago
(`kubelab#1581`). Measurement is what caught that. Measurement plus the
declaration is what told the difference between it and Argo CD.

**Rule**: An observation establishes behaviour. Intent lives in configuration,
comments, ADRs and lesson files, and in a repository you have access to there is
no excuse for inferring it. Before reporting that something "looks unintentional"
— especially as a security finding, where being wrong is expensive — grep for the
hostname, the resource name, the flag. Say *"declared X, measured Y"* or say
nothing; "I measured Y and it surprised me" is a question, not a finding.

Related: [`lesson-014`](lesson-014-a-subagent-finding-is-a-claim-to-verify-no.md) — a finding is a claim to verify, and that
applies to your own.
