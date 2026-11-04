/**
 * What Manu does, by layer (#499): a few terms a reader can scan, then the work
 * that proves them. Terms come from the `resume` project's `cv.yml` and the
 * review on #499; rendered on the home by `components/HomeSkills.astro`.
 *
 * Each layer tells, in a sentence or two, the work that proves it, with one
 * inline link: `story` is the text before the link, the link's words, and the
 * text after. The link must be public (`tests/skills.test.mjs`). A figure must
 * already be in `data/experience.ts`.
 */

import type { Lang } from '../i18n/ui';

export interface LayerCopy {
  /** The layer's name: not shown, but it names the term list for screen readers. */
  name: string;
  terms: string[];
  /** Before the link, the link's words (saying what it opens), after it. */
  story: [string, string, string];
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
      story: ['A platform is learned by running it. ', 'KubeLab', ' is my hybrid internal platform, and this site deploys through it, so every change you see here went through its pipeline.'],
    },
    es: {
      name: 'Plataforma',
      terms: ['Plataformas internas (IDP)', 'Kubernetes', 'GitOps', 'CI/CD', 'Terraform y Ansible'],
      story: ['Una plataforma se aprende operándola. ', 'KubeLab', ' es mi plataforma interna híbrida, y esta web se despliega sobre ella: cada cambio que ves aquí ha pasado por su pipeline.'],
    },
  },
  {
    key: 'sre/reliability',
    tone: 'emerald',
    href: 'https://github.com/mlorentedev/kubelab',
    en: {
      name: 'Reliability',
      terms: ['Observability', 'Tested backups', 'Restore drills', 'Alerting', 'Security'],
      story: ['A backup you have never restored is a hope, not a backup. In KubeLab I restore the backups for real and test the alerts by breaking things on purpose; it is all in ', 'the repository', '.'],
    },
    es: {
      name: 'Fiabilidad',
      terms: ['Observabilidad', 'Backups probados', 'Simulacros de recuperación', 'Alertas', 'Seguridad'],
      story: ['Un backup que nunca has restaurado es una esperanza, no un backup. En KubeLab restauro las copias de verdad y pruebo las alertas rompiendo cosas a propósito; está todo en ', 'el repositorio', '.'],
    },
  },
  {
    key: 'ai/agents',
    tone: 'purple',
    href: '/ai/',
    en: {
      name: 'AI',
      terms: ['Agent harness', 'MCP servers', 'Agent orchestration'],
      story: ['I work with AI agents every day, and to trust them I built ', 'the harness they work in', ', with rules, reviews and memory, plus Hive, my open-source MCP server.'],
    },
    es: {
      name: 'IA',
      terms: ['Harness de agentes', 'Servidores MCP', 'Orquestación de agentes'],
      story: ['Trabajo con agentes de IA a diario, y para fiarme de ellos construí ', 'el harness en el que trabajan', ', con reglas, revisiones y memoria, además de Hive, mi servidor MCP de código abierto.'],
    },
  },
  {
    key: 'cloud/systems',
    tone: 'amber',
    href: 'https://github.com/zuidui/doc',
    en: {
      name: 'Cloud and systems design',
      terms: ['AWS, GCP and Hetzner', 'Microservices', 'Event-driven systems'],
      story: ['For my cloud master\'s, a teammate and I designed ', 'Zuidui', ': event-driven microservices on Kubernetes. I took development, integration and documentation.'],
    },
    es: {
      name: 'Cloud y diseño de sistemas',
      terms: ['AWS, GCP y Hetzner', 'Microservicios', 'Sistemas por eventos'],
      story: ['En el máster cloud diseñamos ', 'Zuidui', ' entre un compañero y yo: microservicios por eventos sobre Kubernetes. Yo me encargué del desarrollo, la integración y la documentación.'],
    },
  },
  {
    key: 'hw/embedded',
    tone: 'rose',
    href: 'https://github.com/mlorentedev/vicon-fpga-face-detection',
    en: {
      name: 'Embedded systems',
      terms: ['C firmware', 'FPGA and VHDL', 'Microcontrollers and FreeRTOS', 'Image sensors', 'Inference on Jetson and FPGA'],
      story: ['I come from hardware: my master\'s project was ', 'face detection on an FPGA', ', from the VHDL up.'],
    },
    es: {
      name: 'Sistemas embebidos',
      terms: ['Firmware en C', 'FPGA y VHDL', 'Microcontroladores y FreeRTOS', 'Sensores de imagen', 'Inferencia en Jetson y FPGA'],
      story: ['Vengo del hardware: mi trabajo de fin de máster fue ', 'detección facial en una FPGA', ', desde el VHDL.'],
    },
  },
];

export const languages = ['Python', 'Go', 'C', 'C++'];

/** The layers flattened to one language, in order. */
export function layersFor(lang: Lang): (LayerCopy & Omit<Layer, 'en' | 'es'>)[] {
  return layers.map(({ key, tone, href, ...copy }) => ({ key, tone, href, ...copy[lang] }));
}
