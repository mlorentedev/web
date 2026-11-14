#!/usr/bin/env node
/**
 * Record one access check (WEB-173).
 *
 *   npm run access:report [-- --observations <file>]
 *
 * Observes every row of `src/data/service-access.json` from outside the mesh and
 * writes `src/data/access-status.json`: the date of the check and, per row, the
 * state seen and whether the row still holds. A row that no longer holds is
 * recorded, not refused: the record is what was seen, and `npm run test:access`
 * is the alarm. With `--observations`, the raw observations are also written to
 * that file, so the test can assert on the same reading.
 *
 * Exits 0 whenever it could write the record.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildReport } from '../tests/lib/access.mjs';
import { observeAll } from '../tests/lib/observe.mjs';

const data = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/data');
const table = JSON.parse(readFileSync(join(data, 'service-access.json'), 'utf8'));

const observations = await observeAll(table);
const report = buildReport(table, observations, new Date());
writeFileSync(join(data, 'access-status.json'), `${JSON.stringify(report, null, 2)}\n`);

const flag = process.argv.indexOf('--observations');
if (flag !== -1) writeFileSync(process.argv[flag + 1], `${JSON.stringify(observations, null, 2)}\n`);

for (const [slug, { state, ok }] of Object.entries(report.rows)) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${slug}: ${state}`);
}
