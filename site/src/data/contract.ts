/**
 * web's platform contract, `kubelab.yaml`, read at build time from the
 * repository root (#592): the file kubelab reads at this image's commit to
 * decide how web runs. The Lab shows it as it is, so the page and the
 * deployment cannot disagree about it.
 *
 * It is read like `version.txt` (see `version.ts`): one level above the Astro
 * project, `<repo>/kubelab.yaml` locally and `/kubelab.yaml` in the image, where
 * the Dockerfile copies it. No copy under `site/`, and no fallback: a missing
 * file means the `COPY` was dropped, and the build fails rather than publish a
 * page with no contract on it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONTRACT_FILE = resolve(process.cwd(), '..', 'kubelab.yaml');

function readContract(): string {
  try {
    return readFileSync(CONTRACT_FILE, 'utf8').trimEnd();
  } catch (cause) {
    throw new Error(
      `Cannot read the platform contract at ${CONTRACT_FILE}. In the image this is ` +
        '/kubelab.yaml and it arrives via `COPY kubelab.yaml /kubelab.yaml` in the ' +
        'Dockerfile; locally it is the repository root. See site/src/data/contract.ts.',
      { cause },
    );
  }
}

export const PLATFORM_CONTRACT = readContract();
