/**
 * The `.prose` customisation, and nothing else (WEB-022, #7).
 *
 * Tailwind 4 is configured in `src/styles/tailwind.css`: colours, fonts and the
 * typography plugin itself. This file survives because a JavaScript config
 * loaded through `@config` is the typography plugin's documented way to change
 * the raw CSS it generates under Tailwind 4. Colours come from `tokens.mjs` as
 * hex, so the prose matches the pinned v3 palette.
 */
import {
  ACCENT,
  CODE_SURFACE,
  PRE_INK,
  PRE_SURFACE,
  PROSE_BODY,
  PROSE_HEADING,
} from './src/theme/tokens.mjs';
import { PALETTE } from './src/theme/palette.mjs';

const gray = PALETTE.gray;

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            // The plugin's own colour variables. Under Tailwind 3 it read them
            // from the theme's `gray` ramp; under 4 it ships them as OKLCH
            // literals, so they are set here from the pinned v3 ramp.
            '--tw-prose-body': gray[700],
            '--tw-prose-headings': gray[900],
            '--tw-prose-lead': gray[600],
            '--tw-prose-links': gray[900],
            '--tw-prose-bold': gray[900],
            '--tw-prose-counters': gray[500],
            '--tw-prose-bullets': gray[300],
            '--tw-prose-hr': gray[200],
            '--tw-prose-quotes': gray[900],
            '--tw-prose-quote-borders': gray[200],
            '--tw-prose-captions': gray[500],
            '--tw-prose-kbd': gray[900],
            '--tw-prose-kbd-shadows': `${gray[900]}1a`,
            '--tw-prose-code': gray[900],
            '--tw-prose-pre-code': gray[200],
            '--tw-prose-pre-bg': gray[800],
            '--tw-prose-th-borders': gray[300],
            '--tw-prose-td-borders': gray[200],
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
};
