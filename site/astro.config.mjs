import { readdirSync, readFileSync } from 'node:fs';

import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { rehypeMermaid } from './plugins/rehype-mermaid.mjs';
import rehypeTrailingSlash from './plugins/trailing-slash.mjs';

// /es/notes/ is noindex while no note is written in Spanish; keep it out of the
// sitemap for as long, so the two signals agree.
const notesDir = new URL('./src/content/notes/', import.meta.url);
const frontMatter = (text) => text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
// A Spanish note counts once it is published: drafts are not built, as in the collection filters.
const isSpanishPublished = (fm) => /^lang:\s*['"]?es\b/m.test(fm) && !/^draft:\s*true\b/m.test(fm);
const hasSpanishNotes = readdirSync(notesDir).some((f) =>
  isSpanishPublished(frontMatter(readFileSync(new URL(f, notesDir), 'utf8'))),
);

export default defineConfig({
  site: 'https://mlorente.dev',
  output: 'static',
  // Tailwind 4 runs as a Vite plugin, configured in `src/styles/tailwind.css`
  // (WEB-022). It replaced a PostCSS config that had replaced the deprecated
  // `@astrojs/tailwind` integration, and it prefixes CSS itself.
  vite: { plugins: [tailwindcss()] },
  integrations: [
    sitemap({
      // The integration drops `/404` but not a localised one.
      filter: (page) => !page.endsWith('/404/') && (hasSpanishNotes || !page.endsWith('/es/notes/')),
      // The integration writes the locales. The HTML also declares `x-default`
      // on every page with alternates, and both surfaces must say the same.
      // The integration shares one `links` array between the two locales' URLs,
      // so this builds a new one: pushing onto it would add `x-default` twice.
      serialize(item) {
        const english = item.links?.find((link) => link.lang === 'en');
        if (!english) return item;
        return { ...item, links: [...item.links, { lang: 'x-default', url: english.url }] };
      },
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es' },
      },
    }),
    mdx(),
  ],
  markdown: {
    // Shiki turns every fence into <pre class="astro-code"> before rehype runs,
    // so mermaid has to opt out of highlighting or the plugin never sees it.
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    // Renders ```mermaid fences to SVG at build time. Ten of them across eight
    // notes were shipping as raw DSL in a dark code block on a light page.
    //
    // The mermaid source stays in the .mdx, so a diagram is reviewed as a diff
    // and can never go stale against the page it illustrates. That costs a
    // headless browser in the build stage — see the Dockerfile, where the stage
    // is Debian for exactly this reason and the runtime image is untouched.
    //
    // The plugin is ours, not `@beoe/rehype-mermaid`'s: that one gave every
    // diagram a random id prefix, so no two builds of one commit wrote the same
    // files (#378). See `plugins/rehype-mermaid.mjs`.
    //
    // Astro 7's default processor is Sätteri; rehype plugins run on unified,
    // which is why `@astrojs/markdown-remark` is a direct dependency (WEB-022).
    processor: unified({
      rehypePlugins: [
        rehypeTrailingSlash,
        [
          rehypeMermaid,
          {
            strategy: 'file',
            fsPath: 'public/beoe',
            webPath: '/beoe',
            // The site is light-only (`color-scheme: light`, WEB-040), so a dark
            // variant per diagram would double the output for nothing.
            // htmlLabels off emits real <text>, which is selectable, searchable
            // and survives being read by anything that is not a browser.
            // Without this the <img> ships with no `alt` at all — a WCAG 1.1.1
            // failure across ten diagrams, where a screen reader announces the
            // generated filename or nothing (#244).
            //
            // A single shared string is a floor, not the fix: every diagram
            // deserves its own description. It is defensible here only because
            // each of these diagrams is explained by the prose that surrounds it,
            // which is where a non-visual reader gets the content. Per-diagram alt
            // stays open on #244.
            alt: 'Architecture diagram, described in the surrounding text',
            mermaidConfig: { flowchart: { htmlLabels: false }, theme: 'neutral' },
          },
        ],
      ],
    }),
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
