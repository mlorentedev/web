/**
 * What Manu does, by layer (#499): a few terms a reader can scan, then the work
 * that proves them. Terms come from the `resume` project's `cv.yml` and the
 * review on #499; rendered on the home by `components/HomeSkills.astro`.
 *
 * A proof is one sentence and one link, and the link must be public
 * (`tests/skills.test.mjs`). A figure must already be in `data/experience.ts`.
 */

import type { Lang } from '../i18n/ui';

export interface LayerCopy {
  name: string;
  terms: string[];
  proof: string;
  /** What the link opens, so a reader knows before clicking. */
  link: string;
}

/** A hue from the site tokens (`styles/tailwind.css`); see `HomeSkills.astro`. */
export type Tone = 'accent' | 'emerald' | 'purple' | 'amber' | 'rose';

export interface Layer {
  /**
   * The layer as a path-style label key, the way platform tools label things
   * (ADR-060). An identifier, so the same in both locales.
   */
  key: string;
  tone: Tone;
  /** A site path (`/lab/`, localised at render time) or a public artifact. */
  href: string;
  en: LayerCopy;
  es: LayerCopy;
}

export const layers: Layer[] = [
  {
    key: 'platform/idp',
    tone: 'accent',
    href: '/lab/',
    en: {
      name: 'Platform',
      terms: ['Internal developer platforms', 'Kubernetes', 'GitOps', 'CI/CD', 'Terraform and Ansible'],
      proof: 'KubeLab, my hybrid internal platform. This site deploys through it.',
      link: 'see KubeLab',
    },
    es: {
      name: 'Plataforma',
      terms: ['Plataformas internas (IDP)', 'Kubernetes', 'GitOps', 'CI/CD', 'Terraform y Ansible'],
      proof: 'KubeLab, mi plataforma interna híbrida. Esta web se despliega sobre ella.',
      link: 'ver KubeLab',
    },
  },
  {
    key: 'sre/reliability',
    tone: 'emerald',
    href: 'https://github.com/mlorentedev/kubelab',
    en: {
      name: 'Reliability',
      terms: ['Observability', 'Tested backups', 'Restore drills', 'Alerting', 'Security'],
      proof: 'I restore KubeLab\'s backups for real, and I test its alerts by breaking things on purpose.',
      link: 'the repository',
    },
    es: {
      name: 'Fiabilidad',
      terms: ['Observabilidad', 'Backups probados', 'Simulacros de recuperación', 'Alertas', 'Seguridad'],
      proof: 'Restauro de verdad los backups de KubeLab y pruebo sus alertas rompiendo cosas a propósito.',
      link: 'el repositorio',
    },
  },
  {
    key: 'ai/agents',
    tone: 'purple',
    href: '/ai/',
    en: {
      name: 'AI',
      terms: ['Agent harness', 'MCP servers', 'Agent orchestration'],
      proof: 'The harness my agents work in, and Hive, my open-source MCP server.',
      link: 'how it works',
    },
    es: {
      name: 'IA',
      terms: ['Harness de agentes', 'Servidores MCP', 'Orquestación de agentes'],
      proof: 'El harness en el que trabajan mis agentes, y Hive, mi servidor MCP de código abierto.',
      link: 'cómo funciona',
    },
  },
  {
    key: 'cloud/systems',
    tone: 'amber',
    href: 'https://github.com/zuidui/doc',
    en: {
      name: 'Cloud and systems design',
      terms: ['AWS, GCP and Hetzner', 'Microservices', 'Event-driven systems'],
      proof: 'Zuidui, my cloud master\'s project with a teammate: event-driven microservices on Kubernetes. I took development, integration and documentation.',
      link: 'the project',
    },
    es: {
      name: 'Cloud y diseño de sistemas',
      terms: ['AWS, GCP y Hetzner', 'Microservicios', 'Sistemas por eventos'],
      proof: 'Zuidui, mi trabajo de fin del máster cloud junto a un compañero: microservicios por eventos sobre Kubernetes. Yo llevé desarrollo, integración y documentación.',
      link: 'el proyecto',
    },
  },
  {
    key: 'hw/embedded',
    tone: 'rose',
    href: 'https://github.com/mlorentedev/vicon-fpga-face-detection',
    en: {
      name: 'Embedded systems',
      terms: ['C firmware', 'FPGA and VHDL', 'Microcontrollers and FreeRTOS', 'Image sensors', 'Inference on Jetson and FPGA'],
      proof: 'My master\'s project: face detection on an FPGA.',
      link: 'the code',
    },
    es: {
      name: 'Sistemas embebidos',
      terms: ['Firmware en C', 'FPGA y VHDL', 'Microcontroladores y FreeRTOS', 'Sensores de imagen', 'Inferencia en Jetson y FPGA'],
      proof: 'Mi trabajo de fin de máster: detección facial en FPGA.',
      link: 'el código',
    },
  },
];

export const languages = ['Python', 'Go', 'C', 'C++'];

/** The layers flattened to one language, in order. */
export function layersFor(lang: Lang): (LayerCopy & Omit<Layer, 'en' | 'es'>)[] {
  return layers.map(({ key, tone, href, ...copy }) => ({ key, tone, href, ...copy[lang] }));
}
