
/**
 * Career facts, condensed from the canonical CV (the `resume` project's
 * `data/cv.yml`): one headline per role, metric-first. Nothing renders this list
 * any more (the Timeline left the home, WEB-140); it is the source every figure
 * in the home's story is held to (`tests/bio.test.mjs`). A new figure goes here
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
  /** End year, or `null` for an ongoing role (rendered as "Present" / "Actualidad"). */
  end: string | null;
  /** Employer — language-neutral. */
  company: string;
  /** Localized location string. */
  location: { en: string; es: string };
  en: RoleContent;
  es: RoleContent;
}

export const experience: Experience[] = [
  {
    start: '2019',
    end: null,
    company: 'Teledyne E2V',
    location: { en: 'Spain / USA', es: 'España / EE. UU.' },
    en: {
      role: 'Applications & Platform Engineer',
      highlight:
        'Built the platform (Kubernetes + AWS) that turned out an SDK per camera and PoCs for shows, demos and customer requests; led hardware and product integration with customers — onboarding 120→20–30 days, infra −80%.',
    },
    es: {
      role: 'Ingeniero de Plataforma y Aplicaciones',
      highlight:
        'Construí la plataforma (Kubernetes + AWS) que producía un SDK por cámara y PoCs para ferias, demos y peticiones de clientes; lideré la integración de hardware y producto con clientes — onboarding de 120 a 20–30 días, −80% de coste de infra.',
    },
  },
  {
    start: '2018',
    end: '2019',
    company: 'Teledyne E2V',
    location: { en: 'Shenzhen, China', es: 'Shenzhen (China)' },
    en: {
      role: 'Technical Specialist',
      highlight:
        'NPI and technical presales for high-speed imaging across APAC; primary engineering liaison between EMEA and Chinese clients.',
    },
    es: {
      role: 'Especialista Técnico',
      highlight:
        'NPI y presales técnico de imaging de alta velocidad en APAC; enlace de ingeniería principal entre EMEA y clientes chinos.',
    },
  },
  {
    start: '2017',
    end: '2018',
    company: 'Teledyne E2V',
    location: { en: 'Grenoble, France', es: 'Grenoble (Francia)' },
    en: {
      role: 'R&D Engineer',
      highlight:
        'C and VHDL firmware for vision cameras at sub-10 ms latency; .NET GUIs for automated validation systems.',
    },
    es: {
      role: 'Ingeniero de I+D',
      highlight:
        'Firmware en C y VHDL para cámaras de visión a <10 ms de latencia; GUIs en .NET para sistemas de validación automatizada.',
    },
  },
  {
    start: '2015',
    end: '2017',
    company: 'Teledyne E2V',
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
