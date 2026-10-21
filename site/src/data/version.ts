/**
 * The release this build came from, read at build time from the repository's
 * `version.txt` (WEB-106, `#293`).
 *
 * `version.txt` is release-please's SSOT — `release-type: simple` bumps it and
 * `.release-please-manifest.json` agrees with it — so this module has no copy of
 * the number and no fallback. Both would be a second source that agrees until
 * it does not, on a value whose entire purpose is to be trusted.
 *
 * ## Why `process.cwd()` and not a path relative to this file
 *
 * Astro runs with the cwd set to the project root (`site/`), both for
 * `npm run build` locally and for the Dockerfile's `WORKDIR /app`. Resolving
 * from `import.meta.url` instead would go through Vite's SSR transform, where
 * the module's own URL is not reliably its source path.
 *
 * The file therefore sits one level ABOVE the Astro project in both places:
 * `<repo>/version.txt` locally, `/version.txt` in the image, because the
 * Dockerfile copies it explicitly. That `COPY` is load-bearing — the build stage
 * only takes `site/`, which is why the value never reached the image before.
 *
 * ## Why this throws instead of degrading
 *
 * A missing file here means the Docker `COPY` was dropped or the build ran from
 * an unexpected directory. Emitting `"unknown"` in that case would produce a
 * site that answers "which release is this?" confidently and wrongly, which is
 * the exact failure `#293` exists to end — prod served a four-month-old build
 * and every available signal looked fine. Failing the build is the cheap
 * outcome; a plausible wrong answer is the expensive one.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION_FILE = resolve(process.cwd(), '..', 'version.txt');

/** Bare semver, matching the immutable image tag the release is promoted to. */
const SEMVER = /^\d+\.\d+\.\d+$/;

function readVersion(): string {
  let raw: string;
  try {
    raw = readFileSync(VERSION_FILE, 'utf8');
  } catch (cause) {
    throw new Error(
      `Cannot read the release version at ${VERSION_FILE}. In the image this is ` +
        '/version.txt and it arrives via `COPY version.txt /version.txt` in the ' +
        'Dockerfile; locally it is the repository root. See site/src/data/version.ts.',
      { cause },
    );
  }

  const version = raw.trim();
  if (!SEMVER.test(version)) {
    throw new Error(
      `version.txt holds "${version}", which is not a bare semver. The prod image ` +
        'tag is this string verbatim, so a leading "v" or a suffix would name a ' +
        'tag that does not exist in the registry.',
    );
  }
  return version;
}

export const SITE_VERSION = readVersion();

/**
 * The commit this build came from (WEB-150, `#435`): the 7-hex short sha the
 * staging image is tagged with, minus `sha-`. Between two releases every
 * staging deploy states the same `SITE_VERSION`, so this is the only field
 * that tells one staging deploy from the next.
 *
 * It arrives as the `SITE_COMMIT` build arg from `release.yml`, never from
 * `git`: the image build has no `.git`, and the value has to be the one the
 * tag names, not one recomputed from a checkout that might differ. An input
 * rather than a timestamp, so two builds of one commit stay byte-identical.
 *
 * Absent or empty means a build nobody tagged (a local `npm run build`, a PR
 * validation image), and it says so as `"local"` instead of inventing a sha.
 * Anything else that is not a short sha fails the build, for the reason
 * `readVersion` throws: a plausible wrong answer is the expensive outcome.
 */
function readCommit(): string {
  const commit = process.env.SITE_COMMIT?.trim();
  if (!commit) return 'local';
  if (!/^[0-9a-f]{7}$/.test(commit)) {
    throw new Error(
      `SITE_COMMIT is "${commit}", which is not a 7-hex short sha. It must equal ` +
        'the image tag minus "sha-", which release.yml computes as ${GITHUB_SHA::7}.',
    );
  }
  return commit;
}

export const SITE_COMMIT = readCommit();
