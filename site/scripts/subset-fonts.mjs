/**
 * Cut the Roboto faces down to what an EN/ES site can show (#138).
 *
 *   npm run fonts
 *
 * `vendor/roboto/` holds the full faces; `public/fonts/` is generated from them
 * and committed, so a build needs no font tooling. A character outside these
 * ranges falls back to the next family in the stack, and
 * `tests/fonts.test.mjs` fails if the built pages ever need one.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import subsetFont from 'subset-font';

const here = dirname(fileURLToPath(import.meta.url));
const FACES = ['Regular', 'Medium', 'Bold', 'Black'];

/** Latin, Latin Extended-A, punctuation, the euro sign and arrows. */
export const RANGES = [
  [0x20, 0x7e],
  [0xa0, 0x17f],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2190, 0x21ff],
];

export const text = RANGES.flatMap(([from, to]) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)),
).join('');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const face of FACES) {
    const source = readFileSync(join(here, `../vendor/roboto/Roboto-${face}.woff2`));
    const subset = await subsetFont(source, text, { targetFormat: 'woff2' });
    writeFileSync(join(here, `../public/fonts/Roboto-${face}.woff2`), subset);
    console.log(`Roboto-${face}: ${source.length} -> ${subset.length} bytes`);
  }
}
