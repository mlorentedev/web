/**
 * The artifact cards on /ai (WEB-091): each quotes a public file, verbatim.
 *
 * `codeSnippet` is whole lines of the file at `commit`, in runs separated by an
 * elision line `[…]`. `tests/ai-artifact-excerpts.test.mjs` checks every run
 * against a pinned copy of that blob, so change `commit` and the fixture together.
 */

export interface AiArtifact {
  id: string;
  badge: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  language: string;
  /** `owner/name` of a public GitHub repository. */
  repo: string;
  /** The full commit the snippet was taken from; the link points at it. */
  commit: string;
  path: string;
  codeSnippet: string;
}

/** The file as the card names it: repository, then path. */
export function sourceLabel(artifact: AiArtifact): string {
  return `${artifact.repo.split('/')[1]}/${artifact.path}`;
}

/** The permalink to the quoted file at the commit it was quoted from. */
export function sourceHref(artifact: AiArtifact): string {
  return `https://github.com/${artifact.repo}/blob/${artifact.commit}/${artifact.path}`;
}

export const aiArtifacts: AiArtifact[] = [
  {
    id: 'doctrine',
    badge: 'Doctrine',
    title: 'The rules every agent session loads',
    titleEs: 'Las reglas que carga cada sesión de agente',
    description: "The operating rules the dotfiles harness compiles into every agent's instructions: no AI attribution, no auto-merge, and every environment change written as code and verified idempotent.",
    descriptionEs: 'Las reglas de trabajo que el arnés de dotfiles compila en las instrucciones de cada agente: sin atribución a la IA, sin fusión automática, y todo cambio de entorno escrito como código y comprobado idempotente.',
    language: 'markdown',
    repo: 'mlorentedev/dotfiles',
    commit: '3c2e393e9fdfbc3b3aa89f2e0b40f90cb62aae4f',
    path: 'AGENTS.md',
    codeSnippet: `- **No AI attribution** in git history or GitHub messages (commits, PRs, issues).
- No \`Co-Authored-By\` trailers referencing AI agents.
- No bot-style emojis or "Generated with" footers.
- All artifacts must appear human-authored.
[…]
- **Auto-merge is forbidden in every repository.** Never run \`gh pr merge --auto\`, never enable "Auto-merge" in the GitHub UI, and keep the repo setting \`allow_auto_merge=false\`. Auto-merge lands a PR the instant CI goes green — bypassing the human review gate in §1.
[…]
- **Zero manual operations:** Never perform ad-hoc manual changes on remote systems, servers, or cloud environments.
- **Strict IaC & Idempotence:** Every configuration or environment change MUST be codified as reproducible IaC (Ansible, Terraform, K8s manifests, dotfiles) and verified idempotent (\`changed=0\` on re-run).`,
  },
  {
    id: 'reviewer-pool',
    badge: 'Verification',
    title: 'Which models may sign an adversarial review',
    titleEs: 'Qué modelos pueden firmar una revisión adversarial',
    description: 'An ordered allow-list of reviewer models. None of them is an Anthropic model, because Claude writes nearly every change: the reviewer must not be the implementer.',
    descriptionEs: 'Una lista ordenada de los modelos que pueden revisar. Ninguno es de Anthropic, porque Claude escribe casi todos los cambios: quien revisa no puede ser quien implementa.',
    language: 'json',
    repo: 'mlorentedev/kubelab',
    commit: 'b7d0ae471464c144b604bbe04fe33aef5785a155',
    path: 'harness/reviewer-pool.json',
    codeSnippet: `    "Standing rule: an adversarial review never runs on an Anthropic model. The",
    "reviewer must not be the implementer, and Claude implements nearly every",
    "change in this repo — BUG-074 was reviewed twice by claude-opus-5 before",
    "anyone noticed, which is the incident this file exists to prevent.",
[…]
  "pool": [
    {
      "id": "nan/deepseek-v4-flash",
      "runner": "pi",
      "provider": "nan",
      "model": "deepseek-v4-flash",
      "role": "primary",
[…]
    {
      "id": "agy/gemini-3.1-pro-high",
      "runner": "agy",
      "model": "gemini-3.1-pro-high",
      "role": "fallback",`,
  },
  {
    id: 'review-attestation',
    badge: 'Governance',
    title: 'Did a review actually happen?',
    titleEs: '¿Hubo de verdad una revisión?',
    description: 'The gate that decides whether a pull request was reviewed. It never asks who reviewed it, and it tells a reviewer\'s "I could not review" notice apart from a review.',
    descriptionEs: 'La puerta que decide si un cambio fue revisado. No pregunta quién lo revisó, y distingue el aviso de un revisor que no pudo revisar de una revisión.',
    language: 'json',
    repo: 'mlorentedev/kubelab',
    commit: '2b7304a22ea1d9175d172bf06841cd964478ce83',
    path: 'harness/review-attestation.json',
    codeSnippet: `    "The gate asks ONE question: did a review actually happen? It never asks who",
    "performed it or how good it was. A human review attests exactly as well as a",
    "bot's.",
[…]
    {
      "login": "coderabbitai",
      "declined_markers": [
        "rate limited by coderabbit.ai"
      ],
      "review_markers": [
        "No actionable comments were generated in the recent review"
      ],`,
  },
  {
    id: 'gitops-delivery',
    badge: 'Architecture',
    title: 'Code in one repo, deployment in another (ADR-053)',
    titleEs: 'El código en un repositorio, el despliegue en otro (ADR-053)',
    description: 'Each product repo builds an immutable sha-tagged image and fires a repository_dispatch to kubelab, which promotes it. Polling the registry was considered and rejected.',
    descriptionEs: 'Cada repositorio de producto construye una imagen inmutable etiquetada con su sha y avisa a kubelab con un repository_dispatch; kubelab la promociona. Sondear el registro se valoró y se descartó.',
    language: 'markdown',
    repo: 'mlorentedev/kubelab',
    commit: '11389d3cb11950015bd7628a939318b410261aa6',
    path: 'docs/adr/adr-053-platform-product-repos.md',
    codeSnippet: `# ADR-053: Platform↔Product Repository Structure & Deployment Topology
[…]
2. **Image promotion is push, event-driven — never polling.**
   - Each product's CI publishes an immutable \`sha-<short>\` image, then fires a **\`repository_dispatch\`** to kubelab, whose workflow runs \`toolkit deployment promote\` (ADR-046).
   - **Rejected — registry polling** (Argo CD Image Updater *or* an n8n registry poller). It reintroduces exactly what ADR-046 descoped (#692): a pull loop and non-git-honest state; for n8n it would also put a non-critical service on the delivery path (n8n down → no deploys). We control the image producers, so push is strictly better than pull.`,
  },
];
