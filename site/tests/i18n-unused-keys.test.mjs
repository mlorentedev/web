/**
 * Every key in `i18n/ui.ts` is read by something (WEB-146, WEB-160, WEB-038).
 *
 * Deleting a component leaves its keys behind, and nothing fails on a key no one
 * reads. That is how `ui.ts` grew from 30 dead keys to 192: #267 deleted
 * `IdpPage.astro` and orphaned the whole `idp.*` family in one commit. The dead
 * keys were not harmless. They still carried claims the pages had retracted
 * ("67–82%" context reduction, "<30s" reconcile, "≥ 99.5%"), so every grep for a
 * retired claim found them, and any new component could publish one again.
 *
 * A key counts as read when it appears as a quoted literal ('…', "…" or `…`)
 * in any file under `src` other than `ui.ts`. Every `t()` call in the site
 * passes a literal today. A key assembled at runtime (t(`lab.${slug}`)) would
 * read as unused, so such a prefix must be declared in `dynamicPrefixes` below,
 * with the file that builds it. Do not disable the test instead.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src');
const uiPath = join('i18n', 'ui.ts');

/** Key prefixes built at runtime, each with the file that builds it. None today. */
const dynamicPrefixes = [];

const uiSource = readFileSync(join(srcDir, uiPath), 'utf8');
const keys = [...new Set([...uiSource.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]))];

const corpus = readdirSync(srcDir, { recursive: true })
  .filter((p) => /\.(astro|ts|tsx|js|mjs|md|mdx)$/.test(p) && p !== uiPath)
  .map((p) => readFileSync(join(srcDir, p), 'utf8'))
  .join('\n');

const isRead = (key) =>
  ["'", '"', '`'].some((q) => corpus.includes(`${q}${key}${q}`)) ||
  dynamicPrefixes.some((prefix) => key.startsWith(prefix));

test('ui.ts has keys, and the reader finds one it knows is used', () => {
  assert.ok(keys.length > 0, 'no keys parsed from ui.ts — nothing is being checked');
  // nav.lab is rendered by Header.astro; if this fails, the parser or the corpus broke, not ui.ts.
  assert.ok(isRead('nav.lab'), 'nav.lab is not found as read — the corpus walk is broken');
});

test('every key in ui.ts is written in the one form the reader parses', () => {
  // Keys are parsed as an indented, single-quoted property. A key in another form
  // ("nav.foo": or `nav.foo`:) would be skipped silently, never checked and never
  // reported, so any such key fails here instead.
  const otherForms = [...uiSource.matchAll(/^\s+(["`])([^"`]+)\1\s*:/gm)].map((m) => m[2]);
  assert.deepEqual(otherForms, [], `ui.ts keys not single-quoted, so the guard cannot see them: ${otherForms.join(', ')}`);
});

test('every key in ui.ts is read somewhere under src', () => {
  const unread = keys.filter((k) => !isRead(k));
  assert.deepEqual(
    unread,
    [],
    `${unread.length} of ${keys.length} ui.ts keys are read nowhere under src. Remove them from both locales:\n  ${unread.join('\n  ')}`,
  );
});
