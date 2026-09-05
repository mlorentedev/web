# ADR-056: Decoupled Live Platform Cockpit Architecture & Telemetry Contract

- **Status:** Accepted — **§4.2/§4.3 amended 2026-09-01** (the `no-cors` premise expired; see the amendment in Decision §4); **§1 amended 2026-09-05** (every component name and route in §1 is stale, and indicator 2 was false; see the amendment in Decision §1)
- **Date:** 2026-08-23
- **Deciders:** Manu Lorente
- **Extends / refines:** ADR-053 (platform/product repo split), ADR-054 (same-origin API base)
- **Scope:** `web` (this repo: Cockpit UI & telemetry display) + `kubelab` (SSOT manifest exporter `kubelab#1347`)

---

## Context

To demonstrate engineering capabilities as a Forward Deployed Engineer (FDE) and Platform Engineer, `mlorente.dev` carries a **Platform Cockpit** documenting its hybrid cloud/edge infrastructure, on-device AI inference (Jetson Nano · Pollex), context retrieval (Hive MCP), and GitOps delivery.

Historically, platform state was viewed through an internal cluster dashboard (`home.kubelab.live`, powered by the `gethomepage` container in `kubelab`). Exposing or embedding that internal dashboard directly on `mlorente.dev` was evaluated and rejected:
1. **Security / Zero Exposure:** The internal dashboard references private endpoints, administrative tools (Authelia, internal Gitea, Pi-hole), and requires internal network access.
2. **Coupling & Availability Risk:** If the homelab cluster underwent maintenance or an ISP reboot, a tightly-coupled web application would show 502 Bad Gateway errors or fail builds.
3. **UI / Brand Experience:** A third-party iframe or generic dashboard lacks the design language, responsive performance, and bilingual capabilities of the Astro static site.

## Decision

