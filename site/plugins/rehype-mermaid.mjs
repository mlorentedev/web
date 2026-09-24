/**
 * Renders ```mermaid fences to SVG files at build time, with stable ids (#378).
 *
 * This replaces `@beoe/rehype-mermaid` 0.4.2, which is a 48-line wrapper over
 * the two libraries imported below. Its `render` overwrites the `prefix`
 * option with `m${Math.random()}` on every call, and mermaid stamps that prefix
 * into every id in the SVG. The `file` strategy names each SVG by a hash of its
 * content, so every build wrote all 13 diagrams under new names, and every
 * page linking one got a new body: two builds of one commit shared 0 of 13
 * names (measured on 9af324b).
 *
 * The prefix only has to keep two diagrams' ids and styles apart. A hash of
 * the diagram's own source does that and is the same on every build: equal
 * sources render to equal SVGs, so sharing ids between them collides with
 * nothing. The rest is the wrapper's behaviour, kept as it was.
 */

import { createHash } from 'node:crypto';

import { rehypeCodeHookImg } from '@beoe/rehype-code-hook-img';
import { createMermaidRenderer } from 'mermaid-isomorphic';

/** A mermaid id prefix derived from the diagram and its theme, stable across builds. */
export const stablePrefix = (code, theme = 'light') =>
  `m${createHash('sha256').update(`${theme}\0${code}`).digest('hex').slice(0, 16)}`;

const svgo = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Inline SVGs need their viewBox.
          removeViewBox: false,
          // Breaks state diagrams.
          convertShapeToPath: false,
        },
      },
    },
  ],
};

let renderDiagrams;

const renderOne = async (code, options) => {
  const [result] = await renderDiagrams([code], options);
  if (result.status !== 'fulfilled') throw new Error(result.reason);
  return result.value;
};

async function render(code, { css, mermaidConfig, browserType, launchOptions, darkMode }) {
  renderDiagrams ??= createMermaidRenderer({ browserType, launchOptions });
  const config = { ...mermaidConfig };
  const { svg, width, height, title: alt } = await renderOne(code, {
    css,
    mermaidConfig: config,
    prefix: stablePrefix(code),
  });
  let darkSvg;
  if (darkMode) {
    ({ svg: darkSvg } = await renderOne(code, {
      css,
      mermaidConfig: { ...config, theme: 'dark' },
      prefix: stablePrefix(code, 'dark'),
    }));
  }
  return { svg, darkSvg, width, height, alt };
}

export const rehypeMermaid = rehypeCodeHookImg({ language: 'mermaid', render, svgo });

export default rehypeMermaid;
