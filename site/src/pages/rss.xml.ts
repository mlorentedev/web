import rss from '@astrojs/rss';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';

import { site } from '../data/site';
import { useTranslations } from '../i18n/utils';

const t = useTranslations('en');

export async function GET(context: APIContext) {
  // Same predicate as src/pages/notes/index.astro. If the two ever diverge, the
  // feed starts advertising posts the site does not list, which is worse than
  // having no feed at all.
  const notes: CollectionEntry<'notes'>[] = (
    await getCollection(
      'notes',
      ({ data }: CollectionEntry<'notes'>) => !data.draft && data.lang === 'en',
    )
  ).sort(
    (a: CollectionEntry<'notes'>, b: CollectionEntry<'notes'>) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: `${site.author} — ${t('notes.title')}`,
    // Deliberately the notes-index string rather than `site.description`: the
    // latter carries the positioning claim, which is being rewritten (#181), and
    // a feed description is cached by readers long after the site changes.
    description: t('notes.description'),
    // Astro resolves this from `site` in astro.config.mjs; the non-null assertion
    // is safe because the build fails earlier without it.
    site: context.site!,
    items: notes.map((note: CollectionEntry<'notes'>) => ({
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
