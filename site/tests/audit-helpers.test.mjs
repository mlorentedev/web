/**
 * Fixture tests for `tests/lib/audit.mjs` — the parsing the design-system
 * criteria rest on.
 *
 * These run against literals, never against `dist/`, so they are green from the
 * day they are written and belong in `npm test` now rather than in PR6. That
 * matters more than it sounds: `lab-audit.mjs` is red until the cut-over and
 * therefore stays out of CI, so until this file existed the only proof that
 * `colourEscapes` fires at all ran on demand, on a developer's machine.
 *
 * An untested guard is the failure lesson-019 is about, and both of the holes
 * covered below were found *after* the guard shipped, not before.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arbitraryTypeSizes,
  classNames,
  colourEscapes,
  labSection,
  offTokenFamilies,
  withoutVariants,
} from './lib/audit.mjs';

test('variants are stripped, and only the ones outside brackets', () => {
  assert.equal(withoutVariants('text-accent-700'), 'text-accent-700');
  assert.equal(withoutVariants('dark:hover:text-accent-700'), 'text-accent-700');
  assert.equal(withoutVariants('!text-accent-700'), 'text-accent-700');
  // The colon here is Tailwind's type hint, inside the brackets. Cutting at it
  // drops the `[`, which is what let an arbitrary colour past the guard.
  assert.equal(withoutVariants('bg-[color:rgb(1,2,3)]'), 'bg-[color:rgb(1,2,3)]');
  assert.equal(withoutVariants('md:bg-[color:var(--x)]'), 'bg-[color:var(--x)]');
});

test('the raw-colour guard actually fires', () => {
  const shouldCatch = [
    'bg-[#7c3aed]',
    'text-[#fff]',
    'dark:border-[rgb(1,2,3)]',
    'text-[hsl(20,10%,5%)]',
    // Tailwind's type hint. The colon is inside the brackets, which is exactly
    // what the first version of `withoutVariants()` mistook for a variant.
    'bg-[color:rgb(1,2,3)]',
    'dark:hover:text-[color:var(--brand)]',
  ];
  const shouldPass = ['bg-accent-700', 'text-[10px]', 'w-[754px]', 'grid-cols-[1fr_auto]'];

  assert.deepEqual(colourEscapes(shouldCatch), [...shouldCatch].sort(), 'the guard missed a raw colour');
  assert.deepEqual(colourEscapes(shouldPass), [], 'the guard flagged a non-colour arbitrary value');
});

test('off-token families are named, and token families are not', () => {
  const offenders = offTokenFamilies([
    'text-cyan-700',
    'dark:bg-gray-100',
    'text-accent-700',
    'border-ink-100',
    'bg-white',
    'flex',
    'py-14',
  ]);

  assert.deepEqual([...offenders.keys()].sort(), ['cyan', 'gray']);
  assert.deepEqual([...offenders.get('gray')], ['dark:bg-gray-100'], 'the offending utility is reported verbatim');
});

test('arbitrary pixel type is caught, other arbitrary values are not', () => {
  assert.deepEqual(
    arbitraryTypeSizes(['text-[11px]', 'md:text-[10px]', 'text-sm', 'w-[754px]', 'text-[0.8rem]']),
    ['md:text-[10px]', 'text-[11px]'],
  );
});

test('class attributes are read out of markup', () => {
  const found = classNames('<div class="a b"><span class="b c"></span></div>');
  assert.deepEqual([...found].sort(), ['a', 'b', 'c']);
});

test('a lab section is extracted, and a nested section does not truncate it', () => {
  const html = [
    '<section data-lab-section="services"><p class="outer"></p>',
    '<section class="nested"><p class="inner"></p></section>',
    '<p class="tail"></p></section>',
    '<section data-lab-section="infra"><p class="other"></p></section>',
  ].join('');

  const services = labSection(html, 'services');
  assert.ok(services.includes('inner'), 'the nested section truncated the subtree');
  assert.ok(services.includes('tail'), 'markup after the nested section was lost');
  assert.ok(!services.includes('other'), 'the extraction ran past its own closing tag');

  assert.deepEqual([...classNames(labSection(html, 'infra'))], ['other']);
});

test('an absent section is null, never an empty pass', () => {
  // The distinction the callers depend on: a criterion asserted over an empty
  // string passes vacuously, which is worse than failing.
  assert.equal(labSection('<section data-lab-section="services"></section>', 'infra'), null);
  assert.equal(labSection('<div></div>', 'services'), null);
});
