---
id: "WEB-105"
type: spec
status: draft # draft | implementing | verifying | archived
created: "2026-09-03"
issue: "mlorentedev/web#292"   # repo#NNN — GitHub issue / Project item that tracks this spec
tags: [spec, proposal]
template_version: "1.0"
---

# WEB-105: the Lab's Services section, rebuilt around a measured access table

## Why

<!-- from issue #292: WEB-105: the Lab says "Mesh only" about four services anyone can reach — rethink Services around a measured access table -->

The Lab's Services section states things about the cluster that are false. Four of
fourteen services render the neutral `Mesh only` badge while `grafana`, `argo`,
`status` and `traefik` resolve on a public resolver to `162.55.57.175` — measured
2026-09-03 from outside the tailnet. The badge exists because someone typed
`isPublic: false` into `platform.json`, which has no producer (`#162`), and
nothing has checked it since; that is the same failure `#272` records on the
inventory axis.

Worse, the two-value vocabulary is itself wrong. kubelab declares **four**
distinct access postures, and `public`/`mesh` cannot express them — which is why
a service authenticating through OIDC and a service not exposed at all both end
up under the same badge. A section whose access claims are authored will drift
again. One that measures them, and checks the measurement against the policy
kubelab declares, cannot — and it doubles as the test surface this work is for.

## What

After this ships, `/lab` and `/es/lab` render a minimal per-service table whose
access column is **produced and cross-checked**, not written:

1. **Four access classes, taken from kubelab's own `access_control`** rather than
   invented here (`infra/k8s/overlays/prod/authelia-config/configuration.yml`):

   | Class | Meaning | Declared for |
   |---|---|---|
   | `public` | `policy: bypass` — no auth by design | `api`, `status`, `auth` |
   | `sso` | forward-auth bypassed, the service authenticates via OIDC | `gitea`, `minio`, `console.minio`, `argo` |
   | `authelia` | `policy: one_factor` behind forward-auth | `grafana`, `traefik`, `n8n` |
   | `mesh` | not exposed; `default_policy: deny` from the internet | `headscale`, `loki`, `coredns`, … |

2. **A build-time probe records what an unauthenticated visitor actually meets**,
   and the page prints it with the address and the date taken. Measured
   2026-09-03, the whole surface agrees with the table above:

   ```
   grafana  302 → auth.kubelab.live      traefik  302 → auth.kubelab.live
   n8n      302 → auth.kubelab.live      status   200 Uptime Kuma
   argo     200 Argo CD (native OIDC)    gitea    200
   minio    403                          console.minio  200
   headscale / loki                      NXDOMAIN
   ```

3. **The measurement is checked against the declaration.** A service whose probe
   disagrees with the policy kubelab declares for it fails the build. This is
   strictly stronger than rendering what was seen, and it is what turns the page
   into a test rather than a report.

4. **A third archify IR** draws the gateway path — edge → Traefik → (Authelia |
   OIDC) → service — so the access column has a picture behind it.

Gated hostnames are published deliberately (Manu, 2026-09-03): they already
resolve publicly, so this discloses enumeration rather than secrets, and the
intended posture is that the door is the door. `#161` is cross-referenced, not
duplicated.

## Out of scope

- **Fixing the cluster.** The page renders what is there — that is the point, so
  cluster state is never a blocker. (`kubelab#1580`, opened during this analysis,
  was **retracted and closed**: Argo CD is ungated deliberately per ARGO-010 and
  `status` is `bypass` by design. Both are declared in config, and reading it is
  what corrected a wrong conclusion drawn from black-box probing.)
- **Runtime probing or any client-side JS.** WEB-080's zero-JS constraint is
  unchanged. `LabProbe.astro` is deleted rather than kept alongside a build-time
  probe — probing at build while shipping a runtime probe console is two answers
  to one question. That closes `#280` by construction.
- **Mermaid.** Rejected with reasons in `#292` §4: WEB-080 chose archify IRs
  deliberately, `#244` measured mermaid at 3573 px and illegible when
  constrained, and `#272` reports five dead mermaid blocks already in the data.
- **Resolving `#161`.** Publishing gated *hostnames* is decided here; publishing
  *IP addresses and subnets* across the notes corpus stays that ticket's call.

