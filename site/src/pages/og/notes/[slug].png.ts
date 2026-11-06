import { existsSync, readFileSync } from 'node:fs';

import type { APIRoute, GetStaticPaths } from 'astro';

import { notesIn } from '../../../lib/locale-pages';

/**
 * Each published note's social card (WEB-176), from `src/assets/og/`, where
 * `npm run og:cards` writes it. Only notes `notesIn` publishes get a path, so a
 * future-dated note's card, title and all, ships on its date and not before.
 *
 * A note with no card serves the generic one rather than fail the build, so a
 * build over other notes (the WEB-138 fixture builds) still builds;
 * `tests/note-og-cards.test.mjs` fails a site note that ships it.
 */
export const getStaticPaths = (async () =>
  (await Promise.all([notesIn('en'), notesIn('es')])).flat().map((note) => ({ params: { slug: note.id } }))) satisfies GetStaticPaths;

// Resolved from the site root, where `astro build` runs: the page module itself
// is bundled into dist/, so a path relative to it would not point here.
const card = (slug: string) => {
  const own = `src/assets/og/${slug}.png`;
  return readFileSync(existsSync(own) ? own : 'public/images/og-image.png');
};

export const GET: APIRoute = ({ params }) =>
  new Response(card(params.slug as string), { headers: { 'Content-Type': 'image/png' } });
