/**
 * Whether an SVG from a third party is safe to serve from this site's origin.
 *
 * An SVG opened directly is a document, and a `<script>` or an `onload` in it
 * runs in the origin that served it. The build serves the GitHub chart from
 * ghchart.rshah.org byte for byte (`pages/github-activity.svg.ts`), so the
 * upstream is checked against what the chart is: rectangles and text. Anything
 * else, including any tag or attribute it does not use today, is refused, and
 * the build falls back to an empty chart. An allowlist, not a denylist: a
 * denylist has to know every way SVG can run code.
 *
 * Plain JavaScript so `tests/safe-svg.test.mjs` can import it without a build.
 */

const PROLOGUE = /^\s*(<\?xml[^>]*\?>\s*)?(<!DOCTYPE[^>[]*>\s*)?/;
const ELEMENTS = new Set(['svg', 'g', 'rect', 'text', 'title']);
const ATTRIBUTES = new Set([
  'xmlns', 'xmlns:xlink', 'version', 'width', 'height', 'viewBox',
  'x', 'y', 'dx', 'dy', 'fill', 'style', 'class', 'transform',
  'text-anchor', 'font-size', 'font-family', 'data-date', 'data-score',
]);

/** @param {string} body @returns {string | null} why the body is refused, or null when it is safe */
export function unsafeSvg(body) {
  const rest = body.replace(PROLOGUE, '');
  if (!/^<svg[\s>]/.test(rest)) return 'not an SVG';
  if (/<!|<\?|&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(rest)) return 'markup declarations, processing instructions or entities';
  for (const [, name, attrs] of rest.matchAll(/<\/?\s*([^\s/>]+)([^>]*)>/g)) {
    if (!ELEMENTS.has(name)) return `element <${name}>`;
    for (const [, attr] of attrs.matchAll(/([^\s=]+)\s*=/g)) {
      if (!ATTRIBUTES.has(attr)) return `attribute ${attr} on <${name}>`;
    }
  }
  if (/url\(|expression\(|javascript:/i.test(rest)) return 'a URL or script in a style';
  return null;
}
