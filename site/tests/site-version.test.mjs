/**
 * The built site must state which release produced it (WEB-106, `#293`),
 * asserted against `dist/` on **both** locales.
 *
 *   npm run build && npm test
 *
 * ## Why this test exists at all
 *
 * Production served a build from 14 June for eleven consecutive releases and
 * nothing reported it (`#190`). The reason it stayed invisible is that a deploy
 * could not be verified by consequence: `curl` returning `200` proves *a* build
 * is live, never *which*. Diagnosis fell back on inference — prod 404s on
 * `/lab`, therefore it predates the Lab — and that inference expires the moment
 * two releases both have `/lab`.
 *
 * Measured 2026-09-04 while verifying 1.13.0, the two things a reader would
 * reach for instead both give a confidently wrong answer:
 *
 * - `/version.txt` → 404. `version.txt` is release-please's SSOT and it is
 *   correct, but it lives at the repo root, outside the Dockerfile's
 *   `COPY site/`, so it never entered the image.
 * - `last-modified` reported `03:02:18` on an image built at `03:26` — the
 *   mtime of a `dist/` produced by the *previous* commit's build and reused
 *   from cache, since the release commit changes no file under `site/`. The
 *   header is not lying; the inference "last-modified ≈ release" is.
 *
 * ## What this asserts, and what it deliberately does not
 *
 * The expected value is read from `version.txt` at assert time and never
 * restated here — a test carrying its own copy of the version is two sources
 * that agree until they do not, and this one would go stale on the next release
 * while still passing.
 *
 * `built_at` is **not** part of the payload and this test would fail it. A
 * timestamp in `dist/` makes the build non-reproducible: today `sha-69c0d4c`
 * and `sha-a76e8fa` share all eleven `rootfs.diff_ids`, which is how the
 * `last-modified` question above was answered at all. A per-build timestamp
 * destroys that property permanently in exchange for a field nobody queries.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const repoRoot = join(siteRoot, '..');
const dist = join(siteRoot, 'dist');

/** The SSOT: what release-please bumps, read fresh rather than hardcoded. */
const expected = readFileSync(join(repoRoot, 'version.txt'), 'utf8').trim();

const read = (...parts) => readFileSync(join(dist, ...parts), 'utf8');

test('version.txt is a bare semver — no leading v, no pre-release', () => {
  assert.match(
    expected,
    /^\d+\.\d+\.\d+$/,
    `version.txt holds "${expected}"; the prod image tag is this string verbatim, ` +
      'so anything else would name a tag that does not exist in the registry',
  );
});

test('dist/ carries the version at a machine-readable path', () => {
  const path = join(dist, 'version.json');
  assert.ok(
    existsSync(path),
    'dist/version.json is missing — run `npm run build` first, and if it is still ' +
      'absent the endpoint stopped being emitted',
  );

  const payload = JSON.parse(readFileSync(path, 'utf8'));
  assert.equal(
    payload.version,
    expected,
    'the served version disagrees with version.txt',
  );

  assert.deepEqual(
    Object.keys(payload).sort(),
    ['version'],
    'the payload grew a field. Adding one is a decision, not a detail: see the ' +
      'header on built_at and reproducibility',
  );
});

test('nginx still refuses to let /version.json be cached', () => {
  // The endpoint cannot carry this itself: a static build keeps the body and
  // discards response headers, so the guarantee lives in nginx or nowhere. It
  // is asserted here because "nowhere" and "in nginx" look identical from the
  // built output, and the failure is silent — a cached stale release number.
  const conf = readFileSync(join(siteRoot, 'nginx.conf'), 'utf8');
  const block = conf.match(/location\s*=\s*\/version\.json\s*\{([^}]*)\}/);

  assert.ok(block, 'nginx.conf has no `location = /version.json` block');
  assert.match(
    block[1],
    /add_header\s+Cache-Control\s+"no-cache"/,
    'the /version.json location exists but no longer sets Cache-Control: no-cache',
  );
});

for (const [locale, page] of [
  ['en', 'index.html'],
  ['es', join('es', 'index.html')],
]) {
  test(`the ${locale} page states the release in its markup`, () => {
    const html = read(page);
    const found = [...html.matchAll(/<meta\s+name="version"\s+content="([^"]*)"/g)];

    assert.equal(
      found.length,
      1,
      `expected exactly one <meta name="version"> in ${page}, found ${found.length}. ` +
        'It belongs in BaseLayout so every page inherits it once.',
    );
    assert.equal(found[0][1], expected, `${page} states a different release than version.txt`);
  });
}

test('both locales agree, and agreeing by both being absent does not count', () => {
  // Guards a real failure mode rather than restating the assertions above: if
  // the meta tag were rendered from a per-locale source, `es` could drift while
  // both pages still individually matched a *stale* version.txt during a bump.
  //
  // The first assertion is the one that earns this test its place. Written as a
  // bare `equal(en, es)` it passed BEFORE any of this was implemented —
  // `undefined === undefined` — so it was green in exactly the state it exists
  // to reject. A comparison of two absences is not agreement.
  const pick = (page) =>
    read(page).match(/<meta\s+name="version"\s+content="([^"]*)"/)?.[1];

  const en = pick('index.html');
  const es = pick(join('es', 'index.html'));

  assert.ok(en && es, `both locales must actually state a version (en=${en}, es=${es})`);
  assert.equal(en, es, 'the two locales state different releases');
});
