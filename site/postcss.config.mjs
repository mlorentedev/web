// Tailwind's PostCSS wiring, which `@astrojs/tailwind` used to inject (WEB-022).
// The integration is deprecated and its peer range stops at astro 5; this file
// and the import at the top of `BaseLayout.astro` are the whole of what it did.
// Order matters: autoprefixer has to see the CSS Tailwind generated.
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

export default { plugins: [tailwindcss(), autoprefixer()] };
