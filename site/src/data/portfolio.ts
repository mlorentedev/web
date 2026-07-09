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
  /** Live demo / project page — preferred target for the card's "View project" link. */
  url?: string;
  /** Source repository — fallback link target when `url` is absent. */
  github?: string;
  /** Language-neutral tags; also drive the `/tags/<tag>` index pages. */
  tags: string[];
  /** Featured projects sort first on the `/projects` page. */
  featured: boolean;
}

/** A project flattened to a single language — what the card actually renders. */
export interface LocalizedProject extends ProjectContent {
  url?: string;
  github?: string;
  tags: string[];
  featured: boolean;
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
  };
}

export const projects: Project[] = [
  {
    en: {
      title: 'KubeLab',
      metric: '5-node bare-metal K8s',
      description:
        'I wanted to understand how platforms actually work — not just click buttons on managed K8s. So I built one from scratch. 5 physical nodes, K3s, VPN mesh, SSO, full observability. Everything IaC, nothing manual.',
    },
    es: {
      title: 'KubeLab',
      metric: 'K8s bare-metal, 5 nodos',
      description:
        'Quería entender cómo funcionan de verdad las plataformas, no solo pulsar botones en un K8s gestionado. Así que construí una desde cero. 5 nodos físicos, K3s, malla VPN, SSO y observabilidad completa. Todo IaC, nada manual.',
    },
    github: 'https://github.com/mlorentedev/kubelab',
    tags: ['Kubernetes', 'Go', 'Python', 'Terraform', 'Ansible'],
    featured: true,
  },
  {
    en: {
      title: 'Hive',
      metric: '67–82% fewer tokens',
      description:
        'AI assistants waste tokens loading context they don\'t need. Hive queries your Obsidian vault on demand via MCP — only what\'s relevant, when it\'s relevant. 67-82% token reduction.',
    },
    es: {
      title: 'Hive',
      metric: '67–82% menos tokens',
      description:
        'Los asistentes de IA malgastan tokens cargando contexto que no necesitan. Hive consulta tu bóveda de Obsidian bajo demanda vía MCP: solo lo relevante, cuando es relevante. 67-82% menos tokens.',
    },
    url: 'https://mlorentedev.github.io/hive/',
    github: 'https://github.com/mlorentedev/hive',
    tags: ['Python', 'MCP', 'Obsidian', 'AI'],
    featured: true,
  },
  {
    en: {
      title: 'Pollex',
      metric: '3s on-device inference',
      description:
        'Cloud LLM APIs see everything you type. Pollex polishes your English on a $99 Jetson Nano — grammar, coherence, wording. 3-second inference, zero cloud dependencies.',
    },
    es: {
      title: 'Pollex',
      metric: 'Inferencia local en 3s',
      description:
        'Las APIs de LLM en la nube ven todo lo que escribes. Pollex pule tu inglés en una Jetson Nano de 99 $: gramática, coherencia y redacción. Inferencia en 3 segundos, cero dependencias de la nube.',
    },
    url: 'https://mlorentedev.github.io/pollex/',
    github: 'https://github.com/mlorentedev/pollex',
    tags: ['Go', 'MCP', 'LLM', 'Jetson-Nano'],
    featured: true,
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
    featured: true,
  },
  {
    en: {
      title: 'pdf-modifier-mcp',
      metric: 'Format-preserving edits',
      description:
        'Find-and-replace in PDFs without destroying the formatting. CLI for batch jobs, MCP server for AI agents.',
    },
    es: {
      title: 'pdf-modifier-mcp',
      metric: 'Edición sin perder formato',
      description:
        'Buscar y reemplazar en PDFs sin destrozar el formato. CLI para lotes, servidor MCP para agentes de IA.',
    },
    url: 'https://mlorentedev.github.io/pdf-modifier-mcp/',
    github: 'https://github.com/mlorentedev/pdf-modifier-mcp',
    tags: ['Python', 'MCP', 'PDF'],
    featured: false,
  },
  {
    en: {
      title: 'yt-metrics-cli',
      metric: 'Any public channel',
      description:
        'YouTube Studio analytics are shallow and locked to your own channel. This CLI pulls metrics for any public channel and exports everything.',
    },
    es: {
      title: 'yt-metrics-cli',
      metric: 'Cualquier canal público',
      description:
        'Las analíticas de YouTube Studio son superficiales y están limitadas a tu propio canal. Esta CLI extrae métricas de cualquier canal público y lo exporta todo.',
    },
    url: 'https://mlorentedev.github.io/yt-metrics-cli/',
    github: 'https://github.com/mlorentedev/yt-metrics-cli',
    tags: ['Python', 'CLI', 'YouTube'],
    featured: false,
  },
  {
    en: {
      title: 'kasa-provisioner',
      metric: '20 plugs, bulk-provisioned',
      description:
        'Configuring 20 smart plugs one by one through a phone app is painful. This scans the network, updates firmware, and sets schedules in bulk.',
    },
    es: {
      title: 'kasa-provisioner',
      metric: '20 enchufes en bloque',
      description:
        'Configurar 20 enchufes inteligentes uno a uno desde una app del móvil es un suplicio. Esto escanea la red, actualiza el firmware y programa horarios en bloque.',
    },
    github: 'https://github.com/mlorentedev/kasa-provisioner',
    tags: ['Python', 'IoT', 'Networking'],
    featured: false,
  },
  {
    en: {
      title: 'dotfiles',
      metric: '1 script, fresh machine',
      description:
        'Dev environment that rebuilds itself. Zsh, Neovim, tmux, Git — one script on a fresh machine.',
    },
    es: {
      title: 'dotfiles',
      metric: '1 script, máquina nueva',
      description:
        'Un entorno de desarrollo que se reconstruye solo. Zsh, Neovim, tmux, Git: un script en una máquina nueva.',
    },
    github: 'https://github.com/mlorentedev/dotfiles',
    tags: ['Shell', 'Neovim', 'DevEx'],
    featured: false,
  },
];
