/**
 * `withoutComments` is what keeps a comment from counting as a read in the
 * unread-key and unread-field guards, so its cuts are pinned here.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { withoutComments } from './lib/code.mjs';

test('comment lines and HTML comments are dropped from code', () => {
  const source = [
    '/**',
    ' * Every machine in `platform.nodes`.',
    ' */',
    "// t('nav.toggle')",
    '<!-- platform.diagrams -->',
    "const label = t('nav.lab');",
  ].join('\n');
  const code = withoutComments(source, 'Header.astro');
  assert.doesNotMatch(code, /platform\.nodes|nav\.toggle|platform\.diagrams/);
  assert.match(code, /'nav\.lab'/);
});

test('markdown is left as it is, since a leading * there is a list item', () => {
  const source = "* see 'nav.lab'";
  assert.equal(withoutComments(source, 'note.mdx'), source);
});
