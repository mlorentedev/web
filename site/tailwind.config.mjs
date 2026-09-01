import colors from 'tailwindcss/colors';

import {
  ACCENT,
  CODE_SURFACE,
  COLOR_FAMILIES,
  PRE_INK,
  PRE_SURFACE,
  PROSE_BODY,
  PROSE_HEADING,
} from './src/theme/tokens.mjs';

/**
 * The seven families, resolved from the names in `tokens.mjs` to the Tailwind
 * ramps they alias. The mapping lives there so `tests/lab-audit.test.mjs` can
 * read the same list without importing Tailwind's palette (AC1: one allowlist).
 */
const familyColors = Object.fromEntries(
  Object.entries(COLOR_FAMILIES).map(([family, ramp]) => [family, colors[ramp]]),
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: familyColors,
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: PROSE_BODY,
            a: { color: ACCENT, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
            strong: { color: PROSE_HEADING },
            h1: { color: PROSE_HEADING },
            h2: { color: PROSE_HEADING },
            h3: { color: PROSE_HEADING },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            code: {
              // An inline path — /var/lib/rancher/k3s/server/tls/ — is one
              // unbreakable 315px token, wider than a 320px viewport allows.
              overflowWrap: 'break-word',
              fontWeight: '400',
              backgroundColor: CODE_SURFACE,
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              borderRadius: '0.25rem',
              color: ACCENT,
            },
            'figure.mermaid': {
              // Rendered diagrams are as wide as their content — up to 1,940px.
              // Scroll the figure rather than letting the page scroll.
              overflowX: 'auto',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
            'figure.mermaid img': {
              maxWidth: 'none',
              marginTop: '0',
              marginBottom: '0',
            },
            pre: {
              backgroundColor: PRE_SURFACE,
              color: PRE_INK,
              overflowX: 'auto',
            },
            table: {
              // A seven-column table in picking-hardware-budget-k3s rendered
              // 553px wide inside a 320px viewport and pushed the whole
              // document sideways. `pre` already scrolls; tables did not.
              display: 'block',
              overflowX: 'auto',
              width: '100%',
              marginTop: '2rem',
              marginBottom: '2rem',
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
            },
            thead: {
              borderBottomWidth: '2px',
              borderBottomColor: 'var(--tw-prose-th-borders)',
            },
            'thead th': {
              fontWeight: '600',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
            },
            'tbody td': {
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--tw-prose-td-borders)',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
