/**
 * Cut the faces down to what an EN/ES site can show (#138, WEB-197).
 *
 *   npm run fonts
 *
 * `vendor/` holds the full faces, each family with its licence; `public/fonts/`
 * is generated from them and committed, so a build needs no font tooling. A
 * character outside these ranges falls back to the next family in the stack,
 * and `tests/fonts.test.mjs` fails if the built pages ever need one.
 *
 * Roboto sets the text, Archivo the headings and JetBrains Mono everything in
 * `font-mono`. The two newer families ship one variable file each, pinned to
 * the weights the site uses: one file over a weight range costs less than a
 * static file per weight (JetBrains Mono at 400 to 600 is 34 KB, three static
 * weights 69 KB).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import subsetFont from 'subset-font';

const here = dirname(fileURLToPath(import.meta.url));

/** Latin, Latin Extended-A, punctuation, the euro sign and arrows. */
export const RANGES = [
  [0x20, 0x7e],
  [0xa0, 0x17f],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2190, 0x21ff],
];

/** Box drawing, which the mono face also carries: the trees in code blocks line up only in one face. */
export const MONO_RANGES = [...RANGES, [0x2500, 0x257f]];

const textOf = (ranges) =>
  ranges.flatMap(([from, to]) =>
    Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)),
  ).join('');

export const text = textOf(RANGES);

/** Each generated file: its source under `vendor/`, and the axes it is pinned to. */
export const JOBS = [
  ...['Regular', 'Medium', 'Bold', 'Black'].map((face) => ({
    source: `roboto/Roboto-${face}.woff2`,
    out: `Roboto-${face}.woff2`,
    ranges: RANGES,
  })),
  {
    source: 'archivo/Archivo[wdth,wght].ttf',
    out: 'Archivo.woff2',
    ranges: RANGES,
    // The headings ask for 500 to 800. The one at 500 renders at 600, which
    // costs less than widening the file for it.
    variationAxes: { wght: { min: 600, max: 800 }, wdth: 100 },
  },
  {
    source: 'jetbrains-mono/JetBrainsMono[wght].ttf',
    out: 'JetBrainsMono.woff2',
    ranges: MONO_RANGES,
    variationAxes: { wght: { min: 400, max: 600 } },
  },
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const { source: from, out, ranges, variationAxes } of JOBS) {
    const source = readFileSync(join(here, '../vendor', from));
    const subset = await subsetFont(source, textOf(ranges), { targetFormat: 'woff2', variationAxes });
    writeFileSync(join(here, '../public/fonts', out), subset);
    console.log(`${out}: ${source.length} -> ${subset.length} bytes`);
  }
}
