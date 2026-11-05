// When a note ships (WEB-138). Plain JS so the tests import it without a
// TypeScript loader.
//
// A note is published from its `pubDate` on. The clock is the build's: a note
// merged ahead of its date ships with the first release built after it, through
// the gated promotion that already exists, so nothing needs a cron. Dates
// compare in UTC: a bare `2026-11-20` is midnight UTC that day.

/**
 * The build's clock: now, or `NOTES_NOW` when set, so a test can build as of
 * any date. A value that is not a date fails the build instead of publishing
 * everything, or nothing.
 */
export function buildClock(env = process.env) {
  if (!env.NOTES_NOW) return new Date();
  const now = new Date(env.NOTES_NOW);
  if (Number.isNaN(now.valueOf())) throw new Error(`NOTES_NOW is not a date: ${env.NOTES_NOW}`);
  return now;
}

/** Whether a note's frontmatter makes it part of a build made at `now`. */
export const isPublished = (data, now) => !data.draft && data.pubDate.valueOf() <= now.valueOf();
