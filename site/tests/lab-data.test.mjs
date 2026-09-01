/**
 * The Lab's data contract (WEB-080, AC3).
 *
 * The page's claim is "measured, not typed". It cannot back that on its own —
 * `platform.json` has no producer yet (#162) — so the honest version is that
 * the page prints when the manifest was generated and from which commit, and
 * a reader can judge the staleness themselves. That only works if the fields
 * are there, which is what the first group of tests asserts.
 *
 * The second group is the bilingual contract of What §5: every translatable
 * string has an `es` twin, whether it lives in `i18n/ui.ts` or in a data field
 * (`descriptionEs`, `categoryEs`, `roleEs`, …). Identifiers are excepted per
 * Risk §1 — machine names, protocols, paths and environment names are the same
 * on both locales — but those live inside the diagram SVGs, not here, so
 * nothing in this file needs the exception.
 *
 * Two notes on how these are written, both of them scars:
 *
 *   - **Every check is preceded by a guard that it has something to check.**
 *     A twin test over an empty key set passes and proves nothing; so does a
 *     required-field test over an empty collection. That is lesson-019, and it
 *     is why the counts are asserted before the properties.
 *   - **The i18n twin test covers the whole of `ui.ts`, not just the Lab's
 *     namespace.** The spec says `lab.*`, but no key is called that yet — the
 *     page's strings are still under `idp.*` and the rename lands with the
 *     sections. Scoping the test to `lab.*` today would make it vacuous on the
 *     exact PR that introduces it. Checking every namespace is non-vacuous now,
 *     covers `lab.*` the moment it exists, and catches drift in the other
 *     fifteen namespaces for free.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');

const manifest = JSON.parse(readFileSync(join(siteRoot, 'src/data/platform.json'), 'utf8'));
const platformTs = readFileSync(join(siteRoot, 'src/data/platform.ts'), 'utf8');
const uiTs = readFileSync(join(siteRoot, 'src/i18n/ui.ts'), 'utf8');

/**
 * The keys of one locale object in `ui.ts`.
 *
 * `ui.ts` is TypeScript, so it cannot simply be imported from a plain Node
 * test. It is also a flat map of quoted string keys, which makes it tractable
 * to read as text: find the locale's opening brace, take everything to the
 * line that closes it, and collect the keys. Anything subtler than a flat map
 * would need a real parser — and would be a reason to reshape the file, not to
 * make the test cleverer.
 */
function localeKeys(source, locale) {
  const opening = new RegExp(`^\\s{2}${locale}:\\s*\\{\\s*$`, 'm');
  const start = source.search(opening);
  assert.notEqual(start, -1, `no '${locale}:' locale block found in ui.ts`);

  const rest = source.slice(start);
  const end = rest.search(/^\s{2}\},?\s*$/m);
  assert.notEqual(end, -1, `the '${locale}' locale block in ui.ts is not closed`);

  const block = rest.slice(0, end);
  return new Set([...block.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]));
}

const en = localeKeys(uiTs, 'en');
const es = localeKeys(uiTs, 'es');

/** Collections whose entries are rendered on the Lab page. */
const collections = ['nodes', 'services', 'diagrams'];

/**
 * Field pairs to enforce, derived from the data rather than hard-coded: if any
 * entry of a collection carries `fooEs`, every entry must carry both `foo` and
 * `fooEs`. That is the failure that actually happens — a new service added
 * with its English description and no Spanish one — and deriving the pairs
 * means a new translatable field is covered the day it is introduced.
 */
function twinFields(entries) {
  const twins = new Set();
  for (const entry of entries) {
    for (const key of Object.keys(entry)) {
      if (key.endsWith('Es') && key.length > 2) twins.add(key.slice(0, -2));
    }
  }
  return [...twins].sort();
}

// --- Provenance -------------------------------------------------------------

test('the manifest declares when it was generated and from what', () => {
  assert.ok(
    typeof manifest.generated_at === 'string' && manifest.generated_at.length > 0,
    'platform.json has no `generated_at`',
  );
  assert.ok(
    !Number.isNaN(Date.parse(manifest.generated_at)),
    `platform.json's \`generated_at\` is not a parseable date: ${manifest.generated_at}`,
  );

  assert.ok(
    typeof manifest.source_commit === 'string',
    'platform.json has no `source_commit`',
  );
  assert.match(
    manifest.source_commit,
    /^[0-9a-f]{7,40}$/,
    'platform.json\'s `source_commit` is not a git object name',
  );
});

test('platform.ts types the provenance rather than leaving it untyped JSON', () => {
  assert.match(
    platformTs,
    /generated_at\s*:\s*string/,
    'PlatformManifest does not declare `generated_at: string`',
  );
  assert.match(
    platformTs,
    /source_commit\s*:\s*string/,
    'PlatformManifest does not declare `source_commit: string`',
  );
});

// --- Bilingual: i18n --------------------------------------------------------

test('there are keys to compare between the locales', () => {
  assert.ok(en.size > 0, 'the `en` locale block in ui.ts has no keys');
  assert.ok(es.size > 0, 'the `es` locale block in ui.ts has no keys');
});

test('every ui key exists in both locales', () => {
  const missingEs = [...en].filter((k) => !es.has(k)).sort();
  const missingEn = [...es].filter((k) => !en.has(k)).sort();

  assert.deepEqual(missingEs, [], `keys present in en and missing from es: ${missingEs.join(', ')}`);
  assert.deepEqual(missingEn, [], `keys present in es and missing from en: ${missingEn.join(', ')}`);
});

// --- Bilingual: data --------------------------------------------------------

for (const name of collections) {
  const entries = manifest[name];

  test(`${name} is a non-empty collection`, () => {
    assert.ok(Array.isArray(entries), `platform.json has no \`${name}\` array`);
    assert.ok(entries.length > 0, `platform.json's \`${name}\` is empty`);
  });

  test(`every ${name} entry carries both halves of every translated field`, () => {
    const twins = twinFields(entries);
    assert.ok(twins.length > 0, `no translated fields found on \`${name}\` — nothing is being checked`);

    const gaps = [];
    for (const [i, entry] of entries.entries()) {
      const id = entry.slug ?? entry.id ?? `#${i}`;
      for (const base of twins) {
        for (const field of [base, `${base}Es`]) {
          const value = entry[field];
          if (typeof value !== 'string' || value.trim() === '') {
            gaps.push(`${name}[${id}].${field}`);
          }
        }
      }
    }

    assert.deepEqual(gaps, [], `missing or empty translated fields:\n  ${gaps.join('\n  ')}`);
  });
}
