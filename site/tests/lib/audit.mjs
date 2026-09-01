/**
 * The pure half of the design-system audit: parsing class attributes out of
 * built HTML and deciding which of them reach past the token layer.
 *
 * ## Why this is not inside `lab-audit.mjs`
 *
 * That file calls `test()` at the top level. Node's runner registers whatever a
 * test file imports, so a second suite importing a helper from it would re-run
 * every assertion in it — and `lab-audit.mjs` is red on purpose until PR6, so
 * one `import` would turn CI red from a file that asserts nothing of its own.
 *
 * Splitting the pure functions out is the same move `scripts/diagrams.mjs` made
 * when `fail()` stopped calling `process.exit` and started throwing: a module
 * that *does* something on import cannot be reused, only copied.
 *
 * The allowlist still has exactly one definition — `src/theme/tokens.mjs`,
 * which `tailwind.config.mjs` builds the palette from and this reads back.
 */

import tailwindColors from 'tailwindcss/colors.js';

import { HUED_FAMILIES, HUELESS_NEUTRALS } from '../../src/theme/tokens.mjs';

/**
 * Tailwind's own palette names — the vocabulary a colour utility can name
 * *instead of* one of our families. Taken from the package rather than typed
 * out, so a Tailwind upgrade that adds a ramp does not quietly create a hole.
 *
 * The renamed ramps are skipped by name and never read: they are deprecation
 * getters that print a warning on access, and five warnings on every run train
 * a reader to ignore the output the tests are trying to give them.
 */
const deprecatedAliases = new Set(['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray']);

export const paletteNames = new Set(
  Object.keys(tailwindColors)
    .filter((name) => !deprecatedAliases.has(name))
    .filter((name) => tailwindColors[name] && typeof tailwindColors[name] === 'object'),
);

export const allowedFamilies = new Set([...HUED_FAMILIES, ...HUELESS_NEUTRALS]);

/** Every `class` attribute value in the document, variants and all. */
export function classNames(html) {
  const names = new Set();
  for (const match of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const raw of match[1].split(/\s+/)) {
      if (raw) names.add(raw);
    }
  }
  return names;
}

/**
 * `dark:hover:text-red-500` → `text-red-500`. Variants do not change the hue.
 *
 * Splitting on every colon is wrong, and wrong in the direction that matters:
 * Tailwind's type hints put a colon *inside* the brackets, so
 * `bg-[color:rgb(1,2,3)]` would have been cut down to `rgb(1,2,3)]` — no `[`,
 * so the arbitrary-colour guard never fires on the one syntax whose whole
 * purpose is to name a colour. Only colons outside brackets separate variants.
 */
export function withoutVariants(className) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < className.length; i += 1) {
    const char = className[i];
    if (char === '[') depth += 1;
    else if (char === ']') depth -= 1;
    else if (char === ':' && depth === 0) start = i + 1;
  }
  return className.slice(start).replace(/^!/, '');
}

/**
 * Utilities naming a Tailwind palette family that is not one of ours, as
 * `family → the utilities that named it`.
 */
export function offTokenFamilies(classNameList) {
  const offenders = new Map();

  for (const className of classNameList) {
    const utility = withoutVariants(className);
    // `<prefix>-<colour>` or `<prefix>-<colour>-<shade>`; the colour is the
    // last segment that is not a shade.
    const match = utility.match(/^-?[a-z]+(?:-[a-z]+)*?-([a-z]+)(?:-\d{1,3})?(?:\/\d{1,3})?$/);
    if (!match) continue;

    const family = match[1];
    if (!paletteNames.has(family) || allowedFamilies.has(family)) continue;

    if (!offenders.has(family)) offenders.set(family, new Set());
    offenders.get(family).add(className);
  }

  return offenders;
}

/**
 * An arbitrary colour value — `bg-[#7c3aed]`, `text-[rgb(124,58,237)]`.
 *
 * `offTokenFamilies` can only see utilities that *name* a palette colour, so a
 * raw hex walks straight past the criterion whose entire point is that the page
 * draws from the token layer. This closes that.
 */
export function colourEscapes(classNameList) {
  // Three shapes, and the third is the one that hides: a raw hex, a colour
  // function, and Tailwind's `color:` type hint — `bg-[color:var(--x)]` names a
  // colour without containing one, so matching on the value alone misses it.
  const arbitraryColour = /\[(color:|#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla|oklch|lab|color)\()/;
  return [...classNameList].filter((c) => arbitraryColour.test(withoutVariants(c))).sort();
}

/** Type set in pixels instead of from the scale — `text-[11px]`. */
export function arbitraryTypeSizes(classNameList) {
  return [...classNameList].filter((c) => /^-?text-\[\d+(\.\d+)?px\]$/.test(withoutVariants(c))).sort();
}

/**
 * The subtree of a `<section data-lab-section="<name>">`, so a criterion can be
 * asserted over one section while the rest of the page is still the old one.
 *
 * Deliberately a brace-counting scan rather than a regex: `[\s\S]*?</section>`
 * stops at the first close tag, which would silently truncate the moment a
 * section nests one. Returns `null` when the section is absent, which the
 * caller must treat as a failure rather than as an empty pass — a criterion
 * asserted over nothing is the vacuous-test failure of lesson-019.
 */
export function labSection(html, name) {
  const open = new RegExp(`<section\\b[^>]*\\bdata-lab-section="${name}"[^>]*>`);
  const start = html.search(open);
  if (start === -1) return null;

  const bodyStart = start + html.slice(start).match(open)[0].length;
  let depth = 1;
  let i = bodyStart;

  while (depth > 0 && i < html.length) {
    const nextOpen = html.indexOf('<section', i);
    const nextClose = html.indexOf('</section>', i);
    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + '<section'.length;
    } else {
      depth -= 1;
      if (depth === 0) return html.slice(bodyStart, nextClose);
      i = nextClose + '</section>'.length;
    }
  }

  return null;
}
