import type { APIRoute } from 'astro';

import { ghchartUpstream } from '../data/site';
import { emptyChart } from '../lib/empty-chart.mjs';
import { unsafeSvg } from '../lib/safe-svg.mjs';

/**
 * The GitHub contribution chart, fetched once at build time and served from
 * this site (#549). Embedding it from ghchart.rshah.org handed every visitor's
 * IP to a third party and was the site's only request to another origin.
 *
 * The chart is decorative, so a failed fetch must not block a release: the
 * build warns and serves an empty chart with the same size, and the image
 * still links to the profile; the empty chart says why (`lib/empty-chart.mjs`). A body that is not an SVG of rectangles and text
 * counts as a failure (`lib/safe-svg.mjs`), so neither an error page nor a
 * script from upstream is ever served from this origin.
 */
async function chart(): Promise<string> {
  try {
    const response = await fetch(ghchartUpstream, { signal: AbortSignal.timeout(15_000) });
    const body = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const refused = unsafeSvg(body);
    if (refused) throw new Error(`refused: ${refused}`);
    return body;
  } catch (error) {
    // Not every throw is an Error: the fallback must not fail on its own reason.
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[github-activity] ${ghchartUpstream}: ${reason}; serving an empty chart`);
    return emptyChart(reason);
  }
}

export const GET: APIRoute = async () =>
  new Response(await chart(), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
