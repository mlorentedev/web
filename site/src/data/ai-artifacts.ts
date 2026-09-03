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
    id: 'concurrency-flock',
    badge: 'Concurrency',
    title: 'Kernel POSIX File Semaphore (flock)',
    titleEs: 'Semáforo de Archivo POSIX a Nivel de Kernel',
    description: 'Mutual exclusion primitive preventing concurrent autonomous agents from colliding on worktrees, branches, or shared lockfiles.',
    descriptionEs: 'Primitiva de exclusión mutua que previene colisiones entre agentes concurrentes sobre worktrees, ramas o archivos de bloqueo compartidos.',
    language: 'go',
    filename: 'pkg/semaphore/flock.go',
    codeSnippet: `// AcquireWorktreeLock acquires a non-blocking kernel file lock (flock).
// It retries with a monotonic deadline to prevent race conditions across agents.
func AcquireWorktreeLock(lockPath string, timeout time.Duration) (*os.File, error) {
    file, err := os.OpenFile(lockPath, os.O_CREATE|os.O_RDWR, 0600)
    if err != nil {
        return nil, fmt.Errorf("failed to open lock file %s: %w", lockPath, err)
    }

    deadline := time.Now().Add(timeout)
    for {
        err = syscall.Flock(int(file.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
        if err == nil {
            return file, nil // Lock acquired exclusively
        }
        if time.Now().After(deadline) {
            _ = file.Close()
            return nil, fmt.Errorf("semaphore timeout after %v: %w", timeout, err)
        }
        time.Sleep(50 * time.Millisecond)
    }
}`,
    gistUrl: 'https://gist.github.com/mlorentedev/e71b26850cf9b33a557a16f8623405df'
  },
  {
    id: 'stream-redactor',
    badge: 'Security',
    title: 'In-Stream Secret Redaction (redactWriter)',
    titleEs: 'Redacción de Secretos en Flujo en Tiempo Real',
    description: 'Real-time stream filter intercepting process stdout and stderr, scrubbing cryptographic secrets before they can leak into transcripts or terminals.',
    descriptionEs: 'Filtro en tiempo real que intercepta stdout y stderr, purgando credenciales criptográficas en memoria antes de persistir transcripciones o consolas.',
    language: 'go',
    filename: 'pkg/io/redact_writer.go',
    codeSnippet: `// RedactWriter wraps an io.Writer and intercepts outgoing bytes in memory.
// Known secret patterns are substituted before writing to disk or stdout.
type RedactWriter struct {
    out      io.Writer
    patterns []*regexp.Regexp
}

func (w *RedactWriter) Write(p []byte) (int, error) {
    clean := p
    for _, re := range w.patterns {
        clean = re.ReplaceAll(clean, []byte("[REDACTED_SECRET]"))
    }
    if _, err := w.out.Write(clean); err != nil {
        return 0, err
    }
    // Return original length to satisfy standard io.Writer contract
    return len(p), nil
}`,
    gistUrl: 'https://gist.github.com/mlorentedev/3c7f99114d59a22f46be818a7c2c9d01'
  },
  {
    id: 'adversarial-review',
    badge: 'Verification',
    title: 'Cross-Model Anti-Sycophancy Review Gate',
    titleEs: 'Puerta de Auditoría Adversarial entre Familias de Modelos',
    description: 'Enforces independent model families to audit pull request diffs, systematically rejecting sycophantic self-approvals and unverified completion claims.',
    descriptionEs: 'Fuerza a familias de modelos independientes a auditar los diffs de las PRs, rechazando auto-aprobaciones condescendientes y afirmaciones sin prueba.',
    language: 'markdown',
    filename: 'skills/adversarial-review/SKILL.md',
    codeSnippet: `# Role: Adversarial Reviewer (Independent Model Family)

Operating Invariants:
1. Anti-Sycophancy: You are an independent adversarial auditor. Assume the diff contains
   latent defects, untested regressions, or silent architectural drift.
2. Verification over claims: Never accept "tests pass" without inspecting the test output
   produced during this session. A test checking only happy paths is a critical finding.
3. Strict LOC enforcement: Flag any PR exceeding ~300 executable lines for split.
4. Auto-merge refusal: You have no authority to approve auto-merge. Every disposition
   must be triaged by the human operator under the "## Review triage" header.`,
    gistUrl: 'https://gist.github.com/mlorentedev/9df1b033e5c3e5aa4b840e11894d701e'
  }
];
