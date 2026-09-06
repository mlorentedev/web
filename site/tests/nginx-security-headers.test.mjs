/**
 * `site/nginx.conf`'s security headers must not contradict the edge that
 * fronts it (WEB-111, `#308`).
 *
 * ## Why this test exists
 *
 * Measured against prod on 2026-09-04 and again on 2026-09-05: a client
 * receives `X-Frame-Options: DENY` and a Permissions-Policy carrying
 * `payment=()`, while `nginx.conf` declared `SAMEORIGIN` and omitted
 * `payment=()`. Neither layer was broken. The mlorente.dev IngressRoute
 * carries Traefik's `secure-headers` middleware, and the edge's values replace
 * the origin's, so the pod's weaker set never reaches a browser through the
 * ingress.
 *
 * That combination — invisible from outside, and still real — is the whole
 * reason it needs a test rather than a curl. The origin is what serves when the
 * image runs without the middleware: `docker run`, a `kubectl port-forward`, or
 * any future route that omits it. A weaker posture sitting in the repo looking
 * authoritative is the failure being guarded, and no end-to-end check can see
 * it, because end-to-end is exactly the path where the edge hides it.
 *
 * ## Where the expected values come from
 *
 * kubelab `infra/k8s/base/edge/secure-headers.yaml`, mirrored by its
 * `tests/e2e/test_security_headers.py`. They are restated below because that
 * file lives in another repository and is unreachable from this suite — a copy
 * with its provenance named, not a second source of truth. Changing either side
 * is a two-repo edit, and this test is the half that fails here.
 *
 * HSTS, CSP and `sslRedirect` are deliberately absent from the table: TLS
 * terminates at the edge and this server listens on plain 8080, so they are the
 * edge's to send and would be wrong to assert here.
 *
 * ## The nginx rule being guarded
 *
 * `add_header` in a block REPLACES the inherited set rather than adding to it
 * (kubelab `lesson-107`). A block that sets one header therefore silently drops
 * every header it does not restate. That is why the set is repeated in this
 * file, and why the repetition has to be checked rather than trusted: the
 * failure mode is a `location` gaining a `Cache-Control` and taking four
 * security headers down with it, with nothing red anywhere.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const conf = readFileSync(join(here, '..', 'nginx.conf'), 'utf8');

/**
 * The edge's set. `frameDeny: true` renders as `DENY` and
 * `contentTypeNosniff: true` as `nosniff`; the other two are verbatim.
 */
const PLATFORM = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

/**
 * Every `location … { … }` in the file; this conf nests no braces inside one.
 *
 * Anchored to the start of a line, and the matcher may not span one. Both
 * guards are load-bearing: the unanchored form matched the word "location"
 * inside a `#` comment that explains the very footgun this file guards, then
 * ran on to the next `{` and reported a block that does not exist. Structure,
 * not prose.
 *
 * Built fresh per call on purpose — a shared `/g` regex carries `lastIndex`
 * between `matchAll` and `replace`, which makes the second caller skip matches.
 */
const locationBlocks = () => /^[ \t]*location\s+([^{\n]+?)\s*\{([^{}]*)\}/gm;

/** `add_header Name "value"` → `{ Name: value }`, for one block's body. */
const headersIn = (body) =>
  Object.fromEntries(
    [...body.matchAll(/add_header\s+([A-Za-z-]+)\s+"([^"]*)"/g)].map((m) => [m[1], m[2]]),
  );

/** The server level is what is left once every `location` block is removed. */
const blocks = [
  { name: 'server', body: conf.replace(locationBlocks(), '') },
  ...[...conf.matchAll(locationBlocks())].map((m) => ({
    name: `location ${m[1].trim()}`,
    body: m[2],
  })),
].map((b) => ({ ...b, headers: headersIn(b.body) }));

const server = blocks.find((b) => b.name === 'server');

/**
 * Every header in the platform set must be present verbatim. Whatever a block
 * adds on top is an addition, not a divergence, so it is filtered out first:
 * the middleware also sends `X-XSS-Protection`, and declaring it here would be
 * agreeing *more*, not less.
 *
 * One function for both the server level and the locations on purpose. The
 * first version of this file compared the server block unfiltered and the
 * locations filtered — two copies of one rule, drifting apart, which is the
 * exact failure the file exists to catch.
 */
const assertPlatformSet = (block, message) => {
  const declared = Object.fromEntries(
    Object.entries(block.headers).filter(([name]) => name in PLATFORM),
  );
  assert.deepEqual(declared, { ...PLATFORM }, message);
};

test('the parser actually found the blocks it is about to judge', () => {
  // Without this, a regex that matched nothing would make every assertion below
  // pass over an empty set — green in exactly the state the suite exists to
  // reject. The file's shape is allowed to change; having no blocks is not.
  assert.ok(
    blocks.length >= 3,
    `parsed ${blocks.length} block(s) from nginx.conf; the file has a server ` +
      'block and several locations, so the block regex has stopped matching',
  );
  assert.ok(server, 'no server level was parsed out of nginx.conf');

  // A block whose name spans lines came from a `#` comment, not a directive —
  // the failure the anchoring above fixed. Asserted so a later loosening of
  // that regex fails here instead of quietly judging imaginary blocks.
  for (const { name } of blocks) {
    assert.ok(
      !name.includes('\n'),
      `parsed a block named ${JSON.stringify(name)} — the matcher ran past a ` +
        'line ending, so it matched prose rather than a location directive',
    );
  }
});

test('the server block declares the full platform set', () => {
  // The inheritance root: every location that sets no header of its own gets
  // this set and nothing else, so an omission here is site-wide.
  assertPlatformSet(
    server,
    'the server block disagrees with the edge middleware. Both sides are ' +
      'edited together: kubelab infra/k8s/base/edge/secure-headers.yaml and ' +
      'its tests/e2e/test_security_headers.py',
  );
});

for (const block of blocks.filter((b) => b.name !== 'server')) {
  const overrides = Object.keys(block.headers).length > 0;

  test(`${block.name} ${overrides ? 'restates' : 'inherits'} the security headers`, () => {
    if (!overrides) {
      // Declaring nothing is correct nginx: the block inherits the server set
      // intact. `location /` and the internal 404 both rely on this.
      return;
    }

    // Any add_header at all replaces the inherited set — including a lone
    // `Cache-Control`. So the trigger is "this block sets a header", never
    // "this block sets a security header": the dangerous edit is precisely the
    // one that adds an unrelated header and restates nothing.
    assertPlatformSet(
      block,
      `${block.name} sets ${Object.keys(block.headers).join(', ')} and so ` +
        'replaces the inherited headers; it must restate the full security ' +
        'set verbatim or it silently serves without them',
    );
  });
}
