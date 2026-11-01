/**
 * Colour arithmetic for the focus indicator check (#114).
 *
 * An outline is painted outside its element, so the colour that matters is what
 * lies behind the element, not the element's own fill. `backdrop` composites
 * that from the computed backgrounds, and a colour it cannot read is an error:
 * guessing white would turn a dark panel into a pass.
 */

const CHANNELS = /^rgba?\(([\d.]+),?\s*([\d.]+),?\s*([\d.]+)(?:[,/]\s*([\d.]+%?))?\s*\)$/;
const SRGB = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/;

function alpha(raw) {
  if (raw === undefined) return 1;
  return raw.endsWith('%') ? Number.parseFloat(raw) / 100 : Number(raw);
}

/** `{ r, g, b, a }` from a computed colour, with channels 0-255. */
export function parseColour(value) {
  const rgb = value.match(CHANNELS);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: alpha(rgb[4]) };
  const srgb = value.match(SRGB);
  if (srgb) {
    return { r: srgb[1] * 255, g: srgb[2] * 255, b: srgb[3] * 255, a: alpha(srgb[4]) };
  }
  throw new Error(`cannot read colour: ${value}`);
}

/** `top` painted over an opaque `bottom`. */
export function composite(top, bottom) {
  const over = (channel) => top[channel] * top.a + bottom[channel] * (1 - top.a);
  return { r: over('r'), g: over('g'), b: over('b'), a: 1 };
}

function luminance({ r, g, b }) {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** The WCAG contrast ratio of two opaque colours. */
export function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Every colour named in a computed `background-image` gradient. */
export function gradientStops(backgroundImage) {
  return [...backgroundImage.matchAll(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)/g)].map((match) => parseColour(match[0]));
}

/**
 * The opaque colours behind an element, from its nearest ancestor outwards.
 *
 * Each layer is `{ backgroundColor, backgroundImage }` as computed. A gradient
 * yields one candidate per stop, so the caller can hold the worst to the bar.
 */
export function backdrop(layers) {
  const white = { r: 255, g: 255, b: 255, a: 1 };
  let below = [white];
  for (const layer of [...layers].reverse()) {
    const fill = parseColour(layer.backgroundColor);
    below = below.map((colour) => composite(fill, colour));
    const stops = gradientStops(layer.backgroundImage);
    if (stops.length > 0) below = stops.flatMap((stop) => below.map((colour) => composite(stop, colour)));
  }
  return below;
}

/** What is wrong with an element's computed focus indicator, or an empty list. */
export function indicatorProblems({ outlineStyle, outlineWidth, outlineColor, layers }) {
  if (outlineStyle === 'none') return ['no outline'];
  const problems = [];
  if (Number.parseFloat(outlineWidth) < 2) problems.push(`outline is ${outlineWidth}`);
  const ring = parseColour(outlineColor);
  const worst = Math.min(...backdrop(layers).map((colour) => contrast(composite(ring, colour), colour)));
  if (worst < 3) problems.push(`outline contrast ${worst.toFixed(2)}:1`);
  return problems;
}
