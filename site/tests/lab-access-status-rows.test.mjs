/**
 * The `/lab` services table shows what the weekly access check saw (WEB-173).
 *
 * Each row carries a status-page cell: a dot and a word, taken from
 * `src/data/access-status.json`. The word says what the check found for that
 * row, never the access type, which keeps out of the status colours (#251):
 *
 * - `verified`: the host answered as its row says;
 * - `asleep`: an on-demand host gave no response, which its row allows;
 * - `failing`: the host did not answer as its row says.
 *
 * The page also shows two dates, and they are different facts: `measured` is
 * when a person confirmed each row's access type, `checked` is when the weekly
 * check last ran.
 *
 * Reads the built site: `npm run build && npm test`.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const json = (file) => JSON.parse(readFileSync(join(site, 'src/data', file), 'utf8'));
const status = json('access-status.json');
const table = json('service-access.json');

const WORDS = {
  en: { verified: 'verified', asleep: 'asleep', failing: 'failing' },
  es: { verified: 'verificado', asleep: 'apagado', failing: 'con fallo' },
};

/** The outcome a row's record should draw. */
function outcome({ state, ok }) {
  if (!ok) return 'failing';
  return state === 'silent' ? 'asleep' : 'verified';
}

function longDate(iso, lang) {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}

function read(path) {
  const file = join(site, 'dist', path, 'index.html');
  assert.ok(existsSync(file), `${file} not found — run \`npm run build\` first`);
  return readFileSync(file, 'utf8');
}

/** Every services row: its slug and the cell that draws the check. */
function rows(html) {
  return [...html.matchAll(/<tr\b[^>]*\sdata-service-slug="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)].map(([, slug, body]) => {
    const cell = body.match(/<span\b([^>]*\sdata-check="[^"]*"[^>]*)>([\s\S]*?)<\/span>\s*<\/td>/);
    return {
      slug,
      check: cell?.[1].match(/\sdata-check="([^"]*)"/)?.[1],
      checked: cell?.[1].match(/\sdata-checked="([^"]*)"/)?.[1],
      word: cell?.[2].replace(/<[^>]*>/g, '').trim(),
    };
  });
}

test('outcome maps each recorded state to one of three words', () => {
  assert.equal(outcome({ state: 'public', ok: true }), 'verified');
  assert.equal(outcome({ state: 'mesh', ok: true }), 'verified');
  assert.equal(outcome({ state: 'silent', ok: true }), 'asleep');
  assert.equal(outcome({ state: 'silent', ok: false }), 'failing');
  assert.equal(outcome({ state: 'unreachable', ok: false }), 'failing');
});

for (const [path, lang] of [['lab', 'en'], ['es/lab', 'es']]) {
  test(`/${path}: every service row draws what the check recorded for it, dated`, () => {
    const drawn = rows(read(path));
    assert.equal(drawn.length, table.services.length, `/${path} draws ${drawn.length} rows, the table has ${table.services.length}`);
    for (const row of drawn) {
      const record = status.rows[row.slug];
      assert.ok(record, `${row.slug} has no record in access-status.json`);
      const expected = outcome(record);
      assert.equal(row.check, expected, `${row.slug}: drawn as ${row.check}, recorded as ${expected}`);
      assert.equal(row.word, WORDS[lang][expected], `${row.slug}: the word is "${row.word}"`);
      assert.equal(row.checked, status.checked, `${row.slug}: dated ${row.checked}, last check ${status.checked}`);
    }
  });

  test(`/${path}: shows when the access was measured and when it was last checked, apart`, () => {
    const html = read(path);
    for (const [name, iso] of [['measured', table.measured], ['checked', status.checked]]) {
      assert.match(html, new RegExp(`<time datetime="${iso}"[^>]*\\sdata-date-of="${name}"[^>]*>${longDate(iso, lang)}</time>`),
        `/${path}: the ${name} date ${iso} is not shown`);
    }
  });
}
