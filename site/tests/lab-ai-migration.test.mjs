/**
 * WEB-080 PR5 — the AI & Automations migration is faithful to its source (AC4).
 *
 * ## What is pinned, and against what
 *
 * The source is kubelab's homepage template
 * `infra/k8s/base/services/homepage-templates/services.yaml.j2` at commit
 * `6cd9ab0ca5948297281b6d53798db97c562ea431`, committed here as
 * `fixtures/services.yaml.j2` so the comparison never moves when kubelab does.
 * Verified on extraction: sha256 of the fixture equals sha256 of that blob.
 *
 * The fixture is a Jinja template, not YAML — `href` values interpolate
 * `{{ global.base_domain }}`, and the `Nodes` group is a `{% for %}` loop. So it
 * is read line-wise over the frozen file rather than through a YAML parser: no
 * new dependency, and nothing to go stale, because the file cannot change.
 * `base_domain` is `kubelab.live`, from `infra/config/values/common.yaml` at the
 * same commit.
 *
 * ## Why `sourceHref` exists, and why it is not always `url`
 *
 * AC4 as written said the page carries "the same entries and links" as the
 * fixture. Measured 2026-09-01, four of the thirteen links cannot be shipped
 * verbatim to a public page:
 *
 *   - two point at `github.com/mlorentedev/knowledge`, a **private** repo — 404
 *     for every visitor;
 *   - one points at `adr-038-sops-age-encryption-for-secrets.md`, which no
 *     longer exists — the ADR was renamed `adr-038-secret-delivery-paths.md`
 *     (404 for everyone, on kubelab's homepage too — filed as debt there);
 *   - six point at `*.kubelab.live` hosts that are gated by Authelia, or in
 *     Argo CD's case answer nothing at all from a public path.
 *
 * The homepage this template feeds is itself behind the mesh, where those links
 * are correct. The Lab page is public, where they are not. AC4 is therefore
 * amended in this PR: the **entries** are pinned verbatim, and each carries its
 * fixture link as `sourceHref` — so the migration stays auditable — while `url`
 * ships only when the destination is genuinely reachable by a reader.
 *
 * That is the same boundary `platform.ts` already draws for services ("Public
 * services only — internal endpoints are not shipped to the client") and the
 * same one PR3 rendered: a private service is not a degraded one, and a link
 * nobody can follow is worse than no link.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');

const fixture = readFileSync(join(here, 'fixtures/services.yaml.j2'), 'utf8');
const data = JSON.parse(readFileSync(join(siteRoot, 'src/data/lab-ai.json'), 'utf8'));
const labAiTs = readFileSync(join(siteRoot, 'src/data/lab-ai.ts'), 'utf8');

/** From `infra/config/values/common.yaml` at the pinned commit. */
const BASE_DOMAIN = 'kubelab.live';

/**
 * The four groups this section migrates. The fixture's other top-level groups
 * (diagrams, services, Network, Nodes) are the homepage's own furniture and are
 * already covered by the Services and Infra sections from PR3.
 */
const AI_GROUPS = ['Agents', 'Protocols', 'Workflows', 'Telemetry'];

/**
 * Read the fixture's AI region line-wise.
 *
 * Group headers sit at indent 0 (`- Agents:`), entries at indent 4
 * (`    - Curator Agent:`), and an entry's fields at indent 8. Entry names may
 * be quoted in the template — only the `Nodes` loop does that, which is outside
 * this region, but the pattern tolerates it rather than depending on that.
 */
function parseFixture(text) {
  const marker = text.indexOf('{# ── AI FLEET & AUTOMATIONS');
  assert.notEqual(marker, -1, 'the fixture no longer marks the AI region');

  const groups = [];
  let group = null;
  let entry = null;

  for (const line of text.slice(marker).split('\n')) {
    const groupMatch = /^- "?(.+?)"?:\s*$/.exec(line);
    if (groupMatch) {
      group = { name: groupMatch[1], entries: [] };
      groups.push(group);
      entry = null;
      continue;
    }

    const entryMatch = /^ {4}- "?(.+?)"?:\s*$/.exec(line);
    if (entryMatch && group) {
      entry = { name: entryMatch[1] };
      group.entries.push(entry);
      continue;
    }

    const hrefMatch = /^ {8}href: (.+)$/.exec(line);
    if (hrefMatch && entry) {
      entry.href = hrefMatch[1]
        .trim()
        .replaceAll('{{ global.base_domain }}', BASE_DOMAIN);
    }
  }

  return groups.filter((g) => AI_GROUPS.includes(g.name));
}

