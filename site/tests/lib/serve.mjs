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
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const distDir = join(here, '..', '..', 'dist');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.json': 'application/json',
};

/** Serves `dist/` on an ephemeral port, so the check needs nothing running beside it. */
export async function serveDist() {
  if (!existsSync(distDir)) {
    console.error(`${distDir} not found — run \`npm run build\` first`);
    process.exit(1);
  }
  const server = createServer((req, res) => {
    let file = join(distDir, decodeURIComponent(req.url.split('?')[0]));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, resolve));
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
