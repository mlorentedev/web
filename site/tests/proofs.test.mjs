/**
 * The proofs that open `/lab` and `/ai` are complete, dated and verifiable
 * (WEB-141 AC1, AC9).
 *
 * A proof answers four questions: whose problem, what constraint, the measured
 * result, and where to verify it. One missing answer turns it back into a claim,
 * so each one is required here, in both locales, and the two locales must differ
 * (`es-no-english.test.mjs` fails on a text node that reads the same on both).
 *
 * The one exception is the `agents` result, which stays empty while the Hive
 * figure waits for its method (#238, WEB-093). It is named here rather than
 * detected: whether an issue is open is not something an offline test can know.
 * While it waits, `pending` says why, so the page never drops the question.
 *
 * A result is a measurement, so it carries its method and the ISO date it was
 * measured, and that date may not be in the future (AC9). Where-to-verify is a
 * route on this site: it must exist in both locales, and so must its anchor.
 *
 * Reads `src/data/proofs.ts` directly (Node >= 22.18 strips its types) and the
 * built site for the routes: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

const { proofs } = await import('../src/data/proofs.ts');

const IDS = ['kubelab', 'agents'];
const MAY_LACK_RESULT = new Set(['agents']);
const LOCALES = ['en', 'es'];
const DATE = /^\d{4}-\d{2}(?:-\d{2})?$/;

function assertLocalized(value, what) {
  for (const lang of LOCALES) {
    assert.ok(value?.[lang]?.trim(), `${what} is empty in ${lang}`);
  }
  assert.notEqual(value.en.trim(), value.es.trim(), `${what} reads the same in both locales`);
}

/** The built file for a site path, in a locale. */
function built(path, lang) {
  const route = path.replace(/^\/|\/$/g, '');
  return join(dist, ...(lang === 'es' ? ['es'] : []), route, 'index.html');
}

test('the proofs are exactly kubelab and agents', () => {
  assert.deepEqual(Object.keys(proofs).sort(), [...IDS].sort());
});

for (const id of IDS) {
  const proof = proofs[id];

  test(`${id}: says whose problem it was and what constrained it`, () => {
    assertLocalized(proof.problem, `${id}.problem`);
    assertLocalized(proof.constraint, `${id}.constraint`);
  });

  test(`${id}: the result is measured, with its method and a date that has passed`, () => {
    if (proof.result === null) {
      assert.ok(MAY_LACK_RESULT.has(id), `${id} has no result, and only agents may wait for one`);
      assertLocalized(proof.pending, `${id}.pending`);
      return;
    }
    assert.equal(proof.pending, undefined, `${id} has a result, so it cannot also be pending`);
    assertLocalized(proof.result.text, `${id}.result.text`);
    assert.ok(proof.result.method?.trim(), `${id}.result has no method`);
    assert.match(proof.result.measured ?? '', DATE, `${id}.result.measured is not an ISO date`);
    const measured = Date.parse(proof.result.measured);
    assert.ok(Number.isFinite(measured), `${id}.result.measured is not a real date`);
    assert.ok(measured <= Date.now(), `${id}.result.measured is in the future`);
  });

  test(`${id}: where to verify it is a route that exists in both locales`, () => {
    assertLocalized(proof.verify?.label, `${id}.verify.label`);
    const { href } = proof.verify;
    assert.match(href, /^\/(?!es(?:\/|$|#))/, `${id}.verify.href must be a site path without a locale: "${href}"`);
    const [path, anchor] = href.split('#');
    for (const lang of LOCALES) {
      const file = built(path, lang);
      assert.ok(existsSync(file), `${id}: ${href} does not resolve in ${lang} (${file}); run \`npm run build\` first`);
      if (anchor) {
        assert.match(readFileSync(file, 'utf8'), new RegExp(`\\sid="${anchor}"`), `${id}: #${anchor} is not on ${href} in ${lang}`);
      }
    }
  });
}

// ------------------------------------------------------------------ rendered

/** Undo what Astro escapes in text and attributes. */
const decode = (s) =>
  s.replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function month(date, lang) {
  const [year, number] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, number - 1, 1)),
  );
}

/** The text of the element carrying `data-proof-field="<field>"`, and its attributes. */
function field(block, name) {
  const match = block.match(new RegExp(`<([a-z]+)\\b([^>]*\\sdata-proof-field="${name}"[^>]*)>([^<]*)<`));
  return match && { attributes: match[2], text: decode(match[3].trim()) };
}

for (const [page, id] of [
  ['lab', 'kubelab'],
  ['ai', 'agents'],
]) {
  for (const lang of LOCALES) {
    const path = lang === 'es' ? `es/${page}` : page;
    const proof = proofs[id];

    test(`/${path}: opens with the ${id} proof, right under the hero`, () => {
      const html = readFileSync(built(`/${page}`, lang), 'utf8');
      const main = html.slice(html.indexOf('<main'));
      const sections = [...main.matchAll(/<section\b([^>]*)>/g)];
      assert.match(sections[0]?.[1] ?? '', /\sdata-(?:lab|ai)-section="hero"/, 'the hero is not the first section');
      const proof = main.search(new RegExp(`<article\\b[^>]*\\sdata-proof="${id}"`));
      assert.ok(proof > sections[0].index, `the ${id} proof is not after the hero`);
      assert.ok(proof < sections[1].index, `the ${id} proof is not before the first numbered section`);
      assert.equal([...main.matchAll(/\sdata-proof=/g)].length, 1, 'the page carries more than one proof');
    });

    test(`/${path}: the ${id} proof shows its four answers in ${lang}`, () => {
      const html = readFileSync(built(`/${page}`, lang), 'utf8');
      const block = html.match(new RegExp(`<article\\b[^>]*\\sdata-proof="${id}"[\\s\\S]*?</article>`))?.[0];
      assert.ok(block, `no ${id} proof on /${path}`);

      assert.equal(field(block, 'problem')?.text, proof.problem[lang]);
      assert.equal(field(block, 'constraint')?.text, proof.constraint[lang]);

      const verify = field(block, 'verify');
      assert.equal(verify?.text, proof.verify.label[lang]);
      const localized = lang === 'es' ? `/es${proof.verify.href}` : proof.verify.href;
      assert.match(verify.attributes, new RegExp(`\\shref="${localized}"`), `the link does not open ${localized}`);

      if (proof.result) {
        const result = field(block, 'result');
        assert.equal(result?.text, proof.result.text[lang]);
        assert.equal(decode(result.attributes.match(/\sdata-method="([^"]*)"/)?.[1] ?? ''), proof.result.method);
        assert.match(result.attributes, new RegExp(`\\sdata-date="${proof.result.measured}"`));
        assert.match(result.attributes, /\sdata-figure\b/, 'the result is a figure and must say so');
        const shown = month(proof.result.measured, lang);
        assert.ok(decode(block).includes(shown), `the proof does not say when it was measured ("${shown}")`);
      } else {
        assert.equal(field(block, 'pending')?.text, proof.pending[lang]);
        assert.doesNotMatch(block, /\sdata-figure\b/, 'a proof waiting for its result carries no figure');
      }
    });
  }
}
