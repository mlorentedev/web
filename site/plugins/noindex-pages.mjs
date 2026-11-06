// Keeps every `noindex` page out of the sitemap (WEB-052), whatever made it
// noindex: the page itself is the only place that decision is written. It reads
// each page's `article:modified_time` the same way, for the sitemap's `lastmod`
// (WEB-050): a page that declares none gets none, and no date is made up.
//
// The sitemap integration calls its `filter` from its own `astro:build:done`.
// Astro runs that hook for each integration in the order they are listed, so
// this one, listed first, has read the built HTML by the time `filter` asks.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const NOINDEX = /<meta name="robots" content="noindex/;
const MODIFIED = /<meta property="article:modified_time" content="([^"]+)"/;

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

export function noindexPages() {
  const paths = new Set();
  const modified = new Map();
  let read = false;
  // The sitemap's URL is percent-encoded and slash-separated; the paths are read
  // from the file system, so they are joined with `/` on every platform.
  const route = (url) => {
    if (!read) throw new Error('noindex-pages: the sitemap asked before the build was read; list this integration before sitemap()');
    return decodeURIComponent(new URL(url).pathname);
  };
  return {
    /** For the sitemap's `filter`: false for a page whose HTML says noindex. */
    indexable: (url) => !paths.has(route(url)),
    /** For the sitemap's `serialize`: the page's own `article:modified_time`, or undefined. */
    lastmod: (url) => modified.get(route(url)),
    integration: {
      name: 'noindex-pages',
      hooks: {
        'astro:build:done': ({ dir }) => {
          const root = fileURLToPath(dir);
          for (const file of files(root)) {
            const path = `/${relative(root, file).split(sep).join('/')}`;
            if (!path.endsWith('/index.html')) continue;
            const html = readFileSync(file, 'utf8');
            const page = path.replace(/index\.html$/, '');
            if (NOINDEX.test(html)) paths.add(page);
            const date = html.match(MODIFIED)?.[1];
            if (date) modified.set(page, date);
          }
          read = true;
        },
      },
    },
  };
}
