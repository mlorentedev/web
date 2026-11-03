/**
 * The career loop under the hero (ADR-060): the DevOps loop drawn with Manu's
 * path on it. The left lobe is hardware, the right one software, and the
 * dashed return from the last station back to the first says what he does
 * now: AI and platforms that produce the SDK and a PoC for each camera.
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
  { start: '2015', en: 'silicon', es: 'silicio' },
  { start: '2017', en: 'firmware', es: 'firmware' },
  { start: '2018', en: 'customer', es: 'cliente' },
  { start: '2019', en: 'platform', es: 'plataforma' },
  { start: '2024', en: 'AI', es: 'IA' },
];
