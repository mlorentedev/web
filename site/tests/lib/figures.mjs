/**
 * Figures in copy, and the figures `data/experience.ts` states.
 *
 * Copy that quotes a career figure must quote one the site already states in
 * `data/experience.ts`, next to the role it belongs to. The comparison is by
 * whole token: checking a figure against the file's text accepted any digit run
 * inside a longer number or a date, so "cut by 4%" passed because a 4 occurs
 * somewhere in the file (WEB-158 review, F2).
 *
 * Shared by `bio.test.mjs` and `skills.test.mjs`, for the reason `banned.mjs`
 * gives: a test file registers its tests on import.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Figures as written: `2015`, `120`, `20–30`. A range counts as one figure, and
 * digits inside a name (`K3s`, `S3`) are not a figure.
 */
export function figures(text) {
  return text.match(/(?<![\p{L}\d])\d+(?:[–-]\d+)?(?![\p{L}\d])/gu) ?? [];
}

/** Every figure `data/experience.ts` states, as whole tokens. */
export function sourcedFigures(siteRoot) {
  return new Set(figures(readFileSync(join(siteRoot, 'src/data/experience.ts'), 'utf8')));
}
