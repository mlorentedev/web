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
    '/*',
    "  t('idp.title') has no star in front",
    '*/',
    "const glob = 'src/**/*.md';",
    "const label = t('nav.lab');",
  ].join('\n');
  const code = withoutComments(source, 'Header.astro');
  assert.doesNotMatch(code, /platform\.nodes|nav\.toggle|platform\.diagrams|idp\.title/);
  assert.match(code, /'nav\.lab'/);
  assert.match(code, /src\/\*\*\/\*\.md/);
});

test('markdown keeps its list items and loses its comments', () => {
  const source = "* see 'nav.lab'\n<!-- t('nav.toggle') -->\n{/* t('404.cta') */}";
  const prose = withoutComments(source, 'note.mdx');
  assert.match(prose, /'nav\.lab'/);
  assert.doesNotMatch(prose, /nav\.toggle|404\.cta/);
});
