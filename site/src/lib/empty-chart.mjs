/**
 * The empty chart the build serves when the GitHub chart cannot be (#549,
 * WEB-199). It is the site's own output, not upstream's, so it is recognised by
 * its exact shape and never passed through the upstream allowlist
 * (`safe-svg.mjs`), which would refuse its `data-fallback` attribute.
 *
 * The attribute carries why the build fell back: a failed fetch (`HTTP 500`, a
 * timeout) or a body the allowlist refused (`refused: element <script>`). The
 * test fails CI only on a refusal: an upstream outage is not the PR's doing.
 *
 * Plain JavaScript so the tests import it without a build.
 */

export const WIDTH = 663;
export const HEIGHT = 104;

// XML forbids most control characters even escaped, so they become `?`: an
// upstream element name carrying one must not make the empty chart unreadable.
const escape = (text) => text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '?').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unescape = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

/** @param {string} reason why the build fell back @returns {string} */
export const emptyChart = (reason) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" data-fallback="${escape(reason)}"></svg>\n`;

// The whole document, with the reason as the one variable part: a body that
// only contains `data-fallback` somewhere is not the empty chart.
const SHAPE = new RegExp(`^${emptyChart('REASON').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('REASON', '([^"<>]*)')}$`);

/** @param {string} svg @returns {string | null} the reason, when `svg` is exactly an empty chart */
export function fallbackReason(svg) {
  const m = SHAPE.exec(svg);
  return m ? unescape(m[1]) : null;
}

/** A refusal means upstream sent something that is not a chart: that is worth a red PR. */
export const isRefusal = (reason) => reason.startsWith('refused:');
