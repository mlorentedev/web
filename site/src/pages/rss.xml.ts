import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { site } from '../data/site';
import { useTranslations } from '../i18n/utils';
import { notesIn, type Note } from '../lib/locale-pages';

const t = useTranslations('en');

/**
 * Builds `/rss.xml` from the published English notes.
 *
 * Static endpoint: Astro calls this once at build time and writes the result to
 * `dist/rss.xml`, so there is no request-time cost and no cache to invalidate.
 *
 * @param context - Astro's API context; only `site` is read, resolved from
 *   `site` in `astro.config.mjs`.
 * @returns An RSS 2.0 response listing every published English note, newest
 *   first by `pubDate`, with summaries rather than full post content.
 */
export async function GET(context: APIContext) {
  // The notes index reads the same list, so the feed cannot advertise a note
  // the site does not list: a draft, or one dated after this build.
  const notes: Note[] = await notesIn('en');

  return rss({
    title: `${site.author} — ${t('notes.title')}`,
    // Deliberately the notes-index string rather than `site.description`: the
    // latter carries the positioning claim, which is being rewritten (#181), and
    // a feed description is cached by readers long after the site changes.
    description: t('notes.description'),
    // Astro resolves this from `site` in astro.config.mjs; the non-null assertion
    // is safe because the build fails earlier without it.
    site: context.site!,
    items: notes.map((note: Note) => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.pubDate,
      link: `/notes/${note.id}/`,
      categories: note.data.tags,
    })),
    // Notes are MDX with components and build-time mermaid, so full content would
    // have to be serialised into feed-safe HTML — a much larger change than this
    // one, and a half-rendered post reads worse than a clean summary (#129).
    customData: '<language>en-us</language>',
  });
}
