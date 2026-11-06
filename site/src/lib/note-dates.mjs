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

// One instant for the whole build. Astro can load a module more than once in a
// build (the config, the prerender graph), so each reading the clock would let a
// build across 00:00 UTC list a note on one page and leave it off another. The
// first reading is written to `NOTES_NOW`, so every later one, in this process or
// one it starts, gets the same instant.

/** The build's clock, read once: every later caller, in this process or a child, gets the same instant. */
export function buildNow(env = process.env) {
  const now = buildClock(env);
  // `||=`, not `??=`: an empty NOTES_NOW reads as unset, so it is replaced too.
  env.NOTES_NOW ||= now.toISOString();
  return now;
}

/**
 * A frontmatter date, given the content layer's zod. A blank field (`writtenDate:`
 * with no value) reaches the schema as `null`, and `new Date(null)` is 1970-01-01,
 * so a blank is read as absent: optional where the field is, refused where not.
 */
export const noteDate = (z, { optional = false } = {}) => {
  const date = z.coerce.date();
  return z.preprocess((v) => (v === null || v === '' ? undefined : v), optional ? date.optional() : date);
};

/** Whether a note's frontmatter makes it part of a build made at `now`. */
export const isPublished = (data, now) => !data.draft && data.pubDate.valueOf() <= now.valueOf();

/**
 * A `writtenDate` is shown only when it is earlier than `pubDate`. One after
 * `pubDate` is refused by the schema; one on the same day says nothing new.
 */
export const shownWrittenDate = (data) =>
  data.writtenDate && data.writtenDate.valueOf() < data.pubDate.valueOf() ? data.writtenDate : undefined;

/** Whether a `writtenDate` is allowed: absent, or not after `pubDate`. */
export const writtenDateValid = (data) => !data.writtenDate || data.writtenDate.valueOf() <= data.pubDate.valueOf();

/**
 * One scalar from a raw note file's frontmatter, the way YAML reads it here:
 * quoted, or plain up to a ` #` comment. Undefined when the field is absent.
 */
export function frontmatterField(text, name) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const m = fm.match(new RegExp(`^${name}:[ \\t]*(?:"([^"]*)"|'([^']*)'|([^\\n]*?))[ \\t]*(?:[ \\t]#[^\\n]*)?$`, 'm'));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

/**
 * Whether a raw note file, read before the content layer exists (the sitemap
 * config, the tests), is a published note in `lang` at `now`. It reads the
 * frontmatter the way the collection does: `lang` defaults to English.
 */
export function publishedIn(text, lang, now) {
  const field = (name) => frontmatterField(text, name);
  const pubDate = new Date(field('pubDate') ?? 'invalid');
  if (Number.isNaN(pubDate.valueOf())) return false;
  return (field('lang') || 'en') === lang && isPublished({ draft: field('draft') === 'true', pubDate }, now);
}

/**
 * When a note was last changed: its `updatedDate`, or its `pubDate` when it has
 * none. Set by hand when a note is revised, never read from the file system or
 * git, where a rebase or a copy would move it without the note changing (WEB-050).
 */
export const modifiedDate = (data) => data.updatedDate ?? data.pubDate;

/** Whether an `updatedDate` is allowed: absent, or not before `pubDate`. */
export const updatedDateValid = (data) => !data.updatedDate || data.updatedDate.valueOf() >= data.pubDate.valueOf();
