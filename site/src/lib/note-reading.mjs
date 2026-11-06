// What a reader sees before committing to a note (WEB-129): how long it is,
// and, when it is long, what it covers.

/** A common rate for technical prose read on screen. */
export const WORDS_PER_MINUTE = 230;

/** A note with this many h2 and h3 sections or more opens with a table of contents. */
export const TOC_MIN_HEADINGS = 6;

/**
 * Minutes to read an MDX body, from its prose words. Fenced code blocks, MDX
 * `import`/`export` lines and JSX or HTML tags are not prose, so they are
 * dropped first; a tag starts with a letter or `/`, so `i < n` stays prose.
 * Never under one.
 * @param {string} body the note's source, without its frontmatter
 */
export function readingMinutes(body) {
  const prose = body
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, ' ')
    .replace(/^(import|export)\s.*$/gm, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ');
  const words = prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * The table of contents for a note: its h2 and h3 headings, as Astro's
 * `render()` returns them, or none when there are fewer than the threshold.
 * @template {{ depth: number, slug: string, text: string }} H
 * @param {H[]} headings
 * @returns {H[]}
 */
export function tocEntries(headings) {
  const sections = headings.filter((h) => h.depth === 2 || h.depth === 3);
  return sections.length >= TOC_MIN_HEADINGS ? sections : [];
}
