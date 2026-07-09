import type { Lang } from '../i18n/ui';

/**
 * Experience timeline for the landing "My path / Mi camino" section (WEB-012).
 * Condensed from the canonical CV (the `resume` project's `data/cv.yml`) —
 * one headline per role, metric-first. Keep it short: the landing is a spine,
 * not the full CV. Bilingual, same shape as `portfolio.ts`.
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

/** A timeline entry flattened to one language + a rendered period string. */
export interface LocalizedExperience extends RoleContent {
  period: string;
  company: string;
  location: string;
}

/**
 * Flatten an entry to the given language. `presentLabel` localizes an ongoing
 * role's end ("Present" / "Actualidad") — pass `t('experience.present')`.
 */
export function localizeExperience(
  entry: Experience,
  lang: Lang,
  presentLabel: string,
): LocalizedExperience {
  const content = entry[lang] ?? entry.en;
  return {
    period: `${entry.start} — ${entry.end ?? presentLabel}`,
    company: entry.company,
    location: entry.location[lang] ?? entry.location.en,
    role: content.role,
    highlight: content.highlight,
  };
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
        'Built an Internal Developer Platform on Kubernetes + AWS — infra cost −80% ($1.5K→$300/mo), customer onboarding 60→14 days.',
    },
    es: {
      role: 'Ingeniero de Plataforma y Aplicaciones',
      highlight:
        'Construí una plataforma interna (IDP) en Kubernetes + AWS — coste de infra −80% (1,5K$→300$/mes), onboarding de clientes de 60 a 14 días.',
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
