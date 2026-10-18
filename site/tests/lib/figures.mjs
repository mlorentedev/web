/**
 * Figures in copy, and the figures `data/experience.ts` states.
 *
 * Copy that quotes a career figure must quote one the site already states in
 * `data/experience.ts`. The comparison is by whole token: checking a figure
 * against the file's text accepted any digit run inside a longer number or a
 * date, so "cut by 4%" passed because a 4 occurs somewhere in the file (WEB-158
 * review, F2). Only the entries' strings count as a source: the file's comments
 * name tickets, and "WEB-140" is not a career figure of 140.
 *
 * Shared by `bio.test.mjs` and `skills.test.mjs`, for the reason `banned.mjs`
 * gives: a test file registers its tests on import.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Figures as written: `2015`, `120`, `20–30`. A range counts as one figure.
 * Digits after a letter belong to a name (`K3s`, `S3`) and are not a figure;
 * digits before one still are (`80K`, `1990s`), so a suffix cannot hide a figure.
 */
export function figures(text) {
  return text.match(/(?<![\p{L}\d])\d+(?:[–-]\d+)?/gu) ?? [];
}

/**
 * The figures a source file states in its single-quoted strings, which is how
 * `data/experience.ts` writes every value; comments are not read.
 */
export function statedFigures(source) {
  const strings = source.match(/'(?:[^'\\\n]|\\.)*'/g) ?? [];
  return new Set(strings.flatMap(figures));
}

/** Every figure `data/experience.ts` states, as whole tokens. */
export function sourcedFigures(siteRoot) {
  return statedFigures(readFileSync(join(siteRoot, 'src/data/experience.ts'), 'utf8'));
}
