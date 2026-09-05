/**
 * SubscribeForm i18n unit tests (WEB-083 / #188).
 *
 * Verifies:
 * - AC1: All form strings live in site/src/i18n/ui.ts across en and es.
 * - AC2: Privacy policy link is locale-aware via translatePath('/legal/privacy').
 * - AC3: SubscribeForm.astro contains zero hardcoded Spanish defaults or URLs.
 * - AC4: Built Spanish pages render localized values and links properly.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const componentPath = join(siteRoot, 'src', 'components', 'SubscribeForm.astro');
const uiPath = join(siteRoot, 'src', 'i18n', 'ui.ts');

test('SubscribeForm has zero hardcoded Spanish strings or hardcoded /es/ paths', () => {
  const code = readFileSync(componentPath, 'utf8');

  // Hardcoded strings flagged in issue #188
  const forbiddenPatterns = [
    /placeholder\s*=\s*['"]tu@email\.com['"]/,
    /successText\s*=\s*['"]¡Listo!/,
    /errorText\s*=\s*['"]Por favor, introduce/,
    /consentText\s*=\s*['"]Necesito que aceptes/,
    /href=['"]\/es\/legal\/privacy['"]/,
    /Acepto la <a/,
    />política de privacidad<\/a>/,
    /button\.textContent\s*=\s*['"]Recibido['"]/,
    /msg\.textContent\s*=\s*['"]Error\. Inténtalo de nuevo\.['"]/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.strictEqual(
      pattern.test(code),
      false,
      `SubscribeForm.astro should not match hardcoded pattern: ${pattern}`
    );
  }

  // Must use i18n helpers
  assert.ok(code.includes("useTranslations"), 'Must use useTranslations');
  assert.ok(code.includes("useTranslatedPath"), 'Must use useTranslatedPath');
  assert.ok(code.includes("translatePath('/legal/privacy')"), 'Must use translatePath for privacy URL');
});

test('ui.ts carries all subscribe keys for both locales', async () => {
  const { ui } = await import('../src/i18n/ui.ts');

  const requiredKeys = [
    'subscribe.placeholder',
    'subscribe.successText',
    'subscribe.errorText',
    'subscribe.consentText',
    'subscribe.consentPrefix',
    'subscribe.privacyPolicy',
    'subscribe.buttonSuccess',
    'subscribe.networkError',
  ];

  for (const key of requiredKeys) {
    assert.ok(ui.en[key], `Missing en translation for ${key}`);
    assert.ok(ui.es[key], `Missing es translation for ${key}`);
    assert.notStrictEqual(ui.en[key], ui.es[key], `en and es should differ for ${key}`);
  }

  // Ensure EN has no Spanish text
  assert.strictEqual(ui.en['subscribe.placeholder'], 'you@email.com');
  assert.strictEqual(ui.en['subscribe.buttonSuccess'], 'Received');
  assert.strictEqual(ui.es['subscribe.placeholder'], 'tu@email.com');
  assert.strictEqual(ui.es['subscribe.buttonSuccess'], 'Recibido');
});

test('built Spanish newsletter page contains correct localized privacy link and attributes', () => {
  const esNewsletterPath = join(siteRoot, 'dist', 'es', 'newsletter', 'index.html');
  if (!existsSync(esNewsletterPath)) {
    // If not built yet, skip
    return;
  }

  const html = readFileSync(esNewsletterPath, 'utf8');
  assert.ok(html.includes('href="/es/legal/privacy"'), 'Spanish page links to /es/legal/privacy');
  assert.ok(html.includes('data-button-success="Recibido"'), 'Spanish page has data-button-success="Recibido"');
});
