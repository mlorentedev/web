/**
 * Ask the running image what it sends (#328): exactly one `Cache-Control` per
 * response, the policy its path deserves, and the security headers on errors.
 *
 *   docker run --rm -d -p 8080:8080 --name web-probe <image>
 *   node tests/nginx-cache-probe.mjs http://localhost:8080
 *
 * The static tests read `nginx.conf`; only a live response shows what nginx
 * does with it. `expires` and `add_header` each emitting a header was invisible
 * in the file and plain on the wire. Raw headers, not `fetch`: `fetch` joins
 * duplicates into one comma-separated value, which is the defect to count.
 */
import { request as httpRequest } from 'node:http';

const base = process.argv[2];
if (!base) {
  console.error('usage: node tests/nginx-cache-probe.mjs <base-url>');
  process.exit(2);
}

/** Status, body and every header line as sent, duplicates kept. */
const request = (path, method = 'GET') =>
  new Promise((resolve, reject) => {
    const req = httpRequest(new URL(path, base), { method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const raw = [];
        for (let i = 0; i < res.rawHeaders.length; i += 2) raw.push([res.rawHeaders[i].toLowerCase(), res.rawHeaders[i + 1]]);
        resolve({ status: res.statusCode, body, all: (name) => raw.filter(([n]) => n === name).map(([, v]) => v) });
      });
    });
    req.on('error', reject);
    req.end();
  });

// Real asset names come from the served pages, so the probe follows the build.
const home = await request('/');
const astro = home.body.match(/\/_astro\/[^"']+\.css/)?.[0];
const note = (await request('/notes/')).body.match(/href="(\/notes\/[^"#]+\/)"/)?.[1];
const beoe = note && (await request(note)).body.match(/\/beoe\/[0-9a-z]+\.svg/)?.[0];
if (!astro || !beoe) {
  console.error(`✗ could not find a served asset to probe (astro: ${astro}, beoe: ${beoe})`);
  process.exit(1);
}

const IMMUTABLE = /^public, max-age=31536000, immutable$/;
const EXPIRES = /^public, max-age=\d+$/;
const REVALIDATE = /^no-cache$/;
const CASES = [
  ['/', 200, REVALIDATE],
  ['/notes/', 200, REVALIDATE],
  ['/es/', 200, REVALIDATE],
  ['/version.json', 200, REVALIDATE],
  [astro, 200, IMMUTABLE],
  [beoe, 200, IMMUTABLE],
  ['/fonts/Roboto-Regular.woff2', 200, EXPIRES],
  ['/images/og-image.png', 200, EXPIRES],
  // A missing hashed asset must not be cached as immutable, and a 404 still
  // carries the security set: the response `always` exists for.
  ['/_astro/missing.AAAAAAAA.css', 404, REVALIDATE],
  ['/no-such-page/', 404, REVALIDATE],
  ['/es/no-such-page/', 404, REVALIDATE],
  // Any other error keeps the asset's URI, since only 403 and 404 have an
  // `error_page`. A 405 is the one a client can provoke, and a cache that kept
  // it under `immutable` would serve the error for a year.
  [astro, 405, REVALIDATE, 'POST'],
  [beoe, 405, REVALIDATE, 'POST'],
];

let failures = 0;
for (const [path, status, policy, method = 'GET'] of CASES) {
  const res = await request(path, method);
  const cache = res.all('cache-control');
  const problems = [
    res.status !== status && `status ${res.status}, expected ${status}`,
    cache.length !== 1 && `${cache.length} Cache-Control headers (${cache.join(' | ')})`,
    cache.length === 1 && !policy.test(cache[0]) && `Cache-Control "${cache[0]}", expected ${policy}`,
    res.all('expires').length > 0 && 'an Expires header beside Cache-Control',
    res.all('x-frame-options').length !== 1 && 'no single X-Frame-Options',
    res.all('x-content-type-options').length !== 1 && 'no single X-Content-Type-Options',
  ].filter(Boolean);
  if (problems.length > 0) failures++;
  console.log(`${problems.length ? '✗' : '✓'} ${method} ${path} ${res.status} ${cache.join(' | ')}${problems.length ? `\n    ${problems.join('\n    ')}` : ''}`);
}

if (failures > 0) process.exit(1);
console.log(`nginx cache probe: ${CASES.length} paths, one Cache-Control each, immutable only on hashed names that answered 200.`);
