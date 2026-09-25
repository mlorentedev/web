/**
 * The busy line on the contact door (WEB-137).
 *
 * The rule is "one project at a time", and the status is asymmetric: while
 * `site.nextStart` is a future date the door says when the next project can
 * start, and once that date has passed it says nothing. The free state stays
 * silent, so a forgotten update makes the copy go quiet, never wrong.
 *
 * Plain `.mjs` so the tests can import it without a TypeScript loader, the
 * same reason `theme/tokens.mjs` is one.
 */

/**
 * The month the next project starts, or `null` when the door should say nothing.
 *
 * @param {string | null} nextStart  `YYYY-MM-DD`, or `null` for no stated date.
 * @param {Date} now                 The moment to judge it against (the build, in practice).
 * @param {string} locale            A BCP 47 locale, e.g. `en-US` or `es-ES`.
 * @returns {string | null}
 */
export function busyMonth(nextStart, now, locale) {
  if (!nextStart) return null;
  const start = new Date(`${nextStart}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`site.nextStart must be YYYY-MM-DD, got "${nextStart}"`);
  }
  if (start <= now) return null;
  // UTC for the same reason as formatDate in i18n/utils.ts: a bare date is UTC
  // midnight, and the build machine's zone would roll the 1st back a month.
  return start.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' });
}
