/**
 * A reinstall of archify gets the build the diagrams were rendered with (#252).
 *
 * Without a ref, `npx skills add` takes the default branch, which moves. The
 * install command in the docs must carry the same ref as the lockfile, or
 * following it undoes the pin.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const { ref } = JSON.parse(read('skills-lock.json')).skills.archify;

test('the lockfile pins archify to a release tag', () => {
  assert.match(ref, /^v\d+\.\d+\.\d+$/);
});

for (const path of ['site/scripts/diagrams.mjs', 'site/vendor/archify-schemas/README.md']) {
  test(`${path} installs the pinned ref`, () => {
    const commands = read(path).match(/npx skills add \S+/g) ?? [];
    assert.ok(commands.length > 0, 'no install command found');
    for (const command of commands) assert.ok(command.includes(`#${ref}`), command);
  });
}
