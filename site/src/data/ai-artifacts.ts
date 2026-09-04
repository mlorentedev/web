/**
 * The AI Harness Artifacts & Protocols (WEB-091).
 *
 * Real, inspectable execution contracts, OS concurrency primitives,
 * in-stream secret redactors, and adversarial reviewer prompts.
 */

export interface AiArtifact {
  id: string;
  badge: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  language: string;
  filename: string;
  codeSnippet: string;
  gistUrl: string;
}

export const aiArtifacts: AiArtifact[] = [
  {
    id: 'doctrine',
    badge: 'Doctrine',
    title: 'Harness Non-Negotiables & Standing Orders',
    titleEs: 'Doctrina del Arnés y Órdenes Permanentes',
    description: 'Core invariants governing all agents: zero AI attribution, atomic commits under ~300 LOC, forbidden auto-merge, and in-flight documentation.',
    descriptionEs: 'Invariantes nucleares para todo agente: cero atribución de IA, commits atómicos bajo ~300 LOC, prohibición estricta de auto-merge y deuda técnica cero.',
    language: 'markdown',
    filename: 'AGENTS.md',
    codeSnippet: `## Non-negotiable rules (harness-enforced)

- No AI attribution in git history or GitHub messages (commits, PRs, issues).
- No Co-Authored-By trailers referencing AI agents. All artifacts appear human-authored.
- English only in durable records (commits, PR titles, code comments).
- Auto-merge is strictly forbidden in every repository. Merge is a supervised human action.
- Strict IaC & Idempotence: zero manual operations on remote systems or cloud environments.
- Atomic PRs: ~300 executable LOC hard cap to maintain human reviewability.
- In-flight documentation & zero debt: ADRs and lessons recorded in real time.`,
    gistUrl: 'https://github.com/mlorentedev/web/blob/master/AGENTS.md'
  },
  {
    id: 'reviewer-pool',
    badge: 'Verification',
    title: 'Multi-Model Adversarial Reviewer Pool',
    titleEs: 'Pool Adversarial Multi-Modelo Anti-Sicofancia',
    description: 'Enforces independent model families to audit pull request diffs, systematically rejecting sycophantic self-approvals and unverified completion claims.',
    descriptionEs: 'Fuerza a familias de modelos independientes a auditar diffs de PRs, rechazando auto-aprobaciones complacientes y afirmaciones de cierre sin pruebas.',
    language: 'json',
    filename: 'harness/reviewer-pool.json',
    codeSnippet: `// Standing rule: an adversarial review never runs on the authoring model family.
// The reviewer must not be the implementer (anti-sycophancy invariant).
{
  "pool": [
    {
      "id": "nan/deepseek-v4-flash",
      "runner": "pi",
      "provider": "nan",
      "model": "deepseek-v4-flash",
      "role": "primary"
    }
  ],
  "enforce": "independent-family"
}`,
    gistUrl: 'https://github.com/mlorentedev/kubelab/blob/master/harness/reviewer-pool.json'
  },
  {
    id: 'priority-scale',
    badge: 'Governance',
    title: 'Autonomous Execution Concurrency & Budgeting',
    titleEs: 'Gobernanza de Concurrencia y Presupuesto de Ejecución',
    description: 'Strict concurrency scaling and blast-radius budgeting for autonomous agent swarms, preventing infinite loops and uncontained state mutation.',
    descriptionEs: 'Límites estrictos de concurrencia y radio de impacto para enjambres de agentes, evitando bucles descontrolados y mutaciones de estado no contenidas.',
    language: 'markdown',
    filename: 'harness/priority-scale.md',
    codeSnippet: `# Priority Scale & Concurrency Budgeting

1. Blast-radius containment: max 1 active write-worktree per autonomous agent.
2. Verification gate: zero completion claim without fresh terminal execution logs.
3. PR triage queue: an open PR is incomplete until every reviewer comment is triaged.
4. Circuit breaker: halt execution after 3 recursive unverified tool loops.`,
    gistUrl: 'https://github.com/mlorentedev/kubelab/blob/master/harness/priority-scale.md'
  },
  {
    id: 'gitops-delivery',
    badge: 'Architecture',
    title: 'Two-Repo Immutable GitOps Promotion (ADR-053)',
    titleEs: 'Promoción GitOps Inmutable en Dos Repos (ADR-053)',
    description: 'Decoupled architecture: code builds immutable sha-digest images dispatched to the platform repo, where Argo CD reconciles staging and prod.',
    descriptionEs: 'Arquitectura desacoplada: el código compila imágenes sha inmutables hacia el repo de plataforma, donde Argo CD reconcilia staging y prod sin intervención manual.',
    language: 'markdown',
    filename: 'docs/adr/adr-053-platform-product-repos.md',
    codeSnippet: `# ADR-053: Platform & Product Repos Boundary

- A push to master builds an immutable sha-<short> container image.
- Image pushed to registry fires a repository_dispatch to mlorentedev/kubelab.
- Kubelab receiver runs: toolkit deployment promote --env staging --version sha-<short>.
- Argo CD reconciles drift in <30s. Zero manual kubectl apply in production.`,
    gistUrl: 'https://github.com/mlorentedev/kubelab/blob/master/docs/adr/adr-053-platform-product-repos.md'
  }
];
