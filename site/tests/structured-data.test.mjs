/**
 * Notes, projects and tag pages say what they are in JSON-LD (#124).
 *
 * The site graph typed every page as a generic `WebPage`, so no note carried a
 * machine-readable headline, date or author, and nothing told "Hive" the MCP
 * server apart from Apache Hive. Each assertion reads the built page and checks
 * the graph against what the same page renders, so the two cannot disagree.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const SITE = 'https://mlorente.dev';
const PERSON = `${SITE}/#person`;

function page(path) {
  const file = join(dist, path, 'index.html');
  assert.ok(existsSync(file), `dist/${path}/index.html must exist — run the build first`);
  const html = readFileSync(file, 'utf8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1, `${path}: expected one JSON-LD block`);
  return { html, graph: JSON.parse(blocks[0][1])['@graph'] };
}

/** The text of an HTML fragment: tags stripped, the entities Astro escapes decoded. */
const text = (html) =>
  html.replace(/<[^>]*>/g, '').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code)).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();

const ofType = (graph, type) => graph.filter((node) => node['@type'] === type);
const dirs = (path) =>
  readdirSync(join(dist, path), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${path}/${entry.name}`);

/** The breadcrumb ends at the page itself, and every item is an absolute URL on the site. */
function assertBreadcrumb(graph, path) {
  const [crumbs] = ofType(graph, 'BreadcrumbList');
  assert.ok(crumbs, `${path}: no BreadcrumbList`);
  const items = crumbs.itemListElement;
  assert.deepEqual(items.map((item) => item.position), items.map((_, i) => i + 1), `${path}: positions`);
  assert.equal(items.at(-1).item, `${SITE}/${path}/`, `${path}: the last crumb is not the page`);
  for (const item of items) assert.ok(item.item.startsWith(`${SITE}/`) && item.name, `${path}: ${JSON.stringify(item)}`);
}

for (const [locale, inLanguage] of [['', 'en-US'], ['es/', 'es-ES']]) {
  const notes = dirs(`${locale}notes`);
  // No note is written in Spanish yet, so /es/notes/ builds only its index.
  test(`${locale || 'en/'}: every note is a BlogPosting matching what it renders`, { skip: locale !== '' && notes.length === 0 }, () => {
    assert.ok(notes.length > 0, 'no notes were built');
    for (const path of notes) {
      const { html, graph } = page(path);
      const [post] = ofType(graph, 'BlogPosting');
      assert.ok(post, `${path}: no BlogPosting`);
      assert.equal(post.headline, text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]), `${path}: headline`);
      assert.match(html, new RegExp(`<time datetime="${post.datePublished}"`), `${path}: datePublished differs from the visible date`);
      assert.deepEqual(post.author, { '@id': PERSON }, `${path}: author`);
      assert.equal(post.inLanguage, inLanguage, `${path}: inLanguage`);
      assert.equal(post.mainEntityOfPage['@id'], `${SITE}/${path}/#webpage`, `${path}: mainEntityOfPage`);
      // The reference must land on a node in the same graph, or it dangles
      // while the page still renders (a trailing-slash mismatch would do it).
      assert.ok(
        graph.some((node) => node['@type'] === 'WebPage' && node['@id'] === post.mainEntityOfPage['@id']),
        `${path}: mainEntityOfPage points at no WebPage in the graph`,
      );
      assertBreadcrumb(graph, path);
    }
  });
}

test('the author every BlogPosting points at exists in the same graph', () => {
  const [path] = dirs('notes');
  const { graph } = page(path);
  assert.ok(graph.some((node) => node['@id'] === PERSON && node['@type'] === 'Person'));
});

test('/projects/ declares one SoftwareSourceCode per project card, with its repository', () => {
  const { html, graph } = page('projects');
  const code = ofType(graph, 'SoftwareSourceCode');
  // ProjectCard's heading level varies with the page; its data attribute does not.
  const cards = [...html.matchAll(/<h[2-4][^>]*\bdata-project-title\b[^>]*>([\s\S]*?)<\/h[2-4]>/g)].map((m) => text(m[1]));
  assert.ok(cards.length > 0, 'no project cards found');
  assert.deepEqual(code.map((node) => node.name).sort(), [...cards].sort());
  for (const node of code) {
    assert.deepEqual(node.author, { '@id': PERSON }, `${node.name}: author`);
    assert.ok(node.codeRepository || node.url, `${node.name}: neither a repository nor a page`);
    if (node.codeRepository) assert.match(node.codeRepository, /^https:\/\/github\.com\//, node.name);
  }
  const hive = code.find((node) => node.name === 'Hive');
  assert.ok(hive?.codeRepository, 'Hive carries no codeRepository, so nothing tells it apart from Apache Hive');
});

for (const locale of ['', 'es/']) {
  test(`${locale || 'en/'}: every tag page has a breadcrumb ending at itself`, () => {
    const tags = dirs(`${locale}tags`);
    assert.ok(tags.length > 0, 'no tag pages were built');
    for (const path of tags) assertBreadcrumb(page(path).graph, path);
  });
}
