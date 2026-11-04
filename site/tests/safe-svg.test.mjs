/**
 * The allowlist that decides whether the upstream GitHub chart may be served
 * from this origin (`src/lib/safe-svg.mjs`). An SVG opened directly runs its
 * scripts in the origin that served it, so every way in is refused.
 *
 *   npm test
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { unsafeSvg } from '../src/lib/safe-svg.mjs';

const chart = (inner) =>
  `<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n` +
  `<svg width="663" height="104" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">${inner}</svg>`;

test('the chart as upstream serves it is accepted', () => {
  const inner =
    '<rect x="0" y="0" width="11" height="11" data-date="2026-11-03" data-score="2" style="fill:#2ed573;"/>' +
    '<text x="20" y="10" style="font-size:9px;fill:#767676;">Nov</text>';
  assert.equal(unsafeSvg(chart(inner)), null);
});

test('anything that can run code or load a resource is refused', () => {
  const hostile = {
    script: '<script>alert(1)</script>',
    handler: '<rect x="0" y="0" width="1" height="1" onload="alert(1)"/>',
    'handler hidden in a value': '<rect style="x onclick=alert(1)"/>',
    foreignObject: '<foreignObject><iframe src="https://example.com"/></foreignObject>',
    link: '<a href="javascript:alert(1)"><text>x</text></a>',
    use: '<use href="#x"/>',
    image: '<image href="https://example.com/x.png"/>',
    animate: '<set attributeName="onmouseover" to="alert(1)"/>',
    'style url': '<rect style="fill:url(https://example.com/x)"/>',
    entity: '<text>&xxe;</text>',
    'inner DOCTYPE': '<!DOCTYPE x><text>x</text>',
  };
  for (const [name, inner] of Object.entries(hostile)) {
    assert.notEqual(unsafeSvg(chart(inner)), null, `${name} was accepted`);
  }
});

test('a body that is not an SVG is refused', () => {
  assert.equal(unsafeSvg('<html><body>502 Bad Gateway</body></html>'), 'not an SVG');
  assert.equal(unsafeSvg(''), 'not an SVG');
});