const source = parseFixture(fixture);

test('the fixture still holds the four groups this section migrates', () => {
  assert.deepEqual(
    source.map((g) => g.name),
    AI_GROUPS,
    'the pinned fixture no longer parses into the four AI groups — it is frozen, so this means the parser broke, not the source',
  );
  assert.equal(
    source.reduce((n, g) => n + g.entries.length, 0),
    13,
    'the pinned fixture no longer yields 13 AI entries',
  );
  for (const group of source) {
    for (const entry of group.entries) {
      assert.ok(entry.href, `fixture entry ${group.name}/${entry.name} has no href to pin`);
    }
  }
});

test('lab-ai.json names the source it was migrated from', () => {
  assert.equal(data.source?.repo, 'mlorentedev/kubelab');
  assert.equal(
    data.source?.path,
    'infra/k8s/base/services/homepage-templates/services.yaml.j2',
  );
  assert.equal(
    data.source?.commit,
    '6cd9ab0ca5948297281b6d53798db97c562ea431',
    'the migration must cite the commit its fixture is pinned to',
  );
  assert.equal(data.source?.baseDomain, BASE_DOMAIN);
});

test('the four groups migrate with the same names and the same order', () => {
  assert.deepEqual(
    data.groups.map((g) => g.name),
    AI_GROUPS,
  );
});

test('every group carries exactly the fixture entries, in order', () => {
  for (const [i, group] of source.entries()) {
    assert.deepEqual(
      data.groups[i].entries.map((e) => e.name),
      group.entries.map((e) => e.name),
      `group ${group.name} does not carry the fixture's entries`,
    );
  }
});

test('every entry pins the fixture link verbatim as `sourceHref`', () => {
  const expected = source.flatMap((g) => g.entries.map((e) => e.href)).sort();
  const actual = data.groups
    .flatMap((g) => g.entries.map((e) => e.sourceHref))
    .sort();
  assert.deepEqual(
    actual,
    expected,
    'the migrated `sourceHref` set differs from the fixture — the migration is no longer auditable against its source',
  );
});

test('a link ships only when a reader can actually follow it', () => {
  for (const group of data.groups) {
    for (const entry of group.entries) {
      assert.ok(
        ['public', 'mesh', 'private'].includes(entry.access),
        `${group.name}/${entry.name} has no access boundary`,
      );
      if (entry.access === 'public') {
        assert.ok(
          entry.url?.startsWith('https://'),
          `${group.name}/${entry.name} is public but ships no url`,
        );
      } else {
        assert.equal(
          entry.url,
          undefined,
          `${group.name}/${entry.name} is ${entry.access} but ships a url — internal endpoints are not shipped to the client`,
        );
      }
    }
  }
});

test('a link that departs from its source says why', () => {
  for (const group of data.groups) {
    for (const entry of group.entries) {
      if (entry.url && entry.url !== entry.sourceHref) {
        assert.ok(
          entry.urlNote && entry.urlNote.length > 20,
          `${group.name}/${entry.name} ships a url its source does not, with no note explaining the departure`,
        );
      }
    }
  }
});

test('every visible string has its es twin', () => {
  for (const group of data.groups) {
    assert.ok(group.nameEs, `group ${group.name} has no \`nameEs\``);
    for (const entry of group.entries) {
      assert.ok(
        entry.description,
        `${group.name}/${entry.name} has no description`,
      );
      assert.ok(
        entry.descriptionEs,
        `${group.name}/${entry.name} has no \`descriptionEs\``,
      );
      assert.notEqual(
        entry.descriptionEs,
        entry.description,
        `${group.name}/${entry.name}'s \`descriptionEs\` is the English string`,
      );
    }
  }
});

test('lab-ai.ts types the data rather than leaving it untyped JSON', () => {
  for (const symbol of ['LabAiEntry', 'LabAiGroup', 'LabAiManifest', 'labAi']) {
    assert.match(
      labAiTs,
      new RegExp(`\\b${symbol}\\b`),
      `lab-ai.ts does not export \`${symbol}\``,
    );
  }
  assert.match(
    labAiTs,
    /access:\s*'public'\s*\|\s*'mesh'\s*\|\s*'private'/,
    'lab-ai.ts does not type the access boundary as a union',
  );
});
