import type { APIRoute } from 'astro';

import { ghchartUpstream } from '../data/site';

/**
 * The GitHub contribution chart, fetched once at build time and served from
 * this site (#549). Embedding it from ghchart.rshah.org handed every visitor's
 * IP to a third party and was the site's only request to another origin.
 *
 * The chart is decorative, so a failed fetch must not block a release: the
 * build warns and serves an empty chart with the same size, and the image
 * still links to the profile. Anything that is not an SVG counts as a failure,
 * so an error page from upstream is never served as the chart.
 */
const WIDTH = 663;
const HEIGHT = 104;

async function chart(): Promise<string> {
  try {
    const response = await fetch(ghchartUpstream, { signal: AbortSignal.timeout(15_000) });
    const body = await response.text();
    if (!response.ok || !/^\s*(<\?xml[^>]*>\s*)?(<!DOCTYPE[^>]*>\s*)?<svg[\s>]/.test(body)) {
      throw new Error(`HTTP ${response.status}, ${body.length} bytes, not an SVG`);
    }
    return body;
  } catch (error) {
    console.warn(`[github-activity] ${ghchartUpstream}: ${(error as Error).message}; serving an empty chart`);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" data-fallback="true"></svg>\n`;
  }
}

export const GET: APIRoute = async () => new Response(await chart());
