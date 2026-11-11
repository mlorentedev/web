/**
 * The real asset names `nginx-cache-probe.mjs` asks the running image about,
 * found by following the served pages, so the probe follows the build.
 *
 * `get(path)` returns a page's HTML. The probe passes an HTTP fetch; the static
 * test `probe-assets.test.mjs` passes a read of `dist/`, so a pull request
 * finds out when the pages stop leading to an asset. Before that test, the
 * search only ran on the published image after merge: #624 put the series
 * first on /notes/, the first note link no longer had a diagram, and every
 * release failed for four days while each pull request stayed green.
 *
 * Every note on the index is tried, in order, until one has a diagram.
 */
export async function probeAssets(get) {
  const astro = (await get('/')).match(/\/_astro\/[^"']+\.css/)?.[0];
  const notes = [...new Set([...(await get('/notes/')).matchAll(/href="(\/notes\/[^"#]+\/)"/g)].map((m) => m[1]))];
  let beoe;
  for (const note of notes) {
    beoe = (await get(note)).match(/\/beoe\/[0-9a-z]+\.svg/)?.[0];
    if (beoe) break;
  }
  return { astro, beoe };
}
