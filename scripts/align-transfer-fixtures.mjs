/**
 * Shift the transfer fixtures onto the FPL fixtures' calendar.
 *
 * `test-fixtures/` pairs the **2025/26 spreadsheet** with **2024/25 FPL data**, because
 * those were the only complete halves available. The plan says gameweek *numbers* align and
 * "dates enter only via deadlines" — which is true of scoring and false of transfers.
 * Transfers are assigned to a gameweek by comparing their own timestamp against the
 * calendar's deadlines, so with the sheet a year ahead of the calendar **every transfer
 * landed after the final deadline**:
 *
 *     before   premierLeague: 483 of 483 unassigned ("after-season")
 *     after    spread across all 38 gameweeks, 3 genuine close-season leftovers
 *
 * The consequence was silent and total: the season rebuild reported `transfersApplied: 0`
 * for every gameweek of every division, copying rosters forward 38 times and never
 * exercising the transfer path at all. The one place it surfaced was `/admin/transfers`,
 * which tried to replay a whole season's transfers against a single gameweek's roster and
 * threw `Player Konsa (199798) not found in Tom S's roster`.
 *
 * **364 days, not 365**: 52 whole weeks, so a Saturday stays a Saturday. Deadlines fall on
 * particular weekdays and a one-day drift would push transfers across them.
 *
 * The original timestamps are in git history. Re-running this is not idempotent — it would
 * shift by another year — so it is a one-off, kept for the record rather than for a pipeline.
 *
 *     node scripts/align-transfer-fixtures.mjs --check    # report, change nothing
 *     node scripts/align-transfer-fixtures.mjs --apply
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURE_DIR = join(import.meta.dirname, '..', 'test-fixtures', 'spreadsheets');
const SHIFT_DAYS = 364;
const SHIFT_MS = SHIFT_DAYS * 24 * 60 * 60 * 1000;

const apply = process.argv.includes('--apply');
if (!apply && !process.argv.includes('--check')) {
    console.error('Pass --check or --apply.');
    process.exit(1);
}

const deadlines = JSON.parse(readFileSync(join(FIXTURE_DIR, '..', 'fpl', 'bootstrap-static.json'), 'utf8')).events.map(
    (event) => ({ id: event.id, at: new Date(event.deadline_time).getTime() }),
);

const gameweekFor = (iso) => {
    const at = new Date(iso).getTime();
    return deadlines.find((deadline) => at <= deadline.at)?.id ?? 'after-season';
};

for (const file of readdirSync(FIXTURE_DIR).filter((name) => name.endsWith('-transfers.json'))) {
    const path = join(FIXTURE_DIR, file);
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    const rows = Array.isArray(parsed) ? parsed : parsed.values;
    const column = rows[0].indexOf('Timestamp');
    if (column === -1) throw new Error(`${file} has no Timestamp column`);

    let unassignedBefore = 0;
    let unassignedAfter = 0;

    for (const row of rows.slice(1)) {
        const original = row[column];
        if (!original) continue;

        if (gameweekFor(original) === 'after-season') unassignedBefore++;
        const shifted = new Date(new Date(original).getTime() - SHIFT_MS).toISOString();
        if (gameweekFor(shifted) === 'after-season') unassignedAfter++;

        if (apply) row[column] = shifted;
    }

    console.log(
        `${file.padEnd(34)} ${String(rows.length - 1).padStart(4)} rows  ` +
            `unassigned ${unassignedBefore} -> ${unassignedAfter}`,
    );

    if (apply) writeFileSync(path, `${JSON.stringify(parsed, null, 2)}\n`);
}

console.log(apply ? '\nWritten.' : '\nNothing written (--check).');
