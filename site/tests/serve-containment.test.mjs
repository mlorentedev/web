/**
 * The `dist/` test server cannot be walked out of (CWE-22).
 *
 *   npm test
 *
 * ## Why this exists
 *
 * `tests/lib/serve.mjs` backs both browser checks — `lab-containment.mjs` and
 * `lab-axe.mjs` — and runs in CI. Until PR7's adversarial review it did
 * `join(distDir, decodeURIComponent(req.url))` and nothing else, which is a
 * path traversal: `join` *normalises* `..` rather than rejecting it, so enough
 * of them walk out of `dist/` and the server reads whatever is on the far side.
 *
 * Reproduced against the real server before the fix: `GET /../../../../etc/passwd`
 * returned **404**, and `GET /../../../../../../../etc/passwd` returned **200
 * with the file**. That gap is the reason this file exists rather than a
 * comment — a check written at the shallower depth would have concluded the
 * server was safe, which is `lesson-016` exactly: a test that only ever runs
 * against a case that happens to pass proves nothing.
 *
 * The exposure was always small — localhost, an ephemeral port, alive for the
 * ~30 s a browser check runs, never in the deployed image. It is fixed anyway,
 * because "small exposure" is a judgement that has to be re-made every time the
 * file is reused, and the next reuse is the one nobody re-judges.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import test from 'node:test';

import { distDir, resolveWithinDist } from './lib/serve.mjs';

/**
 * Depths from 1 to 12, so the suite cannot repeat the mistake of probing at a
 * depth too shallow to escape and reading the resulting 404 as containment.
 */
const ESCAPES = [
  ...Array.from({ length: 12 }, (_, i) => `/${'../'.repeat(i + 1)}etc/passwd`),
  // Percent-encoded `/`, which a filter on the raw request string never sees.
  `/${'..%2f'.repeat(9)}etc/passwd`,
  `/..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd`,
  // Absolute, and backslash-separated for good measure.
  '/etc/passwd'.replace('/etc', '//etc'),
  `/${'..\\'.repeat(9)}etc/passwd`,
];

test('no traversal depth escapes dist/', () => {
  for (const path of ESCAPES) {
    const resolved = resolveWithinDist(path);
    assert.ok(
      resolved === null || resolved.startsWith(resolve(distDir)),
      `${path} resolved to ${resolved}, which is outside ${resolve(distDir)}`,
    );
  }
});

test('the escape probes are real escapes, not a vacuous list', () => {
  // The guard against this test being satisfied by paths that were never
  // dangerous. Without the containment check, at least one of these must
  // genuinely land on a file outside dist/ — otherwise the suite above would
  // pass on a server with no protection at all, which is the failure it exists
  // to prevent (`lesson-019`).
  const naive = (p) => resolve(distDir, `.${'/'}${decodeURIComponent(p).replace(/\\/g, '/')}`);
  const escaped = ESCAPES.filter((p) => {
    try {
      return !naive(p).startsWith(resolve(distDir));
    } catch {
      return false;
    }
  });

  assert.ok(
    escaped.length > 0,
    'no probe in ESCAPES leaves dist/ even without the guard — the list proves nothing',
  );

  // And at least one must reach something that actually exists on this machine,
  // or "outside dist/" is still only a string property.
  assert.ok(
    escaped.some((p) => existsSync(naive(p))),
    `none of the ${escaped.length} escaping probes reach an existing file — ` +
      `the traversal would have been unobservable and the test toothless`,
  );
});

test('ordinary paths still resolve, so the guard is not simply refusing everything', () => {
  // The other half of `lesson-019`: a guard that rejects every input passes any
  // security test and breaks the thing it guards.
  for (const path of ['/lab/', '/lab/index.html', '/es/lab/', '/']) {
    const resolved = resolveWithinDist(path);
    assert.ok(resolved !== null, `${path} was refused, but it is inside dist/`);
    assert.ok(
      resolved.startsWith(resolve(distDir)),
      `${path} resolved outside dist/: ${resolved}`,
    );
  }
});

test('a malformed or null-byte path is refused rather than thrown on', () => {
  // `decodeURIComponent('%')` throws; an unhandled throw inside the request
  // handler takes the server down mid-run and the browser check reports it as
  // a page failure, which is a confusing way to learn about a bad URL.
  assert.equal(resolveWithinDist('/%'), null);
  assert.equal(resolveWithinDist('/lab/%zz'), null);
  assert.equal(resolveWithinDist('/lab/\0.html'), null);
});

test('the resolver is anchored to dist/, whatever the working directory', () => {
  // `serve.mjs` resolves `distDir` from `import.meta.url` precisely so the
  // browser checks work from any cwd; this asserts the containment inherits it.
  assert.equal(basename(resolve(distDir)), 'dist');

  // A sibling of `dist/` is outside and must be refused.
  assert.equal(resolveWithinDist('/../src/pages/lab.astro'), null);

  // But a path that leaves and comes back is *inside*, and must be allowed.
  //
  // This assertion was written the other way round first and failed, and the
  // failure was the test's, not the code's: `/../dist/lab/index.html` resolves
  // to a real file within `dist/`. Refusing it would be a resolver that judges
  // the spelling of a path rather than where it lands — which is the same
  // mistake as filtering the raw request string for `..` and missing `%2f`.
  // Containment is a property of the destination, so it is asserted there.
  assert.equal(
    resolveWithinDist('/../dist/lab/index.html'),
    resolve(distDir, 'lab/index.html'),
  );
});
