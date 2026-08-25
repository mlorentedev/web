import colors from 'tailwindcss/colors';

import {
  ACCENT,
  CODE_SURFACE,
  PRE_INK,
  PRE_SURFACE,
  PROSE_BODY,
  PROSE_HEADING,
} from './src/theme/tokens.mjs';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand. `accent-700` is the ACCENT above; the rest of the ramp comes
        // with it so hover and border shades have somewhere to live.
        accent: colors.cyan,
        // Neutrals. `ink` is the warm scale the site's text and hairlines use;
        // `panel` is the cool one the dark surfaces use.
        ink: colors.gray,
        panel: colors.slate,
        // Status, as the cockpit's architecture legend already assigns them.
        ok: colors.emerald,
        warn: colors.amber,
        danger: colors.rose,
        observe: colors.purple,
      },
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
