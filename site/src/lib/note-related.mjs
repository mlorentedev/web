// The notes a note links to at its foot (WEB-129 AC1, AC4). Hand-curated in
// each note's `related` frontmatter; resolved here against the notes the build
// publishes, so an id that would ship as a dead link fails the build instead.

/** More than this and the block stops being a pointer and becomes a list. */
export const MAX_RELATED = 3;

/**
 * The notes `note.data.related` names, as `{ id, title }` in the order given.
 * `published` is every note this locale builds. Throws on an id that is not one
 * of them (a typo, a draft, a note dated after the build), on the note itself,
 * on a repeat, and on more than MAX_RELATED.
 */
export function resolveRelated(note, published) {
  const ids = note.data.related ?? [];
  const where = `note "${note.id}" lists related`;
  if (ids.length > MAX_RELATED) throw new Error(`${where} ${ids.length} notes; at most ${MAX_RELATED}`);
  const byId = new Map(published.map((n) => [n.id, n]));
  const seen = new Set();
  return ids.map((id) => {
    if (id === note.id) throw new Error(`${where} itself`);
    if (seen.has(id)) throw new Error(`${where} "${id}" twice`);
    seen.add(id);
    const target = byId.get(id);
    if (!target) throw new Error(`${where} "${id}", which is not a published note in its locale`);
    return { id, title: target.data.title };
  });
}
