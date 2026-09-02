/**
 * A static server over `dist/`, for the two checks that need a real browser.
 *
 * Extracted in PR7, when `lab-axe.mjs` became the second script to need it.
 * The first version of `lab-containment.mjs` required a server already
 * listening on :4321 and reported eight connection refusals as eight
 * containment failures — the same red whatever the page looked like. Serving
 * `dist/` from inside the check is what made its failures mean something, so
 * the second check inherits that rather than re-deriving it.
 *
 * `LAB_BASE_URL` overrides, for pointing either check at staging.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const distDir = join(here, '..', '..', 'dist');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.json': 'application/json',
};

/**
 * Resolve a request path to a file inside `dist/`, or `null` if it escapes.
 *
 * `join(distDir, req.url)` alone is a path traversal (CWE-22), and it was one
 * here until PR7's adversarial review found it. `join` *normalises* `..`
 * rather than rejecting it, so enough of them walk out of `dist/` and the
 * server happily reads whatever is on the other side. Reproduced before fixing,
 * because a depth that is too shallow returns a 404 and reads like safety:
 * four `../` gave 404 and seven returned `/etc/passwd` with a 200.
 *
 * Decoding is what makes the naive check insufficient: `%2f` is a `/` that
 * `req.url` does not show, so a filter on the raw string misses it. The
 * containment test therefore happens *after* decoding and *after* resolution,
 * on real absolute paths, which is the only place the answer is unambiguous.
 *
 * Exported so a test can prove it fires rather than trusting that it does.
 */
export function resolveWithinDist(requestPath, root = distDir) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath.split('?')[0]);
  } catch {
    return null; // malformed percent-encoding is not a path
  }
  if (decoded.includes('\0')) return null;

  const rootResolved = resolve(root);
  const candidate = resolve(rootResolved, `.${sep}${decoded}`);
  const rel = relative(rootResolved, candidate);

  // Inside means: not the empty string going nowhere odd, does not start with
  // `..`, and is not absolute — the three ways `relative()` signals an escape.
  if (rel.startsWith('..') || resolve(rootResolved, rel) !== candidate) return null;
  return candidate;
}

/** Serves `dist/` on an ephemeral port, so the check needs nothing running beside it. */
export async function serveDist() {
  if (!existsSync(distDir)) {
    console.error(`${distDir} not found — run \`npm run build\` first`);
    process.exit(1);
  }
  const server = createServer((req, res) => {
    let file = resolveWithinDist(req.url);
    if (file === null) { res.writeHead(403); return res.end('forbidden'); }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    // Re-check after the index.html join: the directory itself was inside, and
    // appending a constant cannot escape, but asserting it costs nothing and
    // keeps the invariant true of the value actually read.
    if (resolveWithinDist(relative(resolve(distDir), file)) === null) {
      res.writeHead(403); return res.end('forbidden');
    }
    if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((done) => server.listen(0, done));
  return { server, url: `http://localhost:${server.address().port}` };
}

/**
 * Resolve the base URL for a browser check: `LAB_BASE_URL`, or a served `dist/`.
 *
 * Returns the server too, so the caller can close it; `null` when an external
 * URL was used and there is nothing to close.
 */
export async function labBaseUrl() {
  const external = process.env.LAB_BASE_URL;
  if (external) return { url: external, server: null };
  const { server, url } = await serveDist();
  return { url, server };
}
