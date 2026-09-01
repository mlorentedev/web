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

/**
 * The palette's seven hued families, each mapped to the Tailwind ramp it aliases.
 *
 * `tailwind.config.mjs` builds `theme.extend.colors` from this, and
 * `tests/lab-audit.test.mjs` asserts the built HTML uses nothing else. That is
 * the point of putting it here rather than in either of them: WEB-080's AC1
 * asks for one allowlist shared by the design system and the test that polices
 * it, and an allowlist the test keeps its own copy of is two allowlists that
 * agree until the day they do not.
 */
export const COLOR_FAMILIES = {
  // Brand. `accent-700` is the ACCENT above; the rest of the ramp comes with it
  // so hover and border shades have somewhere to live.
  accent: 'cyan',
  // Neutrals. `ink` is the warm scale the site's text and hairlines use;
  // `panel` is the cool one the dark surfaces use.
  ink: 'gray',
  panel: 'slate',
  // Status, as the Lab's architecture legend already assigns them.
  ok: 'emerald',
  warn: 'amber',
  danger: 'rose',
  observe: 'purple',
};

/** The family names alone — what a `bg-`/`text-`/`border-` utility may name. */
export const HUED_FAMILIES = Object.keys(COLOR_FAMILIES);

/**
 * Colour keywords that carry no hue and therefore no palette decision.
 *
 * `text-white` on an accent surface is not a competing colour, it is the
 * absence of one, so these are allowed alongside the families rather than
 * counted against them.
 */
export const HUELESS_NEUTRALS = ['white', 'black', 'transparent', 'current'];
