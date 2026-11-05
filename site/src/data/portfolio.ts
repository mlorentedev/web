import type { Lang } from '../i18n/ui';

/**
 * Per-language copy for a project card. The only fields that differ between
 * locales — everything else (links, tags, featured) is language-neutral and
 * lives once on `Project`.
 */
export interface ProjectContent {
  /** Project name shown in the card heading (usually a proper noun — same in EN/ES). */
  title: string;
  /** One-to-two sentence pitch: the problem, then what the project does about it. */
  description: string;
  /** One glanceable "hard metric" — the headline proof shown above the description. */
  metric: string;
}

/** A portfolio project: language-neutral metadata + per-language content (WEB-026). */
export interface Project {
  en: ProjectContent;
  es: ProjectContent;
  /**
   * Live demo / project page — preferred target for the card's "View project" link.
   * A site path (`/lab`) is localized and opens in the same tab.
   */
  url?: string;
  /** Source repository — fallback link target when `url` is absent. */
  github?: string;
  /** Language-neutral tags; also drive the `/tags/<tag>` index pages. */
  tags: string[];
  /** Featured projects sort first on the `/projects` page. */
  featured: boolean;
  /** Year of the repository's first commit (#587): when the project started, read from git, never typed from memory. */
  since: number;
  /** Plain-text state of the project, the same word for all of them until one stops. */
  status: 'active';
  /**
   * One-line install, only where the project installs, run on a clean machine
   * before it goes here (#89). KubeLab, the harness and ts-bridge have none.
   */
  install?: string;
}

/** A project flattened to a single language — what the card actually renders. */
export interface LocalizedProject extends ProjectContent {
  url?: string;
  github?: string;
  tags: string[];
  featured: boolean;
  since: number;
  status: 'active';
  install?: string;
}

/**
 * Resolve a project's per-language content into a flat, render-ready object.
 * Falls back to English if a locale is somehow missing, so a card never renders
 * blank text. Callers pass `getLocale(Astro.currentLocale)`.
 */
export function localize(project: Project, lang: Lang): LocalizedProject {
  const content = project[lang] ?? project.en;
  return {
    ...content,
    url: project.url,
    github: project.github,
    tags: project.tags,
    featured: project.featured,
    since: project.since,
    status: project.status,
    install: project.install,
  };
}

// Five projects, few and good (#587, decided 2026-11-04): Hive first, then the
// platform, the harness and the two tools that install. Pollex, yt-metrics-cli,
// kasa-provisioner and garsync stay public on GitHub and off this list.
export const projects: Project[] = [
  {
    en: {
      title: 'Hive',
      metric: 'Context on demand over MCP',
      description:
        'AI assistants waste tokens loading context they don\'t need. Hive queries your Obsidian vault on demand via MCP — only what\'s relevant, when it\'s relevant.',
    },
    es: {
      title: 'Hive',
      metric: 'Contexto bajo demanda vía MCP',
      description:
        'Los asistentes de IA malgastan tokens cargando contexto que no necesitan. Hive consulta tu bóveda de Obsidian bajo demanda vía MCP: solo lo relevante, cuando es relevante.',
    },
    url: 'https://mlorentedev.github.io/hive/',
    github: 'https://github.com/mlorentedev/hive',
    tags: ['Python', 'MCP', 'Obsidian', 'AI'],
    featured: true,
    since: 2026,
    status: 'active',
    install: 'uv tool install hive-vault',
  },
  {
    en: {
      title: 'KubeLab',
      metric: '8 machines, 3 K3s clusters',
      description:
        'I wanted to understand how platforms actually work — not just click buttons on managed K8s. So I built one from scratch. Eight machines, three single-node K3s clusters, VPN mesh, SSO, full observability. Everything IaC, nothing manual.',
    },
    es: {
      title: 'KubeLab',
      metric: '8 máquinas, 3 clústeres K3s',
      description:
        'Quería entender cómo funcionan de verdad las plataformas, no solo pulsar botones en un K8s gestionado. Así que construí una desde cero. Ocho máquinas, tres clústeres K3s de un nodo, malla VPN, SSO y observabilidad completa. Todo IaC, nada manual.',
    },
    // The Lab shows and measures the platform; kubelab.live is platform-internal (ADR-059, #31).
    url: '/lab',
    github: 'https://github.com/mlorentedev/kubelab',
    tags: ['Kubernetes', 'Go', 'Python', 'Terraform', 'Ansible'],
    featured: false,
    since: 2024,
    status: 'active',
  },
  {
    en: {
      title: 'dotf',
      metric: 'A second run changes nothing',
      description:
        'My machines and my AI agents come out of the same repository. dotf installs and converges the shell, the editors and the encrypted secrets on Linux and Windows, macOS on the way, and enforces the rules my agents work under.',
    },
    es: {
      title: 'dotf',
      metric: 'Repetirlo no cambia nada',
      description:
        'Mis máquinas y mis agentes de IA salen del mismo repositorio. dotf instala y converge la shell, los editores y los secretos cifrados en Linux y Windows, macOS en camino, y hace cumplir las reglas con las que trabajan mis agentes.',
    },
    // The harness, not a product (P-4): its card opens /ai, where the rules are shown.
    url: '/ai',
    github: 'https://github.com/mlorentedev/dotfiles',
    tags: ['Go', 'Shell', 'AI'],
    featured: false,
    since: 2024,
    status: 'active',
  },
  {
    en: {
      title: 'ts-bridge',
      metric: 'Zero-install, no admin',
      description:
        'Corporate firewalls block VPN clients that need admin rights. ts-bridge tunnels RDP/SSH through Tailscale in userspace — no install, no admin, no traces. One binary.',
    },
    es: {
      title: 'ts-bridge',
      metric: 'Sin instalación ni admin',
      description:
        'Los firewalls corporativos bloquean los clientes VPN que requieren permisos de administrador. ts-bridge tuneliza RDP/SSH a través de Tailscale en espacio de usuario: sin instalación, sin admin, sin rastros. Un único binario.',
    },
    url: 'https://mlorentedev.github.io/ts-bridge/',
    github: 'https://github.com/mlorentedev/ts-bridge',
    tags: ['Go', 'Tailscale', 'Networking'],
    featured: false,
    since: 2026,
    status: 'active',
  },
  {
    en: {
      title: 'pdf-modifier',
      metric: 'Format-preserving edits',
      description:
        'Find-and-replace in PDFs without destroying the formatting. CLI for batch jobs, MCP server for AI agents.',
    },
    es: {
      title: 'pdf-modifier',
      metric: 'Edición sin perder formato',
      description:
        'Buscar y reemplazar en PDFs sin destrozar el formato. CLI para lotes, servidor MCP para agentes de IA.',
    },
    // The package was renamed from pdf-modifier-mcp, which stays frozen at 1.6.0.
    url: 'https://pypi.org/project/pdf-modifier/',
    github: 'https://github.com/mlorentedev/pdf-modifier',
    tags: ['Python', 'MCP', 'PDF'],
    featured: false,
    since: 2026,
    status: 'active',
    install: 'pip install pdf-modifier',
  },
];
