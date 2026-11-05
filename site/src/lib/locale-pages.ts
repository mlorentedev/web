// What each locale's notes and tag routes build, so the English and Spanish
// route files cannot drift apart (WEB-067): the date colour already had, on
// one locale only. Astro wants `getStaticPaths` in the page file, so each page
// calls one of these and hands the props to its shared component.
import { getCollection, type CollectionEntry } from 'astro:content';
import { projects, type Project } from '../data/portfolio';
import type { Lang } from '../i18n/ui';
import { buildNow, isPublished } from './note-dates.mjs';

export type Note = CollectionEntry<'notes'>;
export type NoteLink = { id: string; title: string } | null;

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'es' : 'en');

// Read once per build, so every page agrees on which notes exist.
const now = buildNow();

/**
 * The published notes written in `lang`, newest first: not drafts, and not
 * dated after the build (WEB-138). The only reader of the notes collection,
 * which tests/note-dates.test.mjs asserts, so no page can skip the filter.
 */
export async function notesIn(lang: Lang): Promise<Note[]> {
  return (await getCollection('notes', ({ data }: Note) => isPublished(data, now) && data.lang === lang)).sort(
    (a: Note, b: Note) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

/** One page per note in `lang`, each with its neighbours in publication order. */
export async function notePaths(lang: Lang) {
  const notes = (await notesIn(lang)).sort((a: Note, b: Note) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
  const link = (note?: Note): NoteLink => (note ? { id: note.id, title: note.data.title } : null);
  return notes.map((note, i) => ({
    params: { slug: note.id },
    props: { note, prev: link(notes[i - 1]), next: link(notes[i + 1]) },
  }));
}

const lower = (tag: string) => tag.toLowerCase();
const tagsOf = (notes: Note[]) => new Set([...projects.flatMap((p) => p.tags), ...notes.flatMap((n) => n.data.tags)].map(lower));

/**
 * One page per tag a project or a `lang` note carries. A tag page has an
 * alternate only when the other locale builds the same tag: a tag only English
 * notes carry has no Spanish page to point at.
 */
export async function tagPaths(lang: Lang) {
  const notes = await notesIn(lang);
  const twin = tagsOf(await notesIn(otherLang(lang)));
  return [...tagsOf(notes)].map((tag) => ({
    params: { tag },
    props: {
      tag,
      hasAlternates: twin.has(tag),
      matchingProjects: projects.filter((p) => p.tags.some((t) => lower(t) === tag)),
      matchingNotes: notes.filter((n) => n.data.tags.some((t: string) => lower(t) === tag)),
    },
  }));
}

export interface TagProps {
  tag: string;
  hasAlternates: boolean;
  matchingProjects: Project[];
  matchingNotes: Note[];
}
