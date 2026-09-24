/**
 * Every ```mermaid fence in a note ships as a rendered diagram, never as source
 * (WEB-022, #7).
 *
 * The renderer is a rehype plugin, and Astro 7 moved where rehype plugins are
 * declared (`markdown.processor: unified({ rehypePlugins })`). If that wiring
 * breaks, the build still exits 0: the fences fall through as a plain
 * `language-mermaid` code block, no SVG is written, and `notes-diagrams.test.mjs`
 * — which checks the width of every diagram it finds — passes over zero
 * diagrams. Measured on 2026-09-22 by switching the plugin off: 0 SVGs, raw
 * mermaid on the page, every suite green. This test counts from the source, so
 * finding nothing is a failure.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { stablePrefix } from '../plugins/rehype-mermaid.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const notesSrc = join(siteRoot, 'src', 'content', 'notes');
const distDir = join(siteRoot, 'dist');

/** `slug -> number of mermaid fences`, for every note that has at least one. */
function fencesBySlug() {
  const counts = new Map();
  for (const file of readdirSync(notesSrc)) {
    if (!/\.mdx?$/.test(file)) continue;
    const fences = readFileSync(join(notesSrc, file), 'utf8').match(/^```mermaid[ \t]*$/gm) ?? [];
    if (fences.length > 0) counts.set(file.replace(/\.mdx?$/, ''), fences.length);
  }
  return counts;
}

test('every mermaid fence in a note is rendered to an SVG the page links', () => {
  assert.ok(existsSync(distDir), 'run `npm run build` first — this test reads dist/');
  const expected = fencesBySlug();
  // Vacuity guard: with no fences in the source, the loop below proves nothing.
  assert.ok(expected.size > 0, 'no note in src/content/notes has a ```mermaid fence');

  for (const [slug, fences] of expected) {
    const page = join(distDir, 'notes', slug, 'index.html');
    assert.ok(existsSync(page), `dist/notes/${slug}/index.html was not built`);
    const html = readFileSync(page, 'utf8');

    assert.doesNotMatch(html, /language-mermaid/, `notes/${slug}: mermaid shipped as source, not rendered`);
    const images = [...html.matchAll(/src="(\/beoe\/[^"]+\.svg)"/g)].map((m) => m[1]);
    assert.equal(images.length, fences, `notes/${slug}: ${fences} mermaid fence(s) but ${images.length} rendered diagram(s)`);
    for (const src of images) {
      assert.ok(existsSync(join(distDir, src)), `notes/${slug}: links ${src}, which is not in dist/`);
    }
  }
});

/** Each note's mermaid sources, in page order, as the plugin receives them. */
function sourcesBySlug() {
  const sources = new Map();
  for (const file of readdirSync(notesSrc)) {
    if (!/\.mdx?$/.test(file)) continue;
    const text = readFileSync(join(notesSrc, file), 'utf8');
    // remark-rehype ends a code block's text with a newline, and that text is
    // what the plugin hashes.
    const found = [...text.matchAll(/^```mermaid[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)].map((m) => m[1]);
    if (found.length > 0) sources.set(file.replace(/\.mdx?$/, ''), found);
  }
  return sources;
}

test('every diagram is named by its own source, so a rebuild writes the same files (#378)', () => {
  // `@beoe/rehype-mermaid` stamped `m<Math.random()>` into every id, and the
  // file is named by a hash of its content: two builds of one commit shared 0
  // of 13 names. The ids must now be a function of the diagram's source. This
  // reads one build, so it catches a random or build-dependent prefix without
  // having to build twice.
  const expected = sourcesBySlug();
  assert.ok(expected.size > 0, 'no note in src/content/notes has a ```mermaid fence');
  let checked = 0;
  for (const [slug, sources] of expected) {
    const html = readFileSync(join(distDir, 'notes', slug, 'index.html'), 'utf8');
    const images = [...html.matchAll(/src="(\/beoe\/[^"]+\.svg)"/g)].map((m) => m[1]);
    assert.equal(images.length, sources.length, `notes/${slug}: sources and diagrams out of step`);
    images.forEach((src, i) => {
      const svg = readFileSync(join(distDir, src), 'utf8');
      // Mermaid prefixes the ids it generates (`<prefix>-0_flowchart-…`); the
      // ones it takes from the diagram itself (`L_A_B_0`, a node's name) carry
      // no prefix and are already a function of the source.
      const prefixes = new Set([...svg.matchAll(/\bid="(m[0-9a-f]{8,})(?=[-_"])/g)].map((m) => m[1]));
      assert.ok(prefixes.size > 0, `${src} carries no prefixed id, so this check would pass over nothing`);
      assert.deepEqual(
        [...prefixes],
        [stablePrefix(sources[i])],
        `${src} (notes/${slug}, diagram ${i + 1}): id prefix not derived from its source`,
      );
      checked++;
    });
  }
  assert.ok(checked >= 10, `only ${checked} diagrams checked`);
});

test('the id prefix depends on the source and the theme, and on nothing else', () => {
  const a = 'flowchart LR\n  A --> B\n';
  assert.equal(stablePrefix(a), stablePrefix(a));
  assert.match(stablePrefix(a), /^m[0-9a-f]{16}$/, 'mermaid needs an id-safe prefix');
  assert.notEqual(stablePrefix(a), stablePrefix('flowchart LR\n  A --> C\n'));
  assert.notEqual(stablePrefix(a), stablePrefix(a, 'dark'), 'a dark variant must not share the light ids');
});
