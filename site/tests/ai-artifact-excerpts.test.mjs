/**
 * The `/ai` artifact cards quote the files they link to, verbatim.
 *
 * Each card shows a code block as an excerpt of a file and links to that file.
 * Until this test, the blocks were illustrations typed in by hand: measured on
 * 2026-09-24, 0 of 6, 2 of 5, 0 of 5 and 0 of 5 of their lines were in the
 * linked files. A reader who clicks through to check the proof found a different
 * file.
 *
 * ## What is pinned, and against what
 *
 * Each source is committed under `fixtures/ai-artifacts/` as a full copy taken
 * with `git show <commit>:<path>`, and `SOURCES` records the commit and the git
 * blob id of that file. The first test recomputes the blob id from the fixture's
 * bytes, so anyone can confirm a fixture upstream with
 * `git rev-parse <commit>:<path>`, and a fixture edited here goes red.
 *
 * The card's link must be the permalink to that blob at that commit, not
 * `blob/master`: a moving link sends the reader to tomorrow's file, which is how
 * the quotes and their sources drifted apart unnoticed in the first place.
 *
 * ## The quoting rule
 *
 * A snippet is one or more runs of lines separated by an elision line `[…]`.
 * Every run must appear in its source as one contiguous block of whole lines,
 * character for character. That is stricter than the per-line measurement
 * above: lines found one by one could still be stitched into something the file
 * never says, and a line cut short without an elision reads as the whole rule.
 *
 * Every source here is in a public repository. A rule that only lives in a
 * private file does not get a card.
 *
 * The quotes stay in English on `/es/ai`: they are what the file says. A check
 * that the Spanish pages carry no English must exempt these `<pre>` blocks
 * rather than translate them.
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');

const SOURCES = [
  {
    repo: 'mlorentedev/dotfiles',
    commit: '3c2e393e9fdfbc3b3aa89f2e0b40f90cb62aae4f',
    path: 'AGENTS.md',
    blob: '3e5b34c6a6191eec557988cda79aaff580b8280b',
  },
  {
    repo: 'mlorentedev/kubelab',
    commit: 'b7d0ae471464c144b604bbe04fe33aef5785a155',
    path: 'harness/reviewer-pool.json',
    blob: '021d944de207919c333307d43194b5f93c3c6387',
  },
  {
    repo: 'mlorentedev/kubelab',
    commit: '2b7304a22ea1d9175d172bf06841cd964478ce83',
    path: 'harness/review-attestation.json',
    blob: 'dad1e6349b109a7b1340da83859fcb1f39789cf7',
  },
  {
    repo: 'mlorentedev/kubelab',
    commit: '11389d3cb11950015bd7628a939318b410261aa6',
    path: 'docs/adr/adr-053-platform-product-repos.md',
    blob: 'f9cd89df001a4aa7a0a7ed7e41cc58fce9a29600',
  },
].map((source) => ({
  ...source,
  fixture: join(here, 'fixtures/ai-artifacts', `${source.repo.split('/')[1]}--${source.path.replaceAll('/', '_')}`),
  permalink: `https://github.com/${source.repo}/blob/${source.commit}/${source.path}`,
}));

const ELISION = '[…]';

const pages = [
  { locale: 'en', path: join(siteRoot, 'dist/ai/index.html') },
  { locale: 'es', path: join(siteRoot, 'dist/es/ai/index.html') },
];

/** The id git gives a file's contents: sha1 over `blob <bytes>\0<contents>`. */
function gitBlobId(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Decodes entities without touching whitespace, which a `<pre>` preserves. */
function decode(html) {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (whole, name) => entities[name.toLowerCase()] ?? whole);
}

/** Each card in the artifacts section: its code block and the GitHub link after it. */
function cards(html) {
  const start = html.search(/<section\b[^>]*\bdata-ai-section="artifacts"/);
  assert.notEqual(start, -1, 'no artifacts section on the page');
  const section = html.slice(start, html.indexOf('</section>', start));
  return [...section.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>[\s\S]*?<a\b[^>]*\bhref="(https:\/\/github\.com\/[^"]+)"/g)].map(
    (m) => ({ snippet: decode(m[1]), href: decode(m[2]) }),
  );
}

/** The runs of a snippet between elision lines. */
function runs(snippet) {
  const out = [[]];
  for (const line of snippet.split('\n')) {
    if (line.trim() === ELISION) out.push([]);
    else out.at(-1).push(line);
  }
  return out.map((lines) => lines.join('\n'));
}

test('each pinned fixture is byte-identical to its upstream blob', () => {
  for (const source of SOURCES) {
    assert.ok(existsSync(source.fixture), `missing fixture ${source.fixture}`);
    assert.equal(
      gitBlobId(readFileSync(source.fixture)),
      source.blob,
      `${source.repo}:${source.path} at ${source.commit.slice(0, 7)} — the fixture is not that blob`,
    );
  }
});

for (const { locale, path } of pages) {
  test(`${locale}: every artifact card links to one pinned source, each source once`, () => {
    assert.ok(existsSync(path), `${path} not found — run \`npm run build\` first`);
    const found = cards(readFileSync(path, 'utf8'));
    const permalinks = SOURCES.map((s) => s.permalink);

    assert.equal(found.length, SOURCES.length, `expected ${SOURCES.length} cards, found ${found.length}`);
    for (const { href } of found) {
      assert.ok(permalinks.includes(href), `${href} is not a pinned permalink:\n  ${permalinks.join('\n  ')}`);
    }
    assert.equal(new Set(found.map((c) => c.href)).size, found.length, 'two cards link to the same source');
  });

  test(`${locale}: every artifact snippet is a verbatim excerpt of the file its card links to`, () => {
    const failures = [];
    for (const { snippet, href } of cards(readFileSync(path, 'utf8'))) {
      // Matched on repo and path, not commit: the link test above owns the pin,
      // and this one should still say how much of a mispinned card is quoted.
      const source = SOURCES.find((s) => href.startsWith(`https://github.com/${s.repo}/blob/`) && href.endsWith(`/${s.path}`));
      const text = source ? readFileSync(source.fixture, 'utf8') : '';
      const lines = snippet.split('\n').filter((l) => l.trim() && l.trim() !== ELISION);
      const inSource = lines.filter((l) => text.includes(l)).length;
      const missing = runs(snippet).filter((run) => !run.trim() || !`\n${text}\n`.includes(`\n${run}\n`));

      if (!lines.length || missing.length) {
        failures.push(`${href}\n    ${inSource} of ${lines.length} lines in the source; not contiguous in it:\n    ${missing.map((r) => JSON.stringify(r.slice(0, 120))).join('\n    ')}`);
      }
    }
    assert.deepEqual(failures, [], `snippets that do not quote their source:\n  ${failures.join('\n  ')}`);
  });
}
