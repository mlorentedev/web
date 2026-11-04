/**
 * The career loop under the hero (ADR-060): the DevOps loop drawn with Manu's
 * path on it. The left lobe is hardware, the right one software, and the
 * dashed return closes the loop: the path is a cycle, not a ladder.
 *
 * Each station's year is the start of a role in `data/experience.ts`, and the
 * last one is the ongoing role (`tests/career-loop.test.mjs`). Rendered by
 * `components/HomeLoop.astro`, at build time, as inline SVG.
 */

export interface Station {
  /** Start year of the role in `experience.ts` this station stands for. */
  start: string;
  en: string;
  es: string;
}

export const stations: Station[] = [
  { start: '2015', en: 'semiconductors', es: 'semiconductores' },
  { start: '2017', en: 'firmware', es: 'firmware' },
  { start: '2018', en: 'customer', es: 'cliente' },
  { start: '2019', en: 'platform', es: 'plataforma' },
  { start: '2024', en: 'AI', es: 'IA' },
];
