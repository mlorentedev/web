export const languages = {
  en: 'English',
  es: 'Español',
} as const;

export const defaultLang = 'en';

export type Lang = keyof typeof languages;

export const ui = {
  en: {
    // Nav
    // "Lab" is the door; "IDP" is what is inside. Keep it 3 characters wide —
    // the nav row is already at its 320px limit (see Header.astro).
    'nav.ai': 'AI',
    'nav.lab': 'Lab',
    'nav.notes': 'Notes',
    'nav.contact': 'Contact',
    'nav.skipToContent': 'Skip to content',
    'footer.email': 'Email',

    // AI Section
    // A section name, not a second label: the label is the home eyebrow (WEB-137).
    'ai.hero.eyebrow': 'How I run AI agents',
    'ai.hero.title': 'The rules my AI agents work under, and what enforces them',
    'ai.hero.description':
      'A language model makes mistakes nobody can predict, so the prompt is not what keeps an agent in line. The rules are: each agent works in its own Git worktree, secrets are scrubbed from its output before anything is saved, a second model reviews every pull request, and nothing an agent writes merges until I have read it.',
    'ai.diagram.heading': 'Autonomous Agent Execution Plane',
    'ai.diagram.caption':
      'Task dispatch, knowledge retrieval via FastMCP, sandboxed worktree execution, and adversarial review.',
    'ai.diagram.legend':
      'Every agent operation runs within an isolated Git worktree. Destructive actions trigger a synchronous HITL gate. PRs are audited by an independent model family before reaching human review.',
    'ai.hero.pill.attribution': 'Zero AI Attribution',
    'ai.hero.pill.flock': 'Kernel flock',
    'ai.hero.pill.worktrees': 'Ephemeral Worktrees',
    'ai.hero.pill.redactor': 'Stream Redactor',
    'ai.pillars.badge.isolation': 'Isolation',
    'ai.pillars.badge.security': 'Security',
    'ai.pillars.badge.safety': 'Safety',
    'ai.pillars.badge.verification': 'Verification',
    'ai.pillars.heading': 'Four rules, each with a mechanism behind it',
    'ai.pillars.sub': 'None of them relies on the model behaving well: each one is a lock, a filter, a limit or a review.',
    'ai.pillars.p1.title': 'OS Concurrency & Worktree Sandboxing',
    'ai.pillars.p1.desc':
      'Ephemeral git worktrees sharing the .git/objects pool. Kernel POSIX flock semaphores prevent race conditions and branch collisions across concurrent autonomous agents.',
    'ai.pillars.p1.i1': 'Shared object pool isolation',
    'ai.pillars.p1.i2': 'Kernel-level flock semaphores',
    'ai.pillars.p1.i3': 'Monotonic deadline timeouts',
    'ai.pillars.p2.title': 'In-Stream Secret Redaction & JIT Injection',
    'ai.pillars.p2.desc':
      'Real-time stream writer scrubbing process stdout/stderr before transcript persistence. Zero plaintext secrets on disk: Age/SOPS decryption piped strictly in-memory.',
    'ai.pillars.p2.i1': 'In-memory redactWriter stream filter',
    'ai.pillars.p2.i2': 'Age / SOPS asymmetric encryption',
    'ai.pillars.p2.i3': 'Immediate HALT on credential leak',
    'ai.pillars.p3.title': 'Safety Brakes & Atomic PR Cap',
    'ai.pillars.p3.desc':
      'Dynamic AST loop circuit breaker halting recursive tool invocations. Synchronous cryptographic HITL gate for destructive actions and hard ~300 executable LOC cap.',
    'ai.pillars.p3.i1': 'Dynamic tool loop circuit breaker',
    'ai.pillars.p3.i2': 'Synchronous HITL approval gate',
    'ai.pillars.p3.i3': '~300 executable LOC PR budget',
    'ai.pillars.p4.title': 'Cross-Model Adversarial Audit & Zero Auto-Merge',
    'ai.pillars.p4.desc':
      'Independent model family auditing pull request diffs for anti-sycophancy. Strict prohibition of auto-merge: every production change merges under human review.',
    'ai.pillars.p4.i1': 'Cross-model independent diff review',
    'ai.pillars.p4.i2': 'Strict zero auto-merge doctrine',
    'ai.pillars.p4.i3': 'CI regression & mutation suites',
    'ai.artifacts.heading': 'The rules, quoted from their files',
    'ai.artifacts.sub':
      'Four excerpts, each quoted word for word from a public file and linked to the commit it was taken from.',
    'ai.automations.heading': 'Autonomous Fleet & Automations',
    'ai.automations.intro':
      'The agents in production, the protocols they use, the event routers and the telemetry sinks running across the cluster. Most endpoints operate within the mesh boundary — what you see here is the live inventory and execution contracts.',
    'ai.automations.count': '{n} entries · {reachable} you can open from here',
    'ai.automations.link': 'open',
    'ai.automations.source': 'Migrated from {repo} · {commit}',

    // Hero
    // A2 = C: the homelab is the proof, the agent platform is the direction, and
    // the hero says which is which. The previous copy claimed "the infrastructure
    // AI agents run on" against a corpus where zero of sixteen notes were about
    // AI or agents. It also published "40 services" while the platform manifest
    // said 31 and then 35 (#133) — no figure here now needs defending.
    //
    // The eyebrow is the one label repeated on every surface and profile
    // (WEB-137): where the career comes from, CMOS sensors to clusters. The
    // title below says what the work is now; the two do different jobs.
    'hero.eyebrow': 'Engineer from Silicon to Cloud',
    'hero.title': 'The infrastructure under the agents, not the prompts on top',
    'hero.subtitle':
      'Almost everyone building for AI agents arrives from the application side. I arrive from the metal — Kubernetes on hardware I own, mesh, split DNS, GitOps that reconciles in under thirty seconds. That platform is where my own agents now run, under a harness with hard limits. The agent platform is what I am building on it.',
    // The door (WEB-137): the one way in, the same button on the hero and on
    // /contact/. The mail it opens is the written filter, three lines.
    'door.cta': 'Tell me what has to work',
    'door.subject': 'What has to work',
    'door.body': "What has to work:\nWhat's already in production:\nWhen you need it:\n",
    'door.busy': 'Currently on a project; the next one starts in {month}.',
    'hero.story': 'Read my story',

    // IDP Catalog (KubeLab IDP)
    'idp.catalog.title': 'KubeLab IDP · Control Plane & Tooling Catalog',
    'idp.catalog.description': 'Public operational catalog, infrastructure spend, observability, and platform tooling.',
    'idp.catalog.eyebrow': 'Internal Developer Platform',
    'idp.catalog.backToLab': 'Back to Platform Lab',
    'idp.catalog.intro': 'The internal developer platform powering autonomous agents, GitOps reconciliation, and edge workloads. Transparent cloud spend, incident runbooks, security posture, and core tooling.',
    'idp.catalog.stats': '{categories} operational domains · {items} platform components',
    'idp.catalog.spendLabel': 'monthly cloud spend',
    'idp.catalog.source': 'Reconciled from {repo} · commit {commit}',
    'idp.access.public': 'Public',
    'idp.access.auth': 'IAM Auth',
    'idp.access.local': 'Local Vault',
    'idp.action.open': 'Open resource',
    'idp.why.auth': 'Needs my account on the provider',
    'idp.why.local': 'A local vault on my laptop',
    'idp.why.platform': 'Linked from Services on the Lab',

    // IDP Architecture
    'idp.nav.sections': 'IDP Sections',
    'idp.nav.catalog': 'Catalog & Tooling',
    'idp.nav.architecture': 'Operational Flows',
    'idp.arch.title': 'KubeLab IDP · Operational Flows & Request Architecture',
    'idp.arch.description': 'Public request routing, edge WAF, forward authentication, and telemetry pipeline.',
    'idp.arch.eyebrow': 'Internal Developer Platform',
    'idp.arch.backToIdp': 'Back to IDP Catalog',
    'idp.arch.intro': 'Visualizing the defense-in-depth request lifecycle: from public edge Anycast and Cloudflare WAF, through Traefik ingress and Authelia forward-authentication, to containerized workloads and Loki telemetry.',
    'idp.arch.requestPath.heading': 'Request Path & Defense-in-Depth',
    'idp.arch.requestPath.caption': 'Dual-layer perimeter routing, zero-trust forward authentication, and structured logging.',
    'idp.arch.requestPath.legend': 'Every inbound HTTP request terminates TLS at the Cloudflare edge before reaching the production Hetzner host over an encrypted origin tunnel. Traefik validates host headers, interrogates the CrowdSec security engine for known malicious threat intelligence, and delegates private route authentication to Authelia via ForwardAuth middleware. Container logs flow through Vector directly into Loki without exposing cluster internals or metrics endpoints to the public internet.',
    'idp.arch.gitops.heading': 'Continuous Delivery & GitOps Mesh',
    'idp.arch.gitops.caption': 'Hub-and-spoke automated reconciliation over private WireGuard overlay tunnels.',
    'idp.arch.gitops.legend': 'Application source code and declarative K8s manifests live in GitHub monorepos as the single source of truth. Continuous integration builds multi-architecture container images and publishes immutable sha digests to Docker Hub and GHCR. Argo CD operates as an isolated control plane hub on GCP, rendering environment-specific Kustomize overlays and reconciling spoke clusters across cloud VPS and on-prem homelab through private Tailscale WireGuard tunnels without exposing Kubernetes API port 6443 to the public internet.',
    'idp.arch.secretFlow.heading': 'Zero-Trust Secret Lifecycle & Cryptography',
    'idp.arch.secretFlow.caption': 'Age envelope encryption, in-memory derivation, and ephemeral Kubernetes projections.',
    'idp.arch.secretFlow.legend': 'No plaintext credentials ever touch version control or developer disks. Sensitive configurations are encrypted at rest using Age asymmetric keys through Mozilla SOPS. When deployed, toolkit secrets streams and decrypts the envelopes entirely in volatile memory, executes one-way cryptographic key derivation (Argon2id for Authelia user databases and bcrypt for Argo CD administrative access), and creates namespace-scoped Kubernetes Secret resources. Workload containers mount credentials exclusively via memory-backed tmpfs projections to guarantee zero disk persistence and prevent inadvertent secret exposure.',
    'idp.arch.source': 'Reconciled from mlorentedev/kubelab · custom.js operational architecture · zero-addressing compliant (ADR-056 §3)',

    // Lab teaser (section 08)
    'lab.idp.heading': 'Internal Developer Platform (IDP) Catalog',
    'lab.idp.intro': 'The operational cockpit and tooling suite: live cloud infrastructure spend, incident runbooks, security posture, and upstream dependencies.',
    'lab.idp.cta': 'Explore full IDP catalog',
    'lab.idp.spendLabel': 'Monthly Cloud Spend',
    'spend.basis': '{month}, from list prices and bills',
    'spend.perMonth': '/mo',
    'lab.idp.categoriesLabel': 'Operational Domains',
    'lab.idp.categoriesValue': 'Ops · Triage · Security · Tools · Status · Docs',

    // Lab diagrams (WEB-080). The prose lives here rather than inside the SVG:
    // one IR serves both locales, so node labels stay as identifiers — machine
    // names, protocols, environments — and every sentence a reader has to
    // understand is translated out here (proposal, Risk §1).
    'lab.diagram.topology.heading': 'Where everything runs',
    'lab.diagram.flows.heading': 'How a change reaches production',
    'lab.diagram.topology.caption':
      'All {n} machines. The reserve on AWS is listed above and not drawn, because it only exists while Terraform has it provisioned. The {k8s} that run K3s each run a single-node cluster, with no shared control plane.',
    'lab.diagram.topology.legend':
      'The resolver, the monitor and the forge sit deliberately outside Kubernetes: each has to keep working while the platform is broken. A WireGuard mesh ties the fleet together with no inbound ports open.',
    'lab.diagram.flows.caption':
      'One push to master produces one multi-arch image. Staging runs it unattended; production runs the same bytes only once a release pull request merges.',
    'lab.diagram.flows.legend':
      'Promotion re-tags a digest rather than rebuilding, so what production serves is what staging validated. Argo CD reconciles both clusters from Git — nothing is pushed to them.',

    // Lab sections (WEB-080). The register is the FAQ's — what is actually
    // true and why it was done that way — not infrastructure marketing.
    //
    // The hero and story strings are carried over from `idp.*` **verbatim**:
    // `context.md` records the hero wording as blocked on #182, whose three
    // positioning options were produced and then lost. Restructuring the markup
    // does not need that answer; rewriting the sentences does.
    // A section name, not a second label: the label is the home eyebrow (WEB-137).
    'proof.heading': 'The proof',
    'proof.problem': 'Whose problem',
    'proof.constraint': 'The constraint',
    'proof.result': 'Measured result',
    'proof.verify': 'Where to verify',
    'proof.measured': 'Measured in',

    'lab.hero.eyebrow': 'Where my AI agents run',
    'lab.hero.title': 'KubeLab Platform & Engineering Cockpit',
    'lab.hero.description':
      'The 24/7 hybrid cloud and bare-metal infrastructure platform powering my autonomous AI agents, edge inference, and GitOps workflows.',

    'lab.story.heading': 'The Engineering Foundry Behind Every Product',
    'lab.story.p1':
      'KubeLab is the operating foundation behind every project, open-source tool, and product showcased across this portfolio (including Pollex, Hive MCP, KubeLab Platform API, and this Astro website). It runs on rented machines at Hetzner Cloud (Germany) and Google Cloud and on a bare-metal homelab in the USA, as independent single-node K3s clusters.',
    'lab.story.p2':
      'Nothing shown here is an isolated mockup or tutorial demo: every workload is built, tested in staging, secured behind Zero-Trust authentication, and operated 24/7 through immutable GitOps pipelines.',
    'lab.pillar.gitops': 'Reproducible GitOps',
    'lab.pillar.gitopsDesc': 'Infrastructure as code with Ansible, Terraform and K3s. Argo CD reconciles the clusters against Git.',
    'lab.pillar.privacy': 'Edge AI & Privacy',
    'lab.pillar.privacyDesc': 'Local LLM inference on a Jetson Nano. The prompt never leaves the house.',
    'lab.pillar.memory': 'Agent memory',
    'lab.pillar.memoryDesc': 'Hive MCP AST RAG serving AI agents only the context a task needs.',

    'lab.services.heading': 'Services, and who can reach them',
    'lab.services.intro':
      'Each row says who can reach the service, measured from outside the mesh. Only the mesh-only ones stay off the internet: there are zero port-forwarding rules on my residential USA network, so for those there is no address to expose in the first place.',
    'lab.services.count': '{n} documented here',
    'lab.services.th.status': 'Status',
    'lab.services.th.service': 'Service',
    'lab.services.th.category': 'Category',
    'lab.services.th.access': 'Access',
    'lab.services.th.node': 'Node',
    'lab.services.th.endpoint': 'Endpoint',
    'lab.services.th.description': 'Description & Stack',

    // One name per concept: Services and AI & Automations both state an access
    // boundary, so the strings live above either section rather than twice.
    'lab.access.public': 'Public',
    'lab.access.mesh': 'Mesh only',
    'lab.access.authelia': 'Behind Authelia',
    'lab.access.appLogin': 'Own login',
    'lab.access.onDemand': 'On demand',
    'lab.access.onDemandHint': 'Its machine is switched on only when needed. While it sleeps, the service does not answer.',
    'lab.services.measured': 'Access measured from outside the mesh on',
    'lab.access.private': 'Private repo',

    'lab.infra.heading': 'The machines underneath',
    'lab.infra.intro':
      '{n} machines: {rented} rented from {providers} cloud providers and {home} sitting in my house, plus {reserve} reserve on AWS that Terraform recreates when it is needed. Only {k8s} of them run Kubernetes, each as its own single-node cluster rather than part of a shared one — a shared control plane that can take the whole fleet down with it is not a homelab, it is one failure with extra steps.',
    'lab.infra.count': '{n} machines · {k8s} independent K3s clusters · {reserve} reserve',

    // Status is prose, not an identifier. `k3s`, `ARM64` and `docker` stay as
    // they are on both locales because they are names; `healthy` and `standby`
    // are English adjectives describing a state, and rendering them raw left
    // the Spanish page saying `standby` in English.
    'lab.status.healthy': 'healthy',
    'lab.status.warning': 'degraded',
    'lab.status.offline': 'offline',
    'lab.status.standby': 'reserve',
    'lab.status.operational': 'operational',
    'lab.status.degraded': 'degraded',
    'lab.status.maintenance': 'maintenance',

    'lab.diagram.source': 'Rendered at build from {file}',
    'lab.diagram.scroll': 'Scrollable diagram: {label}',
    'lab.provenance': 'Figures last reconciled against the cluster on',

    // Home sections
    'home.stack': 'What I work with',
    'home.skills': 'What I do',

    // Projects
    'projects.viewProject': 'View project',

    // Experience timeline (WEB-012)
    'home.experience': 'My path',
    'home.latest': 'Latest notes',
    'home.allNotes': 'All notes',

    // Subscribe form (WEB-083)
    'subscribe.placeholder': 'you@email.com',
    'subscribe.successText': 'Done! Check your email.',
    'subscribe.errorText': 'Please enter a valid email.',
    'subscribe.consentText': 'Please accept the privacy policy to continue.',
    'subscribe.consentPrefix': 'I agree to the',
    'subscribe.privacyPolicy': 'privacy policy',
    'subscribe.buttonSuccess': 'Received',
    'subscribe.networkError': 'Error. Please try again.',

    // Notes page
    'notes.title': 'Notes',
    'notes.description': 'Platform engineering notes — from hardware to Kubernetes.',
    'notes.articles': 'What I think',
    'notes.empty': 'Coming soon.',
    'notes.all': 'All notes',

    // Note detail
    'note.prev': 'Previous',
    'note.next': 'Next',

    // The exit at the end of a note (WEB-090). Says what the notes are; it does
    // not restate the hero, which is still being decided.
    'note.closing.eyebrow': 'Who writes this',
    'note.closing.body':
      'I am Manu Lorente. These notes come out of a platform I run, break and repair myself — the hardware is in my house and the postmortems are mine. If something here is close to a problem you have, I would rather hear about it than guess.',
    'note.closing.contact': 'Tell me what you are building',
    'note.closing.feed': 'Or follow the feed',

    // Tags
    'tags.projects': 'Projects',
    'tags.notes': 'Notes',
    'tags.all': 'All notes',

    // Meta
    'meta.title': 'Manu Lorente — Infrastructure for AI agents, from the metal up',
    'meta.description':
      'The infrastructure under the agents, not the prompts on top. Kubernetes on hardware I own — mesh, split DNS, GitOps. The homelab is the proof.',
    'meta.ghchart.alt': "Manu's GitHub contribution chart",
  },
  es: {
    // Nav
    'nav.ai': 'IA',
    'nav.lab': 'Lab',
    'nav.notes': 'Notas',
    'nav.contact': 'Contacto',
    'nav.skipToContent': 'Saltar al contenido',
    'footer.email': 'Correo electrónico',

    // AI Section
    'ai.hero.eyebrow': 'Cómo trabajo con agentes de IA',
    'ai.hero.title': 'Las reglas con las que trabajan mis agentes de IA, y qué las hace cumplir',
    'ai.hero.description':
      'Un modelo de lenguaje se equivoca de formas que nadie puede prever, así que lo que mantiene a raya a un agente no es el prompt. Las reglas: cada agente trabaja en su propia copia de Git (un worktree), los secretos se borran de su salida antes de guardar nada, un segundo modelo revisa cada pull request y nada de lo que escribe un agente se fusiona sin que yo lo haya leído.',
    'ai.diagram.heading': 'Plano de Ejecución de Agentes Autónomos',
    'ai.diagram.caption':
      'Despacho de tareas, recuperación de conocimiento vía FastMCP, ejecución aislada en worktrees y revisión adversarial.',
    'ai.diagram.legend':
      'Cada operación del agente corre en un Git worktree aislado. Las acciones destructivas activan una puerta HITL sincrónica. Las PRs son auditadas por una familia de modelos independiente antes de la revisión humana.',
    'ai.hero.pill.attribution': 'Sin atribución a la IA',
    'ai.hero.pill.flock': 'Bloqueo con flock',
    'ai.hero.pill.worktrees': 'Copias de trabajo efímeras',
    'ai.hero.pill.redactor': 'Redactor de secretos',
    'ai.pillars.badge.isolation': 'Aislamiento',
    'ai.pillars.badge.security': 'Seguridad',
    'ai.pillars.badge.safety': 'Salvaguardas',
    'ai.pillars.badge.verification': 'Verificación',
    'ai.pillars.heading': 'Cuatro reglas, cada una con un mecanismo detrás',
    'ai.pillars.sub': 'Ninguna depende de que el modelo se porte bien: cada una es un cerrojo, un filtro, un límite o una revisión.',
    'ai.pillars.p1.title': 'Aislamiento y Concurrencia a Nivel de OS',
    'ai.pillars.p1.desc':
      'Worktrees efímeros sobre el pool de objetos .git/objects. Semáforos flock a nivel de kernel previenen colisiones de ramas y condiciones de carrera entre agentes concurrentes.',
    'ai.pillars.p1.i1': 'Aislamiento por pool de objetos compartidos',
    'ai.pillars.p1.i2': 'Semáforos flock a nivel de kernel',
    'ai.pillars.p1.i3': 'Límites de tiempo monótonos anti-bloqueo',
    'ai.pillars.p2.title': 'Redacción de Secretos en Flujo e Inyección JIT',
    'ai.pillars.p2.desc':
      'Filtro en tiempo real que purga stdout/stderr antes de persistir transcripciones. Cero secretos en texto plano: descifrado Age/SOPS inyectado estrictamente en memoria.',
    'ai.pillars.p2.i1': 'Filtro redactWriter en memoria',
    'ai.pillars.p2.i2': 'Cifrado asimétrico Age/SOPS',
    'ai.pillars.p2.i3': 'Parada inmediata ante cualquier fuga',
    'ai.pillars.p3.title': 'Frenos de Seguridad y Cap Atómico de PR',
    'ai.pillars.p3.desc':
      'Disyuntor dinámico de bucles en AST para frenar recursiones. Puerta HITL criptográfica sincrónica para comandos destructivos y límite estricto de ~300 LOC ejecutables.',
    'ai.pillars.p3.i1': 'Disyuntor dinámico de bucles en herramientas',
    'ai.pillars.p3.i2': 'Puerta de aprobación humana sincrónica',
    'ai.pillars.p3.i3': 'Presupuesto de ~300 LOC ejecutables por PR',
    'ai.pillars.p4.title': 'Auditoría Adversarial Cruzada y Cero Auto-Merge',
    'ai.pillars.p4.desc':
      'Familia de modelos independiente auditando cada diff para eliminar condescendencia. Prohibición estricta de auto-merge: todo cambio se fusiona bajo supervisión humana.',
    'ai.pillars.p4.i1': 'Revisión de diffs por modelos independientes',
    'ai.pillars.p4.i2': 'Doctrina estricta de cero auto-merge',
    'ai.pillars.p4.i3': 'Suites de regresión y mutación en CI',
    'ai.artifacts.heading': 'Las reglas, citadas de sus ficheros',
    'ai.artifacts.sub':
      'Cuatro extractos, cada uno citado palabra por palabra de un fichero público y enlazado a la versión de la que se tomó.',
    'ai.automations.heading': 'Flota Autónoma y Automatizaciones',
    'ai.automations.intro':
      'Los agentes en producción, los protocolos que usan, los enrutadores de eventos y los sumideros de telemetría que funcionan en el clúster. La mayoría opera dentro de la malla — lo que ves aquí es el inventario real y los contratos de acceso.',
    'ai.automations.count': '{n} entradas · {reachable} que puedes abrir desde aquí',
    'ai.automations.link': 'abrir',
    'ai.automations.source': 'Migrado de {repo} · {commit}',

    // Hero
    'hero.eyebrow': 'Ingeniero del silicio a la nube',
    'hero.title': 'La infraestructura de debajo de los agentes, no los prompts de encima',
    'hero.subtitle':
      'Casi todo el que construye para agentes de IA llega desde el lado de la aplicación. Yo llego desde el metal — Kubernetes sobre hardware que es mío, malla, DNS partido, GitOps que reconcilia en menos de treinta segundos. Ahí es donde corren ahora mis propios agentes, bajo un harness con límites duros. La plataforma de agentes es lo que estoy construyendo encima.',
    'door.cta': 'Cuéntame qué tiene que funcionar',
    'door.subject': 'Qué tiene que funcionar',
    'door.body': 'Qué tiene que funcionar:\nQué hay ya en producción:\nPara cuándo lo necesitas:\n',
    'door.busy': 'Ahora mismo en un proyecto; el siguiente arranca en {month}.',
    'hero.story': 'Lee mi historia',

    // IDP Catalog (KubeLab IDP)
    'idp.catalog.title': 'KubeLab IDP · Catálogo de Control Plane y Herramientas',
    'idp.catalog.description': 'Catálogo operativo público, costes de infraestructura, observabilidad y herramientas de plataforma.',
    'idp.catalog.eyebrow': 'Plataforma interna de desarrollo',
    'idp.catalog.backToLab': 'Volver al Lab de Plataforma',
    'idp.catalog.intro': 'La plataforma de desarrollo interna que da soporte a los agentes autónomos, reconciliación GitOps y cargas edge. Costes cloud transparentes, runbooks de incidentes, postura de seguridad y herramientas core.',
    'idp.catalog.stats': '{categories} dominios operativos · {items} componentes de plataforma',
    'idp.catalog.spendLabel': 'gasto cloud mensual',
    'idp.catalog.source': 'Reconciliado desde {repo} · commit {commit}',
    'idp.access.public': 'Público',
    'idp.access.auth': 'Autenticado (IAM)',
    'idp.access.local': 'Bóveda local',
    'idp.action.open': 'Abrir recurso',
    'idp.why.auth': 'Requiere mi cuenta en el proveedor',
    'idp.why.local': 'Una bóveda local en mi portátil',
    'idp.why.platform': 'Enlazado desde Servicios en el Lab',

    // IDP Architecture
    'idp.nav.sections': 'Secciones del IDP',
    'idp.nav.catalog': 'Catálogo y Herramientas',
    'idp.nav.architecture': 'Flujos Operativos',
    'idp.arch.title': 'KubeLab IDP · Flujos Operativos y Arquitectura de Petición',
    'idp.arch.description': 'Enrutamiento público de peticiones, WAF perimetral, autenticación forward y pipeline de telemetría.',
    'idp.arch.eyebrow': 'Plataforma interna de desarrollo',
    'idp.arch.backToIdp': 'Volver al Catálogo IDP',
    'idp.arch.intro': 'Visualización del ciclo de vida de peticiones en defensa en profundidad: desde el edge Anycast y WAF de Cloudflare, pasando por el ingress Traefik y autenticación forward con Authelia, hasta las cargas de trabajo en contenedores y la telemetría en Loki.',
    'idp.arch.requestPath.heading': 'Ruta de Petición y Defensa en Profundidad',
    'idp.arch.requestPath.caption': 'Enrutamiento perimetral en doble capa, autenticación forward zero-trust y registro estructurado.',
    'idp.arch.requestPath.legend': 'Cada petición HTTP entrante termina TLS en el borde perimetral de Cloudflare antes de alcanzar el host de producción en Hetzner mediante un túnel de origen cifrado. Traefik valida las cabeceras de host, consulta al motor de seguridad CrowdSec para verificar inteligencia de amenazas conocidas y delega la autenticación de rutas privadas a Authelia mediante el middleware ForwardAuth. Los registros de contenedores viajan a través de Vector directamente hacia Loki sin exponer las interioridades del clúster ni los endpoints de métricas al internet público.',
    'idp.arch.gitops.heading': 'Entrega Continua y Malla GitOps',
    'idp.arch.gitops.caption': 'Reconciliación automatizada hub-and-spoke sobre túneles privados WireGuard.',
    'idp.arch.gitops.legend': 'El código fuente y los manifiestos declarativos residen en GitHub como única fuente de verdad. La integración continua compila imágenes multi-arquitectura y publica digests inmutables en Docker Hub y GHCR. Argo CD opera como un hub de plano de control aislado en GCP, renderizando overlays de Kustomize específicos por entorno y reconciliando los clústeres spoke en cloud VPS y homelab bare-metal mediante túneles privados WireGuard en Tailscale sin exponer el puerto 6443 de la API de Kubernetes al internet público.',
    'idp.arch.secretFlow.heading': 'Ciclo de Vida de Secretos Zero-Trust y Criptografía',
    'idp.arch.secretFlow.caption': 'Cifrado de sobre con Age, derivación en memoria y proyecciones efímeras en Kubernetes.',
    'idp.arch.secretFlow.legend': 'Ninguna credencial en texto claro toca jamás el control de versiones ni los discos locales. Las configuraciones sensibles se cifran en reposo mediante claves asimétricas de Age a través de Mozilla SOPS. En el despliegue, toolkit secrets procesa y descifra los sobres íntegramente en memoria volátil, aplica derivación criptográfica unidireccional (Argon2id para bases de datos de Authelia y bcrypt para el acceso de administración de Argo CD) y genera objetos K8s Secret con ámbito estricto de namespace. Los contenedores montan las credenciales exclusivamente mediante proyecciones tmpfs en memoria para garantizar cero persistencia en disco y evitar fugas involuntarias.',
    'idp.arch.source': 'Reconciliado desde mlorentedev/kubelab · arquitectura operativa custom.js · conforme con zero-addressing (ADR-056 §3)',

    // Lab teaser (section 08)
    'lab.idp.heading': 'Catálogo de la plataforma interna de desarrollo (IDP)',
    'lab.idp.intro': 'El cockpit operativo y suite de herramientas: costes reales de infraestructura cloud, runbooks de incidentes, postura de seguridad y dependencias upstream.',
    'lab.idp.cta': 'Explorar catálogo IDP completo',
    'lab.idp.spendLabel': 'Coste Cloud Mensual',
    'spend.basis': '{month}, según precios de lista y facturas',
    'spend.perMonth': '/mes',
    'lab.idp.categoriesLabel': 'Dominios Operativos',
    'lab.idp.categoriesValue': 'Ops · Triage · Seguridad · Herramientas · Estado · Docs',

    // Diagramas del Lab (WEB-080). La prosa vive aquí y no dentro del SVG: un
    // único IR sirve a los dos idiomas, así que las etiquetas de los nodos se
    // quedan como identificadores — nombres de máquina, protocolos, entornos —
    // y todo lo que hay que entender se traduce aquí (propuesta, Riesgo §1).
    'lab.diagram.topology.heading': 'Dónde corre cada cosa',
    'lab.diagram.flows.heading': 'Cómo llega un cambio a producción',
    'lab.diagram.topology.caption':
      'Las {n} máquinas. La reserva en AWS aparece en la lista de arriba pero no en el dibujo, porque solo existe mientras Terraform la tiene aprovisionada. Las {k8s} que ejecutan K3s tienen cada una un clúster de un solo nodo, sin plano de control compartido.',
    'lab.diagram.topology.legend':
      'El resolutor, el monitor y la forja se quedan fuera de Kubernetes a propósito: cada uno tiene que seguir funcionando mientras la plataforma está rota. Una malla WireGuard une la flota sin abrir ningún puerto de entrada.',
    'lab.diagram.flows.caption':
      'Un push a master produce una única imagen multiarquitectura. Staging la ejecuta sin intervención; producción ejecuta esos mismos bytes solo cuando se mergea una pull request de release.',
    'lab.diagram.flows.legend':
      'La promoción reetiqueta un digest en lugar de reconstruir, así que lo que sirve producción es lo que validó staging. Argo CD reconcilia ambos clústeres desde Git: no se despliega nada contra ellos.',

    // Secciones del Lab (WEB-080). El registro es el de las FAQ — lo que es
    // verdad y por qué se hizo así — no marketing de infraestructura.
    //
    // El hero y la historia se traen de `idp.*` **literales**: la redacción está
    // bloqueada por #182, cuyas tres opciones de posicionamiento se produjeron y
    // se perdieron. Reestructurar el markup no necesita esa respuesta; reescribir
    // las frases sí.
    'proof.heading': 'La prueba',
    'proof.problem': 'De quién era el problema',
    'proof.constraint': 'Qué lo limitaba',
    'proof.result': 'Resultado medido',
    'proof.verify': 'Dónde comprobarlo',
    'proof.measured': 'Medido en',

    'lab.hero.eyebrow': 'Donde corren mis agentes de IA',
    'lab.hero.title': 'Plataforma KubeLab y Cockpit de Ingeniería',
    'lab.hero.description':
      'La plataforma híbrida en la nube y bare-metal que opera 24/7 mis agentes de IA autónomos, inferencia edge y flujos GitOps.',

    'lab.story.heading': 'La Fábrica de Ingeniería Detrás de Cada Producto',
    'lab.story.p1':
      'KubeLab es la base operativa sobre la que he construido, probado y desplegado cada proyecto, herramienta open-source y producto de mi portfolio (incluyendo Pollex, Hive MCP Server, la API de KubeLab y esta misma web en Astro). Funciona sobre máquinas alquiladas en Hetzner Cloud (Alemania) y Google Cloud y sobre un homelab bare-metal en EE. UU., como clústeres K3s independientes de un solo nodo.',
    'lab.story.p2':
      'Nada de lo que muestro es una demo aislada de tutorial: cada carga de trabajo se compila en local, se valida en staging, se protege con autenticación Zero-Trust y se opera 24/7 mediante pipelines GitOps inmutables.',
    'lab.pillar.gitops': 'GitOps Reproducible',
    'lab.pillar.gitopsDesc': 'Infraestructura como código con Ansible, Terraform y K3s. Argo CD reconcilia los clústeres con Git.',
    'lab.pillar.privacy': 'Edge AI y Privacidad',
    'lab.pillar.privacyDesc': 'Inferencia LLM local en una Jetson Nano. El prompt no sale de casa.',
    'lab.pillar.memory': 'Memoria de los agentes',
    'lab.pillar.memoryDesc': 'RAG AST en Hive MCP que da a los agentes solo el contexto que necesita cada tarea.',

    'lab.services.heading': 'Servicios, y quién puede llegar a ellos',
    'lab.services.intro':
      'Cada fila dice quién puede llegar al servicio, medido desde fuera de la malla. Solo los de la malla quedan fuera de internet: no hay una sola regla de port-forwarding en mi red residencial de Estados Unidos, así que para esos no hay ni dirección que exponer.',
    'lab.services.count': '{n} documentados aquí',
    'lab.services.th.status': 'Estado',
    'lab.services.th.service': 'Servicio',
    'lab.services.th.category': 'Categoría',
    'lab.services.th.access': 'Acceso',
    'lab.services.th.node': 'Nodo',
    'lab.services.th.endpoint': 'Dirección',
    'lab.services.th.description': 'Descripción y Stack',

    // Un solo nombre por concepto: Servicios e IA y automatizaciones declaran
    // ambos un límite de acceso, así que las cadenas viven por encima de las dos
    // secciones en vez de estar duplicadas.
    'lab.access.public': 'Público',
    'lab.access.mesh': 'Solo malla',
    'lab.access.authelia': 'Tras Authelia',
    'lab.access.appLogin': 'Login propio',
    'lab.access.onDemand': 'Bajo demanda',
    'lab.access.onDemandHint': 'Su máquina solo se enciende cuando hace falta. Mientras duerme, el servicio no responde.',
    'lab.services.measured': 'Acceso medido desde fuera de la malla el',
    'lab.access.private': 'Repo privado',

    'lab.infra.heading': 'Las máquinas de debajo',
    'lab.infra.intro':
      '{n} máquinas: {rented} alquiladas a {providers} proveedores en la nube y {home} en mi casa, más {reserve} de reserva en AWS que Terraform recrea cuando hace falta. Solo {k8s} ejecutan Kubernetes, cada una como su propio clúster de un solo nodo en vez de formar parte de uno compartido: un plano de control compartido que puede llevarse por delante toda la flota no es un homelab, es un único punto de fallo con pasos de más.',
    'lab.infra.count': '{n} máquinas · {k8s} clústeres K3s independientes · {reserve} de reserva',

    // El estado es prosa, no un identificador. `k3s`, `ARM64` y `docker` se
    // quedan igual en los dos idiomas porque son nombres; `healthy` y `standby`
    // son adjetivos ingleses que describen un estado, y renderizarlos crudos
    // dejaba la página española diciendo `standby` en inglés.
    'lab.status.healthy': 'operativo',
    'lab.status.warning': 'degradado',
    'lab.status.offline': 'caído',
    'lab.status.standby': 'en reserva',
    'lab.status.operational': 'operativo',
    'lab.status.degraded': 'degradado',
    'lab.status.maintenance': 'en mantenimiento',

    'lab.diagram.source': 'Generado en el build desde {file}',
    'lab.diagram.scroll': 'Diagrama desplazable: {label}',
    'lab.provenance': 'Cifras reconciliadas contra el clúster por última vez el',

    // Home sections
    'home.stack': 'Con qué trabajo',
    'home.skills': 'Qué hago',

    // Projects
    'projects.viewProject': 'Ver proyecto',

    // Experience timeline (WEB-012)
    'home.experience': 'Mi camino',
    'home.latest': 'Últimas notas',
    'home.allNotes': 'Todas las notas',

    // Subscribe form (WEB-083)
    'subscribe.placeholder': 'tu@email.com',
    'subscribe.successText': '¡Listo! Revisa tu email.',
    'subscribe.errorText': 'Por favor, introduce un email válido.',
    'subscribe.consentText': 'Necesito que aceptes la política de privacidad para poder escribirte.',
    'subscribe.consentPrefix': 'Acepto la',
    'subscribe.privacyPolicy': 'política de privacidad',
    'subscribe.buttonSuccess': 'Recibido',
    'subscribe.networkError': 'Error. Inténtalo de nuevo.',

    // Notes page
    'notes.title': 'Notas',
    'notes.description': 'Notas de ingeniería de plataformas — del hardware a Kubernetes.',
    'notes.articles': 'Lo que pienso',
    'notes.empty': 'Próximamente.',
    'notes.all': 'Todas las notas',

    // Note detail
    'note.prev': 'Anterior',
    'note.next': 'Siguiente',

    'note.closing.eyebrow': 'Quién escribe esto',
    'note.closing.body':
      'Soy Manu Lorente. Estas notas salen de una plataforma que opero, rompo y arreglo yo — el hardware está en mi casa y los postmortems son míos. Si algo de aquí se parece a un problema que tengas, prefiero que me lo cuentes a suponerlo.',
    'note.closing.contact': 'Cuéntame qué estás construyendo',
    'note.closing.feed': 'O sigue el feed',

    // Tags
    'tags.projects': 'Proyectos',
    'tags.notes': 'Notas',
    'tags.all': 'Todas las notas',

    // Meta
    'meta.title': 'Manu Lorente — Infraestructura para agentes de IA, desde el metal',
    'meta.description':
      'La infraestructura de debajo de los agentes, no los prompts de encima. Kubernetes sobre hardware que es mío — malla, DNS partido, GitOps. El homelab es la prueba.',
    'meta.ghchart.alt': 'Contribuciones de Manu en GitHub',
  },
} as const;
