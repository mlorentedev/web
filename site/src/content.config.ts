import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { noteDate, updatedDateValid, writtenDateValid } from './lib/note-dates.mjs';

const notes = defineCollection({
  // NOTES_DIR lets tests/note-dates.test.mjs build over fixture notes (WEB-138).
  loader: glob({ pattern: '**/*.{md,mdx}', base: process.env.NOTES_DIR ?? 'src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // The day the note ships: it orders the lists and the feed, and a note
    // dated after the build is left out of it (src/lib/note-dates.mjs).
    pubDate: noteDate(z),
    // The date of the lesson or ADR a note was written from, when that is
    // earlier. The page shows it, and says when the note was published.
    writtenDate: noteDate(z, { optional: true }),
    // The day the note was last revised, when it was. Without one it was last
    // modified when it was published (WEB-050).
    updatedDate: noteDate(z, { optional: true }),
    tags: z.array(z.string()).default([]),
    // Other notes, by id, linked at the foot in this order (WEB-129).
    // lib/locale-pages resolves them and fails the build on one that is not
    // published in the same locale.
    related: z.array(z.string()).default([]),
    // Optional until a second kind of note exists: every note today is a long
    // one (#590, P-10), so nothing reads it yet.
    kind: z.enum(['essay', 'field-note', 'til']).optional(),
    lang: z.enum(['en', 'es']).default('en'),
    draft: z.boolean().default(false),
    supersededBy: z
      .object({
        title: z.string(),
        href: z.string(),
        summary: z.string(),
      })
      .optional(),
  }).refine(writtenDateValid, {
    message: 'writtenDate is after pubDate: a note cannot be written from notes it has not taken yet',
    path: ['writtenDate'],
  }).refine(updatedDateValid, {
    message: 'updatedDate is before pubDate: a note cannot be revised before it is published',
    path: ['updatedDate'],
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: 'src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['en', 'es']).default('en'),
    page: z.string(),
  }),
});

export const collections = { notes, pages };