We adopt a **Static Baseline + Progressive Live Hydration (Islands Architecture)** pattern decoupled across the two repositories:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KUBELAB (Monorepo Infra)                        │
│  • SSOT: common.yaml (cluster topology, hardware nodes, services)      │
│  • Exporter (kubelab#1347): sanitized public manifest generator        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON Contract (cockpit.json)
                                     │ (Public services, nodes, specs)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        WEB (mlorente.dev / Astro)                      │
│  • Level 1: src/components/CockpitStrip.astro (Home page strip)        │
│  • Level 2: src/components/CockpitPage.astro (one body, two routes)    │
│  • Data: src/data/cockpit.json + src/data/cockpit.ts                   │
│  • Client Probing: Non-blocking reachability + round-trip latency      │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Two-Level Surface Design

- **Level 1: Home Page Telemetry Strip (`src/components/CockpitStrip.astro`)**
  - High-visibility banner on the Home page (`/` and `/es/`), elevating the Proof Surface.
  - Displays four build-time indicators:
    1. `● K3s Operational · GitOps Synced (ArgoCD)`
    2. `● Jetson Nano GPU Online · ~3.2s TTFT (Qwen 1.5B)`
    3. `● Hive MCP Active`
    4. `● 99.9% Uptime (90d)`
  - CTA button: *"Explore the platform cockpit →"* linking to `/cockpit` (or `/es/cockpit`).

- **Level 2: Dedicated Cockpit Page (`src/components/CockpitPage.astro`)**
  - One translated body; `src/pages/cockpit.astro` and `src/pages/es/cockpit.astro` are thin routes
    over it, so the two locales cannot drift apart.
  - **Platform Header:** Hybrid IDP cluster status, ArgoCD GitOps sync badge, active node count.
  - **Public Services Grid:** Interactive cards for public services (Pollex, Hive, Platform API, Docs) with category tags, tech stack badges, and probe badges.
  - **Hybrid Node & Topology Visualizer:** Cards representing physical and cloud nodes (Hetzner VPS prod, Acemagic staging, Jetson Nano AI edge, CI/CD runner) with hardware specifications (CPU, RAM, GPU, OS).
  - **Interactive Reachability Console (Mini-Terminal):** Client-side runner letting visitors probe the public endpoints from their own browser, reporting reachability and round-trip latency in milliseconds (`performance.now()`). See §4.3 for what that can and cannot claim.

> **Amended 2026-09-05 (WEB-102). The design above shipped; every name and route
> it uses to point at that design is wrong, and one of its four indicator strings
> was false on an accepted ADR for twelve days.**
>
> The two-level structure was built and is live. What follows corrects where it
> lives and what it says, and records the decision §1 assumed without stating.
>
> **Nothing named in §1 exists under that name.** Measured 2026-09-05 against
> `site/src/`: all six references resolve to nothing.
>
> | §1 says | What shipped |
> |---|---|
> | `CockpitStrip.astro` | `IdpStrip.astro` |
> | `CockpitPage.astro` | `LabPage.astro` (plus `Lab*.astro` per section) |
> | `cockpit.json` / `cockpit.ts` | `platform.json` / `platform.ts` |
> | `pages/cockpit.astro`, `pages/es/cockpit.astro` | `pages/lab.astro`, `pages/es/lab.astro` |
> | CTA to `/cockpit` (or `/es/cockpit`) | CTA to `/lab`, via `translatePath` |
>
> The ASCII diagram in Decision carries the same stale names. **No live link to
> `/cockpit` remains** — `grep -rn cockpit site/src` returns nothing outside this
> document, so the rename left no 404 behind. The cost was to the record only,
> which is the failure mode that goes unnoticed longest.
>
> **The four Level 1 indicators are not hardcoded, and indicator 2 was wrong.**
> What ships is a title from `i18n/ui.ts` (`idp.k3s`, `idp.edge`, `idp.hive`,
> `idp.uptime`) over a subtitle derived from `platform.metrics.*` — so the figures
> come from the same SSOT `/lab` reads, not from a second hand-maintained copy.
>
> Indicator 2 above reads `● Jetson Nano GPU Online · ~3.2s TTFT (Qwen 1.5B)`.
> **The page has said `Jetson Nano · Qwen 2.5 1.5B, CPU inference` for some time**
> — the correction landed in the code and never reached the ADR, so the false
> claim `#272` measured survived here alone. It is not re-measured because the
> honest value is the one the SSOT already carries: `inferenceLatency` is
> `"not measured"`. No number is asserted in its place.
>
> **Indicator 4 is half-sourced and stays flagged.** `99.9%` comes from
> `platform.metrics.uptimeScore`; the `(90d)` window is a literal in `i18n/ui.ts`
> that nothing measures or bounds. Tracked in `#272` (`platform.json` staleness)
> and `#173`; not resolved here.
>
> **Decided: the home page previews, it does not argue.** `#281` asked whether the
> home page argues the platform and delegates proof to `/lab`, or previews `/lab`
> and delegates the argument. `#300` answered it in code — `IdpStrip.astro`
> imports `platform` from the SSOT, leaving no hand-maintained platform figure on
> the home page. This records that as the decision rather than leaving it implicit
> in a diff, so `#133`'s node-count reconciliation has one surface to fix.

### 2. JSON Data Contract (`site/src/data/cockpit.json`)

The data contract defines clean TypeScript interfaces in `site/src/data/cockpit.ts`:

```typescript
export interface ClusterInfo {
  name: string;
  version: string;
  gitops: string;
  uptime: string;
  activeNodes: number;
  totalServices: number;
}

export interface PlatformMetrics {
  inferenceLatency: string;
  contextReduction: string;
  reconciliationTime: string;
  edgeArchitecture: string;
}

export interface NodeTopology {
  id: string;
  name: string;
  role: string;
  environment: 'Production' | 'Staging' | 'Edge AI' | 'Infrastructure';
  provider: string;
  arch: string;
  status: 'healthy' | 'warning' | 'offline';
}

export interface PlatformService {
  slug: string;
  name: string;
  category: string;
  description: string;
  /** Public services only — internal endpoints are not shipped to the client (see §3). */
  url?: string;
  healthEndpoint?: string;
  tech: string[];
  isPublic: boolean;
  status: 'operational' | 'degraded' | 'maintenance';
}

export interface CockpitManifest {
  cluster: ClusterInfo;
  metrics: PlatformMetrics;
  nodes: NodeTopology[];
  services: PlatformService[];
}
```

### 3. Public Manifest Boundary

`cockpit.json` is compiled into the static bundle, so **everything in it is published**, including
fields the UI filters out of the render. `isPublic: false` therefore governs presentation only and is
not a security control. The boundary is enforced at the data layer instead:

- **No addressing.** No public IPs, no mesh/CGNAT addresses, no LAN subnets, in any field or diagram.
- **No internal hostnames.** Services that are not publicly reachable ship without `url` or
  `healthEndpoint`; the UI renders them as *not published*.
- **Component names are allowed.** Naming Traefik, Authelia, CrowdSec or Gitea describes the stack
  without locating it, and the same names already appear in `llms.txt` and the published notes.

This is what the rejection of the internal dashboard in Context §1 requires; stating it as a rule
keeps the manifest from drifting back.

### 4. Progressive Hydration & Resilience Strategy

1. **Static Baseline:** The Astro build bakes `cockpit.json` into static HTML. The page renders with
   no loading spinners and zero runtime backend dependency. Every figure it shows is a build-time
   snapshot, and the UI labels it as one — the page is not a live feed.
2. **Client-Side Probing:** A lightweight island executes `fetch(url, { mode: 'no-cors',
   cache: 'no-store' })` wrapped in `try/catch` and `AbortController` (4s timeout).
3. **What the probe can and cannot claim:** `no-cors` returns an opaque response, so the HTTP status
   is unreadable from the browser. The probe measures **reachability and round-trip latency from the
   visitor's browser** and says exactly that. Reading real status codes would require CORS headers on
   the kubelab side and is out of scope here.

> **Amended 2026-09-01 (WEB-080 PR6/PR7). Points 2 and 3 above no longer describe
> what ships, and the reason they are struck rather than rewritten is that the
> decision was right and its premise expired.**
>
> **The premise is false: `api.kubelab.live/health` serves
> `access-control-allow-origin: *`.** Verified by response header, so the browser
> can read the body. "Reading real status codes would require CORS headers on the
> kubelab side" was true when this was written and had quietly stopped being true;
> nobody re-checked, because the clause reads like a permanent constraint rather
> than a dated observation.
>
> **What §4.2 actually shipped, measured 2026-09-01, was worse than the ADR
> allowed for.** Three targets, of which two were `mlorentedev.github.io` pages
> for **Pollex and Hive — libraries, not running services** — reported
> `REACHABLE`, with the page attributing them to a Jetson Nano and a Hetzner VPS.
> The third was the API's **root, which returns 404**, indistinguishable from a
> 200 behind an opaque response. So the section was demonstrating that GitHub's
> CDN is up and presenting it as evidence of a homelab. That is not a limitation
> of `no-cors`; it is what `no-cors` made impossible to notice.
>
> **Now:** a plain `fetch` (default mode, `cache: 'no-store'`) against a single
> target selected from the manifest — `services.filter(s => s.healthEndpoint)`,
> which is one service, because that field is now set only where a real health
> endpoint exists. The console renders the API's own report of four subsystems,
> **plus the server's clock beside the visitor's** and the round trip. The clock
> pair is the payload `no-cors` could never deliver and the thing a cached
> response cannot fake, which is why the request is `no-store`.
>
> §4.3's *principle* is unchanged and is the reason this section survived at all:
> the probe still says exactly what it measured and no more. What changed is that
> it can now measure something worth saying.
>
> Evidence: `specs/WEB-080/verification.md` § PR6 and § PR7;
> `site/src/components/LabProbe.astro`; `site/tests/lab-axe.mjs`, which stubs this
> endpoint so CI never depends on whether the VPS is answering.

---

## Consequences

### Positive
- **Zero Runtime Coupling:** `mlorente.dev` never fails even if home infrastructure is rebooting.
- **Security:** Strict separation between the internal K8s admin dashboard (`home.kubelab.live`) and
  the public showcase, enforced by the manifest boundary in §3 rather than by render-time filtering.
- **Empirical Evidence:** Client-measured latency is real and comes from the visitor's own network.

### Negative / Trade-offs
- Static metadata (node specs, service descriptions) updates on web deployment rather than streaming.
  Accepted: node hardware does not change per second.
- **The manifest is hand-maintained.** `kubelab#1347` is the intended producer from `common.yaml`, but
  no exporter, sync job or drift check exists yet, so `cockpit.json` will diverge from the cluster
  until one is wired. Until then it is documentation of the platform, not a reading of it, and the
  counts it carries are reconciled against the rest of the site in
  [web#133](https://github.com/mlorentedev/web/issues/133).

---

## Related Issues & Artifacts

- Strategy & Roadmap: `10_projects/ai-strategy/fde-target-architecture.md` (PORT-02 / PORT-03)
- `web` Tracking Issue: [web#157](https://github.com/mlorentedev/web/issues/157)
- `kubelab` Tracking Issue: [kubelab#1347](https://github.com/mlorentedev/kubelab/issues/1347)
- ADR-053 (Two-Repo Platform/Product Architecture)
