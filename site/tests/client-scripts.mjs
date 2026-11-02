/**
 * What the site's client-side scripts do in a browser (#353).
 *
 *   npm run build && node tests/client-scripts.mjs
 *
 * Each case runs the shipped script in Chromium: a test that reads the source as
 * text cannot see a button stuck on `...` after a failed submit (#131). Playwright
 * and not jsdom because it is already in the CI job, and it runs the bundle Astro
 * emits rather than a copy of the handler. `/api/subscribe` is mocked: no request
 * leaves the machine, so the verdict never depends on a live API.
 */
import assert from 'node:assert/strict';

import { chromium } from 'playwright';

import { labBaseUrl } from './lib/serve.mjs';

const FORM_PAGE = '/es/newsletter/';
const LABEL = 'form[data-api-url] button[type="submit"]';

const { url: BASE, server } = await labBaseUrl();
const browser = await chromium.launch();

/** The form page with `/api/subscribe` answered by `respond`, which also records the bodies. */
async function formPage(respond) {
  const page = await browser.newPage();
  const requests = [];
  await page.route('**/api/subscribe', async (route) => {
    requests.push(route.request().postDataJSON());
    await respond(route, requests.length);
  });
  await page.goto(`${BASE}${FORM_PAGE}`, { waitUntil: 'load' });
  const form = page.locator('form[data-api-url]').first();
  return { page, form, requests, button: form.locator('button[type="submit"]'), msg: form.locator('.subscribe-msg') };
}

async function submit({ form, button }, { email = 'a@example.com', consent = true } = {}) {
  await form.locator('input[name="email"]').fill(email);
  await form.locator('input[name="privacy_policy"]').setChecked(consent);
  await button.click();
}

const CASES = {
  'an invalid email sends nothing and says why': async () => {
    const context = await formPage((route) => route.fulfill({ status: 201 }));
    await submit(context, { email: 'not-an-email' });
    assert.equal(await context.msg.textContent(), await context.form.getAttribute('data-error-text'));
    assert.equal(context.requests.length, 0);
    await context.page.close();
  },

  'an unticked consent box sends nothing and says why': async () => {
    const context = await formPage((route) => route.fulfill({ status: 201 }));
    await submit(context, { consent: false });
    assert.equal(await context.msg.textContent(), await context.form.getAttribute('data-consent-text'));
    assert.equal(context.requests.length, 0);
    await context.page.close();
  },

  'a new or known address ends on the success state': async () => {
    for (const status of [201, 409]) {
      const context = await formPage((route) => route.fulfill({ status }));
      await submit(context);
      await context.msg.and(context.page.getByText(await context.form.getAttribute('data-success-text'))).waitFor();
      assert.equal((await context.button.textContent()).trim(), await context.form.getAttribute('data-button-success'));
      assert.ok(await context.button.isDisabled(), `the button stays disabled after ${status}`);
      assert.equal(context.requests[0].email, 'a@example.com');
      assert.equal(context.requests[0].privacy_policy, true);
      await context.page.close();
    }
  },

  'a failed submit restores the label, re-enables the button and shows the error': async () => {
    const failures = {
      'a 500': (route) => route.fulfill({ status: 500 }),
      'a dropped connection': (route) => route.abort('connectionfailed'),
    };
    for (const [name, respond] of Object.entries(failures)) {
      const context = await formPage(respond);
      const label = (await context.button.textContent()).trim();
      await submit(context);
      await context.page.waitForFunction((selector) => !document.querySelector(selector).disabled, LABEL);
      assert.equal((await context.button.textContent()).trim(), label, `label after ${name}`);
      assert.equal(await context.msg.textContent(), await context.form.getAttribute('data-network-error'));
      await context.page.close();
    }
  },

  'a retry after a failure can succeed': async () => {
    const context = await formPage((route, attempt) => route.fulfill({ status: attempt === 1 ? 500 : 201 }));
    await submit(context);
    await context.page.waitForFunction((selector) => !document.querySelector(selector).disabled, LABEL);
    await context.button.click();
    await context.msg.and(context.page.getByText(await context.form.getAttribute('data-success-text'))).waitFor();
    assert.equal(context.requests.length, 2);
    await context.page.close();
  },

  'the /es/rompe copy button copies the prompt and returns to its label': async () => {
    const browserContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await browserContext.newPage();
    await page.clock.install();
    await page.goto(`${BASE}/es/rompe/`, { waitUntil: 'load' });
    const copy = page.locator('#copy-prompt');
    await copy.click();
    await page.getByText('¡Copiado!').waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copied, await page.locator('#ubuntu-prompt').textContent());
    await page.clock.runFor(2000);
    assert.equal((await copy.textContent()).trim(), 'Copiar');
    await browserContext.close();
  },
};

let failures = 0;
for (const [name, run] of Object.entries(CASES)) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`✗ ${name}\n    ${error.message}`);
  }
}

await browser.close();
server?.close();

if (failures > 0) {
  console.error(`\n${failures} of ${Object.keys(CASES).length} client script cases failed`);
  process.exit(1);
}
console.log(`client scripts: ${Object.keys(CASES).length} cases`);
