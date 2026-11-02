/**
 * One URL per page (#347).
 *
 * The header's links were fixed and asserted alone, so the slashless links
 * everywhere else went unseen and every page stayed reachable at three URLs.
 * This walks every built page, because a link is one `translatePath` call away
 * from any component. nginx's answers are measured with `docker run`; this holds
 * the lines that produce them.
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import rehypeTrailingSlash, { withTrailingSlash } from '../plugins/trailing-slash.mjs';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(site, 'dist');

function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

test('every link to a directory ends in a slash, on every built page', () => {
  const html = pages(dist);
  assert.ok(html.length > 80, `walked only ${html.length} pages`);
  const slashless = html.flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/href="(?:https:\/\/mlorente\.dev)?(\/[^"#?]*)/g)]
      .map((match) => match[1])
      .filter((href) => !href.endsWith('/') && existsSync(join(dist, href)) && statSync(join(dist, href)).isDirectory())
      .map((href) => `${relative(dist, file)}: ${href}`),
  );
  assert.deepEqual(slashless, []);
});

test('withTrailingSlash leaves what is not a directory alone', () => {
  assert.equal(withTrailingSlash('/notes'), '/notes/');
  assert.equal(withTrailingSlash('/notes/'), '/notes/');
  assert.equal(withTrailingSlash('/lab#services'), '/lab/#services');
  assert.equal(withTrailingSlash('/tags/go?x=1#y'), '/tags/go/?x=1#y');
  assert.equal(withTrailingSlash('/rss.xml'), '/rss.xml');
  assert.equal(withTrailingSlash('/'), '/');
});

test('the rehype plugin rewrites local links in content and nothing else', () => {
  const link = (href) => ({ type: 'element', tagName: 'a', properties: { href }, children: [] });
  const tree = {
    type: 'root',
    children: [link('/es/rompe'), link('https://example.com/a'), link('//example.com/a'), link('#top'), link('/feed.xml')],
  };
  rehypeTrailingSlash()(tree);
  assert.deepEqual(
    tree.children.map((node) => node.properties.href),
    ['/es/rompe/', 'https://example.com/a', '//example.com/a', '#top', '/feed.xml'],
  );
});

test('nginx redirects to the directory form on the same host', () => {
  const conf = readFileSync(join(site, 'nginx.conf'), 'utf8');
  assert.match(conf, /absolute_redirect off;/, 'nginx would send its own host and port 8080 past the edge');
  assert.ok(!conf.includes('$uri/index.html'), 'serving the index directly is what answers 200 without the slash');
});

test('nginx redirects a direct index.html request without catching its own index lookup', () => {
  const conf = readFileSync(join(site, 'nginx.conf'), 'utf8');
  assert.match(conf, /if \(\$request_uri ~ .*index\\\.html.*\) \{\s*return 301/);
});

test('the index.html redirect cannot leave the host', () => {
  // `$1` becomes the `Location`, and a browser reads `//evil.com/` as another host.
  const conf = readFileSync(join(site, 'nginx.conf'), 'utf8');
  const pattern = new RegExp(conf.match(/if \(\$request_uri ~ (\S+)\) \{/)[1]);
  assert.equal('/notes/index.html'.match(pattern)?.[1], '/notes/');
  assert.equal('/es/notes/index.html?x=1'.match(pattern)?.[1], '/es/notes/');
  assert.equal('/index.html'.match(pattern)?.[1], '/');
  for (const uri of ['//evil.com/index.html', '//index.html', '///evil.com/index.html', '/\\evil.com/index.html']) {
    assert.doesNotMatch(uri, pattern, uri);
  }
});

test("a directory with no index answers the 404 page, not nginx's bare 403", () => {
  const conf = readFileSync(join(site, 'nginx.conf'), 'utf8');
  const es = conf.match(/location \^~ \/es\/ \{[^}]*\}/)[0];
  assert.match(conf.replace(es, ''), /error_page 403 =404 \/404\.html;/);
  assert.match(es, /error_page 403 =404 \/es\/404\/index\.html;/);
});
