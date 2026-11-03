
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
      role: 'Applications Engineer',
      highlight:
        'An internal platform that builds the SDK and a PoC for each camera, AI agents for SDK support and sensor characterisation, agentic-workflow training for EMEA, NAM and APAC, and bring-up with customers: onboarding from 120 to 20–30 days.',
    },
    es: {
      role: 'Ingeniero de Aplicaciones',
      highlight:
        'Plataforma interna que genera el SDK y una PoC de cada cámara, agentes de IA para el soporte del SDK y la caracterización de sensores, formación en flujos agénticos para EMEA, NAM y APAC, y puesta en marcha con clientes: onboarding de 120 a 20–30 días.',
    },
  },
  {
    start: '2019',
    end: '2024',
    company: 'Teledyne Technologies',
    location: { en: 'Spain', es: 'España' },
    en: {
      role: 'Applications Engineer',
      highlight: 'Tooling for each camera and the work with customers: a Python CLI that retired the MATLAB manufacturing scripts across the global teams, the SDK (Python, C++, MATLAB) customers used to evaluate it against EMVA 1288, and integration and technical support with European customers.',
    },
    es: {
      role: 'Ingeniero de Aplicaciones',
      highlight: 'Herramientas para cada cámara y trabajo con el cliente: una CLI en Python que retiró los scripts de MATLAB de fabricación en los equipos globales, el SDK (Python, C++, MATLAB) con el que los clientes la evaluaban según EMVA 1288, y la integración y el soporte técnico con clientes europeos.',
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
