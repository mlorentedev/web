# ADR-056: Decoupled Live Platform Cockpit Architecture & Telemetry Contract

- **Status:** Accepted
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
