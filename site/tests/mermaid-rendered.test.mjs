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
