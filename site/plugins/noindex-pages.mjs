// Keeps every `noindex` page out of the sitemap (WEB-052), whatever made it
// noindex: the page itself is the only place that decision is written.
//
// The sitemap integration calls its `filter` from its own `astro:build:done`.
// Astro runs that hook for each integration in the order they are listed, so
// this one, listed first, has read the built HTML by the time `filter` asks.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const NOINDEX = /<meta name="robots" content="noindex/;

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

export function noindexPages() {
  const paths = new Set();
  let read = false;
  return {
    /** For the sitemap's `filter`: false for a page whose HTML says noindex. */
    indexable(url) {
      if (!read) throw new Error('noindex-pages: the sitemap asked before the build was read; list this integration before sitemap()');
      return !paths.has(new URL(url).pathname);
    },
    integration: {
      name: 'noindex-pages',
      hooks: {
        'astro:build:done': ({ dir }) => {
          const root = fileURLToPath(dir);
          for (const file of files(root).filter((f) => f.endsWith('/index.html'))) {
            if (NOINDEX.test(readFileSync(file, 'utf8'))) paths.add(`/${relative(root, file)}`.replace(/index\.html$/, ''));
          }
          read = true;
        },
      },
    },
  };
}
