/**
 * The privacy policy says the same thing in both locales, and names only what
 * the site really uses (#349).
 *
 * Two files drift by default, so both must carry the same "last updated" date
 * and name the same services. A service the site has dropped must leave the
 * policy with it: the newsletter (Beehiiv) and the GitHub stats cache
 * (`web:gh-metrics:v1`) once stayed in the text long after the code was gone.
 * That no page requests another origin, which the policy now promises, is held
 * by `tests/lab-axe.mjs`.
 *
 *   npm test
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pages = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/content/pages');
const policy = {
  en: readFileSync(join(pages, 'en-privacy.mdx'), 'utf8'),
  es: readFileSync(join(pages, 'es-privacy.mdx'), 'utf8'),
};

const months = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};

function updated(lang) {
  const m = policy[lang].match(lang === 'en' ? /Last updated: (\d+) (\w+) (\d{4})/ : /Última actualización: (\d+) de (\w+) de (\d{4})/);
  assert.ok(m, `${lang}-privacy.mdx has no "last updated" line`);
  return `${m[3]}-${months[lang].indexOf(m[2]) + 1}-${m[1]}`;
}

/** Services a policy can name; each must appear in both locales or in neither. */
const services = ['Zoho', 'Hetzner', 'CrowdSec', 'Beehiiv', 'Google Analytics', 'AEPD'];

test('both locales carry the same "last updated" date', () => {
  assert.equal(updated('es'), updated('en'));
});

test('both locales name the same services', () => {
  const named = (lang) => services.filter((s) => policy[lang].includes(s));
  assert.deepEqual(named('es'), named('en'));
});

test('the policy describes no service the site has dropped', () => {
  for (const [lang, text] of Object.entries(policy)) {
    assert.doesNotMatch(text, /Beehiiv|newsletter|web:gh-metrics/i, `${lang}-privacy.mdx still describes a dropped service`);
  }
});
