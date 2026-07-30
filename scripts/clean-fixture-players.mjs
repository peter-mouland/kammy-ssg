/**
 * Cleans `test-fixtures/spreadsheets/players.json` — the tab that defines which players the app
 * knows about. Two defects in the captured sheet make the fixture unusable as-is.
 *
 * 1. BROKEN VLOOKUPS. 150 of 572 rows have `#N/A (Did not find value ...)` in `isHidden`, 181 in
 *    `club_shortcode` and `status`, 13 in `web_name`. The `isHidden` one is the damaging one:
 *    `scoring/lib/generators.ts` does `Boolean(playerSheet.isHidden)`, and a non-empty `#N/A`
 *    string is truthy, so those players are marked hidden and `transfers/components/player-in-selector.tsx`
 *    filters them out of the transfer picker.
 *
 *    Every value in the column is either `#N/A` or empty — **no player is legitimately flagged
 *    hidden** — so blanking restores the sheet's intent rather than inventing anything. (For
 *    reference, the live sheet is clean: 554 empty and 4 real `hidden` values. This is a defect in
 *    the 25/26 capture, not a production bug.)
 *
 *    `web_name` is refilled from the real 2024/25 bootstrap where the player exists there, so the
 *    UI shows a name instead of `#N/A (Did not find value ...)`.
 *
 * 2. PLAYERS WITH NO STATS THAT NOBODY USED. 114 rows have no element-summary and were never
 *    rostered — not drafted, never an approved transfer in. They exist only to pad the player list,
 *    and each one is a page that renders empty. Removing them means **every player the fixture
 *    knows about has stats**, so a missing summary becomes a real error rather than a routine one.
 *
 *    Anything still rostered is kept regardless: `synthesize-missing-players.mjs` gives the 54
 *    rostered players without 2024/25 stats either a real season total or a stand-in season.
 *
 * Run order:  extract-harness-stats  ->  synthesize-missing-players  ->  this
 * Re-running is safe: it is idempotent, and reports 0 changes on a clean file.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHEETS = join(REPO_ROOT, 'test-fixtures/spreadsheets');
const FPL = join(REPO_ROOT, 'test-fixtures/fpl');

const NA_PREFIX = '#N/A';
const APPROVED = 'Y';
const TRANSFER_TABS = ['premier-league-transfers.json', 'championship-transfers.json', 'league-one-transfers.json'];

const readSheet = (name) => JSON.parse(readFileSync(join(SHEETS, name), 'utf8'));
const indexBy = (header) => Object.fromEntries(header.map((name, i) => [name, i]));
const isNa = (value) => String(value).startsWith(NA_PREFIX);

/** Codes that have an element-summary on disk: real 2024/25, or synthesized. */
function codesWithSummary() {
    const bootstrap = JSON.parse(readFileSync(join(FPL, 'bootstrap-static.json'), 'utf8'));
    const codeById = new Map(bootstrap.elements.map((e) => [e.id, e.code]));
    const synthetic = JSON.parse(readFileSync(join(FPL, 'synthetic-elements.json'), 'utf8'));
    const syntheticIds = new Map(synthetic.elements.map((e) => [e.id, e.code]));

    const codes = new Set();
    for (const file of readdirSync(join(FPL, 'element-summary'))) {
        const id = Number(file.replace('.json', ''));
        const code = codeById.get(id) ?? syntheticIds.get(id);
        if (code) codes.add(code);
    }
    return codes;
}

/** Drafted, or transferred in with an approved status. */
function rosteredCodes() {
    const draft = readSheet('draft.json').values;
    const draftCol = indexBy(draft[0]);
    const codes = new Set(draft.slice(1).map((row) => Number(row[draftCol.Code])).filter(Boolean));

    for (const tab of TRANSFER_TABS) {
        const rows = readSheet(tab).values;
        const col = indexBy(rows[0]);
        for (const row of rows.slice(1)) {
            const codeIn = Number(row[col['Code In']]);
            if (codeIn && String(row[col.Status]) === APPROVED) codes.add(codeIn);
        }
    }
    return codes;
}

/** Real web_name by code, from the 2024/25 bootstrap. */
function namesByCode() {
    const bootstrap = JSON.parse(readFileSync(join(FPL, 'bootstrap-static.json'), 'utf8'));
    return new Map(bootstrap.elements.map((e) => [e.code, e.web_name]));
}

function main() {
    const sheet = readSheet('players.json');
    const header = sheet.values[0];
    const col = indexBy(header);
    const rows = sheet.values.slice(1);

    const withSummary = codesWithSummary();
    const rostered = rosteredCodes();
    const realNames = namesByCode();

    const kept = [];
    const dropped = [];

    for (const row of rows) {
        const code = Number(row[col.code]);
        if (!code) continue;

        if (!withSummary.has(code) && !rostered.has(code)) {
            dropped.push(code);
            continue;
        }
        kept.push(row);
    }

    let blanked = 0;
    let renamed = 0;
    for (const row of kept) {
        const code = Number(row[col.code]);
        for (let i = 0; i < header.length; i++) {
            if (!isNa(row[i])) continue;

            const realName = i === col.web_name ? realNames.get(code) : undefined;
            if (realName) {
                row[i] = realName;
                renamed++;
            } else {
                row[i] = '';
                blanked++;
            }
        }
    }

    sheet.values = [header, ...kept];
    // Keep the range envelope honest about the row count; only the MSW handler echoes it back.
    sheet.range = String(sheet.range).replace(/(\d+)$/, String(kept.length + 1));
    writeFileSync(join(SHEETS, 'players.json'), `${JSON.stringify(sheet, null, 4)}\n`);

    console.log(`players.json: ${rows.length} rows -> ${kept.length}`);
    console.log(`  ✓ dropped ${dropped.length} with no summary and never rostered`);
    console.log(`  ✓ blanked ${blanked} #N/A cells, refilled ${renamed} web_name from the 2024/25 bootstrap`);
    console.log(`  ✓ every remaining player has a summary: ${kept.every((r) => withSummary.has(Number(r[col.code])))}`);
    console.log(`  ✓ every rostered player kept: ${[...rostered].every((c) => kept.some((r) => Number(r[col.code]) === c))}`);
}

main();
