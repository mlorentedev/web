/**
 * Viewport containment tests for build-rendered Mermaid diagrams (WEB-096, #244).
 *
 * Asserts that diagrams rendered into notes do not produce oversized horizontal
 * SVGs (previously up to 3573px) that cause horizontal overflow or unreadable text
 * when scaled down to the ~700px prose column.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const distDir = join(process.cwd(), 'dist');
const notesDistDir = join(distDir, 'notes');

test('all rendered Mermaid diagrams in notes stay within width threshold', () => {
  if (!existsSync(notesDistDir)) {
    // If not built yet, skip
    return;
  }

  const noteDirs = readdirSync(notesDistDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const maxAllowedWidth = 1050; // max width allowed before causing severe downscaling

  for (const slug of noteDirs) {
    const htmlPath = join(notesDistDir, slug, 'index.html');
    if (!existsSync(htmlPath)) continue;

    const html = readFileSync(htmlPath, 'utf8');
    const svgMatches = [...html.matchAll(/src="(\/beoe\/[^"]+\.svg)"/g)].map((m) => m[1]);

    for (const svgRel of svgMatches) {
      const svgPath = join(distDir, svgRel);
      assert.ok(existsSync(svgPath), `Rendered diagram ${svgRel} exists in dist`);

      const svgContent = readFileSync(svgPath, 'utf8');
      const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
      assert.ok(viewBoxMatch, `SVG ${svgRel} in note ${slug} carries a viewBox`);

      const [, , widthStr] = viewBoxMatch[1].trim().split(/\s+/);
      const width = parseFloat(widthStr);
      assert.ok(
        width <= maxAllowedWidth,
        `Diagram ${svgRel} in note '${slug}' width ${width}px exceeds ${maxAllowedWidth}px limit`
      );
    }
  }
});
