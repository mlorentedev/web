/**
 * The KubeLab project card opens the Lab, where the platform is shown and measured
 * (WEB-141 housekeeping, #31).
 *
 * The card linked to the GitHub repository. #31 asked for docs.kubelab.live, but
 * ADR-059 made kubelab.live platform-internal, so the page that proves KubeLab to a
 * visitor is `/lab`. A link inside the site stays in the tab and keeps the reader's
 * locale; only a link that leaves the site opens a new one.
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

function read(path) {
  const file = join(dist, path, 'index.html');
  assert.ok(existsSync(file), `${file} not found — run \`npm run build\` first`);
  return readFileSync(file, 'utf8');
}

/** Every `<a>` on the page, as its attribute string and its text. */
const anchors = (html) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, inner]) => ({
    attributes,
    href: attributes.match(/\shref="([^"]*)"/)?.[1] ?? '',
    text: inner.replace(/<[^>]*>/g, '').trim(),
  }));

// The tag pages render the same `ProjectCard` as `/projects`, in both locales.
for (const [page, lab] of [
  ['projects', '/lab/'],
  ['es/projects', '/es/lab/'],
  ['tags/kubernetes', '/lab/'],
  ['es/tags/kubernetes', '/es/lab/'],
]) {
  test(`/${page}: the KubeLab card opens ${lab}`, () => {
    const title = anchors(read(page)).find((a) => a.text === 'KubeLab');
    assert.ok(title, 'the KubeLab card has a linked title');
    assert.equal(title.href, lab);
  });

  test(`/${page}: no link opens a new tab (WEB-167)`, () => {
    for (const a of anchors(read(page))) {
      // An empty value, `_self`, `_top` and `_parent` stay in this tab; `_blank` or a named context opens another.
      const m = /\starget\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(a.attributes);
      const target = m ? (m[1] ?? m[2] ?? m[3]).trim().toLowerCase() : '';
      assert.ok(['', '_self', '_top', '_parent'].includes(target), `${a.href} ("${a.text}") opens a new tab`);
    }
  });
}
