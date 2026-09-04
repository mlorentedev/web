/**
 * `/version.json` — the machine-readable half of WEB-106 (`#293`).
 *
 * Deliberately not under a locale: a release number is not translated, and two
 * paths would be two answers to a question that has one. The human-readable
 * half is `<meta name="version">`, which BaseLayout renders on every page in
 * both locales.
 *
 * The payload has exactly one field. `built_at` was suggested on the issue and
 * is rejected: a timestamp makes the build non-reproducible, and reproducibility
 * is what let us explain a confusing `last-modified` on 2026-09-04 — the images
 * for `sha-69c0d4c` and `sha-a76e8fa` share all eleven `rootfs.diff_ids`, so
 * their identical `dist/` was provable rather than assumed. A per-build
 * timestamp trades that permanently for a field nothing queries. `commit` was
 * also considered and deferred: it needs a build-arg through `build-image.yml`,
 * and it answers a different question from "which release is live".
 */

import type { APIRoute } from 'astro';

import { SITE_VERSION } from '../data/version';

/**
 * `output: 'static'` prerenders this to `dist/version.json` and keeps only the
 * BODY — response headers are discarded, so setting `cache-control` here would
 * document a guarantee that never ships. The real one is nginx's
 * `location = /version.json`, and `site-version.test.mjs` asserts it is still
 * there: a stale cached answer to "which release is live" is precisely the
 * confidently-wrong reply this endpoint exists to replace.
 */
export const GET: APIRoute = () =>
  new Response(`${JSON.stringify({ version: SITE_VERSION })}\n`);
