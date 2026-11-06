/**
 * Each note's social card (WEB-176): what goes on it, and where it is served.
 *
 * `scripts/og-cards.mjs` renders one 1200×630 PNG per non-draft note into
 * `src/assets/og/`, future-dated notes included, and records each card's inputs
 * in `manifest.json`. They are kept out of `public/`, which Astro copies whole:
 * `pages/og/notes/[slug].png.ts` emits only the cards of published notes, so a
 * note's title ships on its date and not before (WEB-138).
 *
 * Plain JavaScript so the script and the tests import it without a build.
 */

import { createHash } from 'node:crypto';

import { frontmatterField } from './note-dates.mjs';

/** Bump when the card's template changes, so every card is stale until regenerated. */
export const TEMPLATE_VERSION = 1;

export const WIDTH = 1200;
export const HEIGHT = 630;

/** The site path a note's card is served at. */
export const cardPath = (id) => `/og/notes/${id}.png`;

/**
 * What a note's card shows, read from its raw file, or null for a draft.
 * Tags must be a flow list of double-quoted strings, the form every note uses:
 * anything else fails, rather than draw a card with the wrong tags.
 */
export function cardInputs(id, text) {
  const field = (name) => frontmatterField(text, name);
  if (field('draft') === 'true') return null;
  const title = field('title');
  const date = field('pubDate');
  if (!title || !date || Number.isNaN(new Date(date).valueOf())) throw new Error(`${id}: no title or pubDate in its frontmatter`);
  const rawTags = field('tags') ?? '[]';
  let tags;
  try {
    tags = JSON.parse(rawTags);
  } catch {
    throw new Error(`${id}: tags must be a list of double-quoted strings, got ${rawTags}`);
  }
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) throw new Error(`${id}: tags is not a list of strings`);
  return { id, lang: field('lang') || 'en', title, date: new Date(date).toISOString().slice(0, 10), tags };
}

/** The files the card inlines besides the note: the site card its logo is cropped from, and the fonts. */
export const CARD_ASSETS = [
  'public/images/og-image.png',
  'public/fonts/Roboto-Regular.woff2',
  'public/fonts/Roboto-Medium.woff2',
  'public/fonts/Roboto-Bold.woff2',
];

/** One digest of `CARD_ASSETS`, given a reader of a site-relative path, so a new logo or font makes every card stale. */
export const assetsDigest = (read) => {
  const hash = createHash('sha256');
  for (const path of CARD_ASSETS) hash.update(read(path));
  return hash.digest('hex').slice(0, 16);
};

/** The stamp a card was rendered from: its inputs, the template's version and the assets it inlines. */
export const cardHash = (inputs, assets) =>
  createHash('sha256').update(JSON.stringify({ v: TEMPLATE_VERSION, assets, ...inputs })).digest('hex').slice(0, 16);
