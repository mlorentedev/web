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
  readableNodes,
  readableText,
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
  // Tailwind 4 spellings (WEB-022): `!` moved to the end, and a CSS variable
  // can be named in parentheses, whose type hint carries a colon of its own.
  assert.equal(withoutVariants('text-accent-700!'), 'text-accent-700');
  assert.equal(withoutVariants('md:text-(color:--brand)'), 'text-(color:--brand)');
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
    // Tailwind 4's variable shorthand names a colour with no brackets at all,
    // so the bracket shapes above never see it (WEB-022).
    'bg-(--brand)',
    'md:border-(--x)',
    'hover:text-(color:--brand)',
  ];
  const shouldPass = [
    'bg-accent-700', 'text-[10px]', 'w-[754px]', 'grid-cols-[1fr_auto]',
    // A variable is only a colour escape on a colour utility, and a non-colour
    // type hint says it is not one.
    'w-(--sidebar)', 'text-(length:--size)',
  ];

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

test('readable text keeps what a reader or a search engine reads, and nothing else', () => {
  const html = [
    '<head><title>Rules &amp; gates</title><meta name="description" content="Meta line">',
    '<script type="application/ld+json">{"name":"JSON-LD line"}</script>',
    '<script>const hidden = "inline script";</script><style>.x{color:red}</style></head>',
    '<body><p>Zero&#8209;Debt &#x41;gents</p><img src="a.png" alt="Alt line">',
    '<a aria-label="Aria line" data-node-label="data only">link</a></body>',
  ].join('');

  const text = readableText(html);
  for (const kept of ['Rules & gates', 'Meta line', 'JSON-LD line', 'Zero\u2011Debt Agents', 'Alt line', 'Aria line', 'link']) {
    assert.ok(text.includes(kept), `lost "${kept}" from: ${text}`);
  }
  for (const dropped of ['inline script', 'color:red', 'data only', '<p>']) {
    assert.ok(!text.includes(dropped), `kept "${dropped}", which no reader sees: ${text}`);
  }
});

test('readable nodes come one per text node, and a skipped element takes its children with it', () => {
  const html = [
    '<head><title>Title &amp; more</title><meta name="theme-color" content="#ecfeff">',
    '<meta property="og:description" content="Share line"><meta name="twitter:card" content="summary">',
    '<script>const hidden = "inline script";</script></head>',
    '<body><p>Hola <b>mundo</b></p><img src="a.png" alt="Alt line">',
    '<div translate="no"><div>nested name</div><span>still skipped</span></div><p>after</p>',
    '<svg><svg><text>inner</text></svg><text>outer</text></svg><p>end</p></body>',
  ].join('');

  const nodes = readableNodes(html, (tag, attributes) => tag === 'svg' || /translate="no"/.test(attributes));
  assert.deepEqual(nodes, ['Title & more', 'Hola', 'mundo', 'after', 'end', 'Alt line', 'Share line']);
});
