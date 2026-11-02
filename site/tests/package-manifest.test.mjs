/**
 * `package.json` says what ships and leaves the product version alone (#352).
 *
 * The runtime image holds nginx and static files, so a build tool in
 * `dependencies` makes `npm audit --omit=dev` report on code no visitor reaches.
 * release-please owns the product version in `.release-please-manifest.json`:
 * this field is a placeholder, so it cannot pass for that version.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('the type checker is a build tool, not a production dependency', () => {
  assert.equal(pkg.dependencies['@astrojs/check'], undefined);
  assert.ok(pkg.devDependencies['@astrojs/check']);
});

test('the package version cannot be read as the product version', () => {
  assert.equal(pkg.version, '0.0.0');
});
