# Research Report: Premier Practitioner Referentes Audit, Positioning, and 104-Week Editorial Strategy

> Canonical research artifact fulfilling **WEB-081 (#182 AC1 & AC2)**, resolving **WEB-091 (#236)**, and grounding **WEB-086 (#229)**.
> Recorded: 2026-09-02 | Author: Manu Lorente & Engineering Agent

---

## 1. Executive Summary & The Benchmark

This audit benchmarks the positioning, editorial architecture, and visual proof surfaces of five premier engineering practitioners:

| Practitioner | Archetype | Visual & Diagram Language | Proof Surface | Relevance to mlorente.dev |
|---|---|---|---|---|
| **Mitchell Hashimoto** (`mitchellh.com`) | Systems Craftsman | Vector SVGs, byte layout tables, terminal traces | Compiler ASTs, build benchmarks, protocol specs | Harness engineering doctrine: invariant enclosures around tools. |
| **Brandur Leach** (`brandur.org`) | Distributed Systems Architect | Monodraw ASCII art exported to SVG, crisp Swiss typography | SQL transaction traces, idempotency state diagrams, Go code | Deep architectural essays with failure modes first and runnable code. |
| **Simon Willison** (`simonwillison.net`) | Empirical AI Builder | Inline CLI outputs, verbatim prompt/eval logs, test payloads | Executable scripts, raw inputs/outputs, zero hype | Multi-tier content engine (TILs + releases + essays), pragmatic AI. |
| **Dan Luu** (`danluu.com`) | Empirical Rigorist | Brutalist plain text, data-heavy tables | Microsecond latency benchmarks across hardware | "Show your work": hard telemetry receipts over claims. |
| **Julia Evans** (`jvns.ca`) | First-Principles Demystifier | Annotated terminal outputs, visual mental models | Syscall traces (`strace`), packet captures (`tcpdump`) | Demystifying complex networking (DNS, WireGuard) step by step. |

---

## 2. Hero & Positioning Options (Resolving A2 = C & WEB-081)

The stance A2 = C splits the claim: **Homelab is the proof, AI Platform is the direction**. The three concrete hero copy options:

### Option 1: Systems & Platform SRE (Recommended for Staff AI Platform / FDE)
* **EN:** *"Platform Engineer & SRE building deterministic execution harnesses, sovereign Kubernetes clusters, and eval frameworks for autonomous AI agents."*
* **ES:** *"Ingeniero de Plataforma y SRE construyendo arneses de ejecución deterministas, clústeres soberanos de Kubernetes y marcos de evaluación para agentes de IA autónomos."*
* **Sub-copy:** *"Substance first. 8 bare-metal nodes, hybrid K3s mesh, headless FastMCP engines, and zero-trust agent sandboxes."*

### Option 2: Autonomous Infrastructure & Sovereign Mesh
* **EN:** *"Sovereign Infrastructure & Autonomous Systems. From hybrid bare-metal Kubernetes and userspace mesh networks to deterministic multi-agent harnesses."*
* **ES:** *"Infraestructura soberana y sistemas autónomos. De Kubernetes híbrido en bare-metal y redes malla a arneses deterministas multi-agente."*
* **Sub-copy:** *"Operating production platforms where foundation models run inside bounded, observable enclosures."*

### Option 3: Systems Craftsman (Mitchell / Brandur Tone)
* **EN:** *"Systems engineering for the agentic era. Operating hybrid cloud clusters, headless FastMCP servers, and zero-trust agent execution planes."*
* **ES:** *"Ingeniería de sistemas para la era de los agentes. Operando clústeres híbridos, servidores FastMCP headless y planos de ejecución de agentes zero-trust."*
* **Sub-copy:** *"Proof surfaces over claims. Real uptime, measured latency, and open-source platform tooling."*

---

## 3. Spanish Content Strategy (Resolving A4 & #110)

To resolve the tension between global FDE opportunities (English-first) and local community leadership (Cloud Native Sevilla, KCD Spain):

1. **Asymmetric Tiering:**
   - **Tier 1 (Global Authority, EN):** Deep architectural essays, benchmark receipts, and code-level harness specifications. Authored in English first.
   - **Tier 2 (Community & Advisory, ES):** High-level case studies, executive summaries, community keynotes, and inbound consulting CTAs.
2. **Immutable Technical Glossary:**
   - Retain in English: *idempotency key, circuit breaker, rate limiting, token bucket, mesh network, outbox pattern, harness engineering, buildx cache, worktree.*
   - Natural Spanish: *latencia de cola, tasa de transferencia, tolerancia a fallos, aislamiento de transacciones.*
3. **Decoupled Publishing:** English releases are never blocked waiting for Spanish translation; translations publish asynchronously or as simultaneous twin posts.

---

## 4. Placement of AI & Harness Material (Resolving WEB-091 / #236)

**Decision:** Option B modified — **Create a top-level dedicated `/ai` section** accompanied by the Archify `harness.svg` architecture diagram.
* **/lab** remains dedicated to physical homelab hardware, network topology, and Kubernetes orchestration.
* **/ai** becomes the flagship home for the Autonomous Engineering Harness, agent choreography, safety gates, and FastMCP tooling.
* A compact referral card in `/lab` links to `/ai`, maintaining the `WEB-080` test pass while eliminating content overload.

---

## 5. The 104-Week Editorial Roadmap (Resolving WEB-086 / #229)

Transforming 850+ documented lessons and 62 ADRs into a 104-week weekly publication calendar:
* **Weeks -78 to -53:** Homelab Hardware, Proxmox, WireGuard & DNS Foundations (26 weeks).
* **Weeks -52 to -27:** K3s Kubernetes, GitOps Argo CD, Ingress Traefik, SOPS Secrets & Velero Backups (26 weeks).
* **Weeks -26 to 0:** The AI Harness, FastMCP, SQLite FTS5, Git Worktrees & Kernel Semaphores in Go (26 weeks).
* **Weeks +1 to +26:** Contextual RAG (AST Chunker), CI Evals, Token Rate-Limiting, OTel GenAI & Live Cockpit (26 weeks).
