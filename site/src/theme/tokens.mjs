/**
 * The one definition of the brand accent.
 *
 * It used to have four: the `cyan-700` utility, two rules in
 * `tailwind.config.mjs`, and the colour path segment of the ghchart URL in two
 * pages. Nothing tied them together, so WEB-040's contrast failures came from
 * picking a shade by hand and WEB-067's drift changed one of them on one locale
 * only.
 *
 * Kept as `.mjs` so `tailwind.config.mjs` and the Astro pages can both import it
 * — a token that only one of them can read is not a single definition.
 */

/** Brand accent. Identical to Tailwind's `cyan-700`, which `accent-700` aliases. */
export const ACCENT = '#0e7490';

/** The accent without its `#`, for URL path segments that take a bare hex. */
export const ACCENT_BARE = ACCENT.slice(1);

/** Prose ink, matching `slate-700` / `slate-900`. */
export const PROSE_BODY = '#334155';
export const PROSE_HEADING = '#0f172a';

/** Inline-code chip, matching `slate-100`. */
export const CODE_SURFACE = '#f1f5f9';

/** Fenced-code block, matching `slate-800` on `slate-200`. */
export const PRE_SURFACE = '#1e293b';
export const PRE_INK = '#e2e8f0';
