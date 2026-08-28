/**
 * Unit tests for the two pure functions in `scripts/diagrams.mjs` (WEB-080).
 *
 * `lab-diagrams.test.mjs` drives the pipeline end to end through its CLI, which
 * is the contract that matters. These cover the two pieces whose failure would
 * be quiet rather than loud: a minifier guard that fires on the wrong input, and
 * referential checks that pass something they should not.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { minify, topologyErrors } from '../scripts/diagrams.mjs';

test('minify strips whitespace without touching values', () => {
  assert.equal(minify('.a {\n  fill: red;\n}'), '.a{fill:red}');
  assert.equal(minify('svg {\n  --x: rgba(1, 2, 3, 0.4);\n}'), 'svg{--x:rgba(1,2,3,0.4)}');
});

test('minify refuses input its whitespace stripping would corrupt', () => {
  for (const css of ['.a{background:url(data:image/png;base64,AAA)}', '.a::before{content:": "}']) {
    assert.throws(() => minify(css), /would corrupt|minification/, `accepted: ${css}`);
  }
});

test('minify does not mistake align-content for content', () => {
  // The guard's first form matched the substring `content:` inside these, so a
  // flexbox rule anywhere in archify's stylesheet would have failed the build
  // with a message about a corruption risk that does not exist.
  for (const property of ['align-content', 'justify-content', 'place-content']) {
    assert.doesNotThrow(() => minify(`.a{${property}:center}`), `${property} tripped the guard`);
  }
});

const componentsOf = (...ids) => ids.map((id) => ({ id, type: 'backend', label: id }));

test('topologyErrors accepts an IR whose references all resolve', () => {
  assert.deepEqual(
    topologyErrors({
      components: componentsOf('a', 'b'),
      connections: [{ from: 'a', to: 'b' }],
      boundaries: [{ wraps: ['a', 'b'] }],
      meta: { views: [{ focus: ['a'] }] },
    }),
    [],
  );
});

test('topologyErrors rejects what the schema cannot see', () => {
  const cases = [
    [{ components: componentsOf('a', 'a') }, /declared more than once/],
    [{ components: componentsOf('a'), connections: [{ from: 'a', to: 'ghost' }] }, /connections\[0\]\.to/],
    [{ components: componentsOf('a'), connections: [{ from: 'ghost', to: 'a' }] }, /connections\[0\]\.from/],
    [{ components: componentsOf('a'), boundaries: [{ wraps: ['ghost'] }] }, /boundaries\[0\]\.wraps\[0\]/],
    [{ components: componentsOf('a'), meta: { views: [{ focus: ['ghost'] }] } }, /meta\.views\[0\]\.focus\[0\]/],
  ];
  for (const [ir, expected] of cases) {
    const errors = topologyErrors(ir);
    assert.ok(errors.length > 0, `accepted: ${JSON.stringify(ir)}`);
    assert.match(errors.join('\n'), expected);
  }
});

test('topologyErrors leaves schema violations to the schema', () => {
  // A component with no id is the schema's finding, not this function's; it must
  // not also report it as a broken reference or the error output doubles up.
  assert.deepEqual(topologyErrors({ components: [{ type: 'backend', label: 'no id' }] }), []);
});
