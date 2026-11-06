import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { noteDate, writtenDateValid } from './lib/note-dates.mjs';

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
    tags: z.array(z.string()).default([]),
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
