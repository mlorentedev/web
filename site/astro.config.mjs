import { defineConfig } from 'astro/config';
import { rehypeMermaid } from '@beoe/rehype-mermaid';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mlorente.dev',
  output: 'static',
  integrations: [
    tailwind(),
    sitemap({
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
    rehypePlugins: [
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
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true,
    },
  },
});
