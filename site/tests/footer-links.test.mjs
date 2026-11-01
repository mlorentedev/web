/**
 * Every page's footer reaches the privacy policy and the feed (#357).
 *
 * Without it the English policy was linked from no other English page, and the
 * feed offered a person a link on the note pages only. Asserted on every built
 * page rather than a sample, inside `<footer>`, so a link elsewhere on the page
 * does not stand in for it. The feed has one URL: there is no Spanish one.
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

/** What the site footer, the last one on a page, fails to link. Lab pages add their own first. */
export function missingLinks(html, privacyHref) {
  const footer = html.slice(html.lastIndexOf('<footer'));
  return [privacyHref, '/rss.xml'].filter((href) => !footer.includes(`href="${href}"`));
}

test('missingLinks looks inside the footer only', () => {
  const links = '<a href="/legal/privacy/">p</a><a href="/rss.xml">r</a>';
  assert.deepEqual(missingLinks(`<footer>${links}</footer>`, '/legal/privacy/'), []);
  assert.deepEqual(missingLinks(`<footer>${links}</footer><footer></footer>`, '/legal/privacy/'), [
    '/legal/privacy/',
    '/rss.xml',
  ]);
});

test('every built page links the policy of its locale and the feed from its footer', () => {
  const files = htmlFiles(dist);
  assert.ok(files.length > 50, `only ${files.length} pages built`);
  const broken = files.flatMap((file) => {
    const path = relative(dist, file);
    const es = path.split(sep)[0] === 'es';
    const missing = missingLinks(readFileSync(file, 'utf8'), es ? '/es/legal/privacy/' : '/legal/privacy/');
    return missing.length > 0 ? [`${path}: ${missing.join(', ')}`] : [];
  });
  assert.deepEqual(broken, []);
});
