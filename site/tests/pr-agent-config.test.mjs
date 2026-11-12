/**
 * PR-Agent's ticket-compliance table stays off (WEB-104 AC3).
 *
 * With it on, the reviewer reads every issue a PR *mentions* as requirements the
 * diff must meet. A PR that cites where it came from with `Refs` is then
 * "partially compliant" by construction, and PR numbers get resolved as issue
 * numbers. The table's signal was zero, so it is disabled; this keeps it from
 * being switched back on without someone reading why it was turned off.
 *
 * Read as text: no TOML parser is a direct dependency of `site/`.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const config = readFileSync(join(here, '../../.pr_agent.toml'), 'utf8');

/** The body of one `[section]`, up to the next section header. */
const section = (name) => {
  const start = config.indexOf(`\n[${name}]`);
  assert.notEqual(start, -1, `.pr_agent.toml has no [${name}] section`);
  const rest = config.slice(start + 1);
  const next = rest.slice(1).search(/^\[/m);
  return next === -1 ? rest : rest.slice(0, next + 1);
};

test('the reviewer does not run the ticket-compliance analysis', () => {
  assert.match(section('pr_reviewer'), /^require_ticket_analysis_review\s*=\s*false\s*$/m);
});
