/**
 * The Lab shows web's platform contract, `kubelab.yaml`, as the build read it
 * (#592): the text on the page is the file at the repository root, byte for
 * byte, on both locales. The Docker side (the file reaches the image) is
 * `docker-build-inputs.test.mjs`.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const contract = readFileSync(join(site, '..', 'kubelab.yaml'), 'utf8').trimEnd();
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
const decode = (html) => html.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => entities[e]);

// The page publishes the whole file, so the file must hold nothing that is not
// public. A secret here, even a name, needs a decision about what the Lab shows
// first (#630 review): this test fails until someone makes it.
test('the contract the page publishes declares no secrets', () => {
  assert.match(contract, /^secrets:\s*\[\]\s*$/m, 'kubelab.yaml declares secrets: decide what the Lab shows before publishing it');
});

for (const page of ['lab', 'es/lab']) {
  test(`/${page}/ shows kubelab.yaml verbatim, linked to the file`, () => {
    const file = join(site, 'dist', page, 'index.html');
    assert.ok(existsSync(file), 'run the build first');
    const html = readFileSync(file, 'utf8');
    const block = html.match(/<details[^>]*data-lab-contract[\s\S]*?<\/details>/)?.[0];
    assert.ok(block, 'no contract block on the page');
    assert.equal(decode(block.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)[1]), contract);
    assert.match(block, /href="https:\/\/github\.com\/mlorentedev\/web\/blob\/(?:[0-9a-f]{7,}|master)\/kubelab\.yaml"/);
  });
}
