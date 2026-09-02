/**
 * The Lab stays inside its weight budget (WEB-080, AC6).
 *
 *   npm run build && npm test
 *
 * ## The budget, and the unit it is actually in
 *
 * `verification.md` fixes it as "the built `/lab` HTML including both inline
 * SVGs stays under **150 KB** uncompressed, fonts excluded", derived from two
 * diagrams at 21,929 B each leaving room for five sections of markup and prose.
 *
 * "150 KB" is ambiguous by 3,600 bytes, and the document is not self-consistent
 * about which it meant: the page figures recorded through PR4–PR6 (94.6, 102.3,
 * 103.0) are the byte counts divided by 1024, while the derivation's "leaving
 * ~106 KB" is decimal. **So this takes the stricter reading, 150,000 bytes.**
 * Anything that passes here passes both, which is the only resolution that
 * cannot make the guard weaker than the sentence it enforces. PR7 writes the
 * same number back into `verification.md` so the two stop disagreeing.
 *
 * ## What it weighs, and why that is the whole file
 *
 * The built HTML, both locales. Fonts, CSS and images are excluded by AC6 and
 * are excluded here by construction — they are separate requests, and the thing
 * the budget is about is the cost of having chosen to inline two SVGs rather
 * than serve them as `<img>` (PR0's decision, for #244's reason). That cost is
 * in this file and nowhere else.
 *
 * ## It is a guard, not a driver
 *
 * Green the moment it was written — the page is at 68% of the budget with
 * ~46 KB of headroom. It is written anyway because AC6 asks for the tension
 * with #138 (the site's own weight work) to be visible in CI rather than
 * discovered later, and because the next person to inline a diagram should find
 * out from a failing test rather than from a Lighthouse run.
 */

import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { distDir } from './lib/serve.mjs';

/**
 * 150 KB, read as 150,000 bytes — the stricter of the two readings in
 * `verification.md`. See the header.
 */
const BUDGET_BYTES = 150_000;

const PAGES = [
  ['en', join(distDir, 'lab/index.html')],
  ['es', join(distDir, 'es/lab/index.html')],
];

for (const [locale, page] of PAGES) {
  test(`[${locale}] the built Lab page exists`, () => {
    assert.ok(
      existsSync(page),
      `${page} not found — this suite reads the built site, so run \`npm run build\` first`,
    );
  });

  test(`[${locale}] the built Lab page is under the AC6 budget`, () => {
    // Guarded rather than skipped: a missing file has size 0, which would sail
    // under any budget and report the emptiest possible page as the lightest.
    assert.ok(existsSync(page), `${page} not found — run \`npm run build\` first`);

    const bytes = statSync(page).size;
    assert.ok(
      bytes < BUDGET_BYTES,
      `dist/${locale === 'en' ? '' : 'es/'}lab/index.html is ${bytes.toLocaleString('en-US')} B, ` +
        `over the ${BUDGET_BYTES.toLocaleString('en-US')} B budget from verification.md § "AC6 budget". ` +
        `Both diagrams are inline (~48 KB of it); if a third one is being added, the budget is the ` +
        `decision to revisit, not the assertion.`,
    );
  });
}

test('the budget leaves room for what it was derived from', () => {
  // The budget is not a round number someone liked: it is two inline diagrams
  // at 21,929 B plus room for the sections. If a future edit tightened it below
  // what the diagrams alone cost, every page would fail for a reason that has
  // nothing to do with the page.
  const INLINE_DIAGRAM_BYTES = 43_858;
  assert.ok(
    BUDGET_BYTES > INLINE_DIAGRAM_BYTES * 2,
    `the ${BUDGET_BYTES} B budget leaves less than the ${INLINE_DIAGRAM_BYTES} B of inline SVG ` +
      `it was derived around — re-derive it in verification.md rather than lowering it here`,
  );
});
