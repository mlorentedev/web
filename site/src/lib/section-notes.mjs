/**
 * The notes one Lab section links to, decided per section rather than per
 * locale (#625 review): a locale that has translated some of a section's notes
 * lists those, and still points at the English notes for the rest. A switch
 * on "does this locale have any notes at all" would drop every untranslated
 * note the day the first translation ships.
 *
 * @template {{ id: string }} N
 * @param {string[]} ids the section's note ids, in reading order
 * @param {N[]} own the published notes in the page's locale
 * @param {N[]} english the published English notes
 * @returns {{ notes: N[], moreInEnglish: boolean }}
 */
export function sectionNotes(ids, own, english) {
  const pick = (list) => {
    const byId = new Map(list.map((note) => [note.id, note]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  };
  const notes = pick(own);
  const mine = new Set(notes.map((note) => note.id));
  return { notes, moreInEnglish: pick(english).some((note) => !mine.has(note.id)) };
}
