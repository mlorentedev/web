// What each locale's notes and tag routes build, so the English and Spanish
// route files cannot drift apart (WEB-067): the date colour already had, on
// one locale only. Astro wants `getStaticPaths` in the page file, so each page
// calls one of these and hands the props to its shared component.
import { getCollection, type CollectionEntry } from 'astro:content';
import { projects, type Project } from '../data/portfolio';
import type { Lang } from '../i18n/ui';
import { buildNow, isPublished } from './note-dates.mjs';
import { resolveRelated } from './note-related.mjs';

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

/**
 * One page per note in `lang`, each with its neighbours in publication order
 * and its related notes, resolved here so a dead one fails the build (WEB-129).
 */
export async function notePaths(lang: Lang) {
  const notes = (await notesIn(lang)).sort((a: Note, b: Note) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
  const link = (note?: Note): NoteLink => (note ? { id: note.id, title: note.data.title } : null);
  return notes.map((note, i) => ({
    params: { slug: note.id },
    props: { note, prev: link(notes[i - 1]), next: link(notes[i + 1]), related: resolveRelated(note, notes) },
  }));
}

/** A tag page listing fewer notes and projects than this is `noindex` (WEB-052). */
export const MIN_TAG_ITEMS = 2;

const lower = (tag: string) => tag.toLowerCase();
const tagsOf = (notes: Note[]) => new Set([...projects.flatMap((p) => p.tags), ...notes.flatMap((n) => n.data.tags)].map(lower));

const projectsTagged = (tag: string) => projects.filter((p) => p.tags.some((t) => lower(t) === tag));
const notesTagged = (notes: Note[], tag: string) => notes.filter((n) => n.data.tags.some((t: string) => lower(t) === tag));
const thin = (notes: Note[], tag: string) => projectsTagged(tag).length + notesTagged(notes, tag).length < MIN_TAG_ITEMS;

/**
 * One page per tag a project or a `lang` note carries. A page listing fewer
 * than MIN_TAG_ITEMS items is noindex. It has an alternate only when the other
 * locale builds the same tag as an indexable page: a tag only English notes
 * carry has no Spanish page to point at, and hreflang must not name a noindex one.
 */
export async function tagPaths(lang: Lang) {
  const notes = await notesIn(lang);
  const otherNotes = await notesIn(otherLang(lang));
  const twin = tagsOf(otherNotes);
  return [...tagsOf(notes)].map((tag) => ({
    params: { tag },
    props: {
      tag,
      noindex: thin(notes, tag),
      hasAlternates: twin.has(tag) && !thin(otherNotes, tag),
      matchingProjects: projectsTagged(tag),
      matchingNotes: notesTagged(notes, tag),
    },
  }));
}

export interface TagProps {
  tag: string;
  noindex: boolean;
  hasAlternates: boolean;
  matchingProjects: Project[];
  matchingNotes: Note[];
}
