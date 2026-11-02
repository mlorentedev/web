/**
 * Stop CSS motion on a loaded page, so computed styles read the same every time.
 *
 * It removes the animations instead of emulating `prefers-reduced-motion`,
 * which would also switch on the site's own reduced-motion rules and measure a
 * view that a default visitor does not get.
 */
export async function freezeMotion(page) {
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });
}
