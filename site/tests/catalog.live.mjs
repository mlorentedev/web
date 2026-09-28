/**
 * No `/lab/idp` card opens a redirect (WEB-141 AC3).
 *
 *   npm run test:links
 *
 * Network-bound, so it is not in `npm test`. `.github/workflows/access-check.yml`
 * runs it weekly and on demand, next to the access table's re-measurement.
 * Measured 2026-09-27: three cards redirected (Claude status, the Kubernetes
 * docs, the Argo CD docs). A redirect is a link that works today and says the
 * catalog was never re-checked; the fix is to point the card at where the
 * redirect lands.
 *
 * Only a 3xx fails. securityheaders.com answers 403 to anything that is not a
 * browser, so a status this check cannot see past is not a verdict on the link.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test, { describe } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(here, '..', 'src/data/idp-catalog.json'), 'utf8'));
const linked = catalog.categories.flatMap((cat) => cat.items).filter((item) => item.url);

test('the catalog has linked cards to check', () => {
  assert.ok(linked.length > 0);
});

// Serially, every card at its 20 s timeout would outlast the job's 5 minutes, which
// `test:access` shares (CodeRabbit on #431); six at a time bounds it near 60 s.
describe('every linked card', { concurrency: 6 }, () => {
  for (const item of linked) {
    test(`${item.id} opens without a redirect`, async () => {
      const response = await fetch(item.url, {
        redirect: 'manual',
        headers: { 'user-agent': 'Mozilla/5.0 (mlorente.dev catalog check)' },
        signal: AbortSignal.timeout(20_000),
      });
      const { status } = response;
      assert.ok(status < 300 || status >= 400, `${item.url} answers ${status} → ${response.headers.get('location')}`);
    });
  }
});