## Risks / open questions

**Resolved before tasks freeze:**

- **Where the probe runs → build time** (Manu). A `prebuild` step shaped like
  `diagrams.mjs verify`. A test-only assertion would put the test surface in CI
  rather than on the page, which is not what was asked for.
- **Publishing gated hostnames → yes** (Manu).
- **`LabProbe.astro` and `#280` → deleted here.**
- **Is `status.kubelab.live` public by accident? → No, by design.**
  `policy: bypass` under *"PUBLIC apps (no auth required)"*. `public` therefore
  takes a neutral colour, not a warning one — it is not a degraded state, the
  same reasoning `#251` applied to access badges generally.
- **What `isPublic` becomes → dropped.** It is a boolean that cannot express four
  classes and has already been wrong four times over. The measured class replaces
  it; nothing authored survives as a second source of truth.

**Still open, none blocking tasks:**

- **CI runner egress.** The hosts are public so a runner reaches them, but a
  transient failure must not paint a service `unreachable` or break the build.
  Fallback is the last committed probe result (`lesson-005`); a result older than
  the threshold fails the build the way a stale IR does — AC5.
- **`wiki.kubelab.live` is declared `bypass` and does not resolve** (NXDOMAIN,
  measured 2026-09-03). Dead policy for a host that is not deployed. Out of scope
  to fix, but it is exactly what AC3's declared-vs-measured check would catch, so
  it makes a good first fixture. File against kubelab during implementation.
- **`argo.kubelab.live` appears in no `access_control` rule**, and its posture is
  documented only in the IngressRoute comment and ARGO-010. The declared source
  for the `sso` class is therefore two files, not one. Decide during
  implementation whether the spec reads both or treats an absent rule plus a
  `200` as `sso` by inference — the latter is weaker and should be justified.

## Acceptance criteria

- [ ] **AC1** — `npm run build` on a clean checkout produces `dist/lab/index.html`
      and `dist/es/lab/index.html`, each with exactly one row per
      `platform.services[]` entry; every row carries a `data-access` of `public`,
      `sso`, `authelia` or `mesh` and the date it was measured. A test reads
      `dist/`.
- [ ] **AC2** — The class is non-vacuous: mutating a committed probe result from
      `authelia` to `public` and rebuilding changes the rendered row, and a test
      performs that mutation and asserts the difference.
- [ ] **AC3** — The measurement is checked against kubelab's declared
      `access_control`: a host whose probe disagrees with its declared policy
      fails the build, naming both values. The four services mislabelled on
      `master` today fail this check, which is the red-before evidence.
- [ ] **AC4** — Zero JS holds: the `<script>` count in `dist/lab/index.html` is
      unchanged from `master`, and `test:browser` and `test:a11y` both pass over
      the new table and the third diagram, in both locales.
- [ ] **AC5** — Staleness refuses: a probe result older than the committed
      threshold fails `prebuild` with a message naming its age, and a test
      asserts that refusal.

## References

- Bitácora board: `mlorentedev/web#292`
- kubelab `infra/k8s/overlays/prod/authelia-config/configuration.yml` — the
  declared `access_control`, the SSOT for AC3.
- kubelab `infra/k8s/overlays/prod/argocd.yaml` + ARGO-010 — why `argo` is `sso`.
- `#162` — `platform.json` has no producer. **This spec supplies one on the access
  axis only**; the ticket stays open for the rest.
- `#272` — manifest drift, inventory axis, overlapping fix.
- `#280` — retire the reachability console. Closed by construction here.
- `#278` — the stale-IR test. **Lands first as its own PR**, so AC5 reuses a
  proven staleness pattern rather than inventing one.
- `#161` — the authorial decision on publishing the homelab's IP addressing.
- `#244` — why rendered mermaid is not the answer for diagrams here.
- `#251` — access is not a status colour; the mapping this extends.
- `lesson-005` — a build-time external fetch needs a committed fallback.
- `lesson-016` — a test that only ever runs against the fix proves nothing (AC2).
- WEB-080 (`specs/archive/WEB-080/`) — the static, zero-JS constraint and the
  archify diagram pipeline this builds on.
