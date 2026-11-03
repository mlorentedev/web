
/**
 * Career facts, condensed from the canonical CV (the `resume` project's
 * `data/cv.yml`): one headline per role, metric-first. The home's timeline
 * renders this list next to `data/education.ts`, and every figure elsewhere on
 * the home is held to it (`tests/bio.test.mjs`). A new figure goes here
 * first, next to the role it belongs to. Bilingual, same shape as `portfolio.ts`.
 */

/** Per-language copy for a role. */
export interface RoleContent {
  /** Job title. */
  role: string;
  /** One punchy line — the strongest, ideally quantified, outcome of the role. */
  highlight: string;
}

/** A timeline entry: language-neutral dates/company + per-language role + location. */
export interface Experience {
  /** Start year, e.g. "2019". */
  start: string;
  /** End year, or `null` for an ongoing role. */
  end: string | null;
  /**
   * Employer — language-neutral. Manu names it as he lived it: e2v until 2019,
   * then Teledyne Technologies, which bought it (his dating, 2026-11-02).
   */
  company: string;
  /** Localized location string. */
  location: { en: string; es: string };
  en: RoleContent;
  es: RoleContent;
}

export const experience: Experience[] = [
  {
    start: '2024',
    end: null,
    company: 'Teledyne Technologies',
    location: { en: 'USA', es: 'EE. UU.' },
    en: {
      role: 'Applications & Platform Engineer',
      highlight:
        'Kubernetes and AWS platform that builds an SDK and a PoC per camera, and the infrastructure the team\'s AI agents run on. Customer onboarding from 120 to 20–30 days.',
    },
    es: {
      role: 'Ingeniero de Plataforma y Aplicaciones',
      highlight:
        'Plataforma en Kubernetes y AWS que genera un SDK y una PoC por cámara, e infraestructura sobre la que corren los agentes de IA del equipo. Onboarding de clientes de 120 a 20–30 días.',
    },
  },
  {
    start: '2019',
    end: '2024',
    company: 'Teledyne Technologies',
    location: { en: 'Spain', es: 'España' },
    en: {
      role: 'Applications Engineer',
      highlight: 'Hardware and product integration with European customers, automating development with cloud, Kubernetes and DevOps.',
    },
    es: {
      role: 'Ingeniero de Aplicaciones',
      highlight: 'Integración de hardware y producto con clientes europeos, automatizando el desarrollo con cloud, Kubernetes y DevOps.',
    },
  },
  {
    start: '2018',
    end: '2019',
    company: 'e2v',
    location: { en: 'Shenzhen, China', es: 'Shenzhen (China)' },
    en: {
      role: 'Technical Specialist',
      highlight:
        'New product introductions and technical support with Asian customers; engineering liaison between Europe and China.',
    },
    es: {
      role: 'Especialista Técnico',
      highlight:
        'Introducción de nuevos productos y soporte técnico con clientes de Asia; enlace de ingeniería entre Europa y China.',
    },
  },
  {
    start: '2017',
    end: '2018',
    company: 'e2v',
    location: { en: 'Grenoble, France', es: 'Grenoble (Francia)' },
    en: {
      role: 'R&D Engineer',
      highlight:
        'C and VHDL firmware for vision cameras at sub-10 ms latency.',
    },
    es: {
      role: 'Ingeniero de I+D',
      highlight:
        'Firmware en C y VHDL para cámaras de visión a <10 ms de latencia.',
    },
  },
  {
    start: '2015',
    end: '2017',
    company: 'e2v',
    location: { en: 'Seville, Spain', es: 'Sevilla, España' },
    en: {
      role: 'Test Engineer',
      highlight:
        'Automated CMOS sensor testing in Python — eliminated 15+ hours of manual work per week and raised throughput.',
    },
    es: {
      role: 'Ingeniero de Test',
      highlight:
        'Test automatizado de sensores CMOS en Python — 15+ h/semana de trabajo manual eliminadas y más throughput.',
    },
  },
];
