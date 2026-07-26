/**
 * Fetches and saves all FPL API data and Google Sheets data for a given season.
 *
 * Usage:
 *   node --env-file=.env.local scripts/fetch-season-fixtures.mjs 2526
 *
 * Output:
 *   draft/app/api/fixtures/<season>/fpl/bootstrap-static.json
 *   draft/app/api/fixtures/<season>/fpl/fixtures.json
 *   draft/app/api/fixtures/<season>/fpl/element-summary/<id>.json
 *   draft/app/api/fixtures/<season>/spreadsheets/<SheetName>.json
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const season = process.argv[2];
const sheetsOnly = process.argv.includes('--sheets-only');
const fplOnly = process.argv.includes('--fpl-only');

if (!season) {
    console.error('Usage: node --env-file=.env.local scripts/fetch-season-fixtures.mjs <season> [--sheets-only] [--fpl-only]');
    console.error('Example: node --env-file=.env.local scripts/fetch-season-fixtures.mjs 2526');
    process.exit(1);
}

const FPL_BASE = 'https://fantasy.premierleague.com/api';
const FPL_DELAY_MS = Number(process.env.FPL_API_DELAY ?? 200);
const OUTPUT_ROOT = join(REPO_ROOT, 'draft/app/api/fixtures', season);

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_KEY_B64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

// Sheets containing many columns (e.g. one column per gameweek) need a wider range.
const WIDE_RANGE_TABS = new Set(['player-gw-points']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveJson(filePath, data) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2));
}

async function fetchFpl(path) {
    const url = `${FPL_BASE}${path}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Kammy Fantasy Football)' },
    });
    if (!res.ok) throw new Error(`FPL ${path} → HTTP ${res.status}`);
    return res.json();
}

async function createSheetsClient() {
    if (!SERVICE_ACCOUNT_KEY_B64) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set');
    const credentials = JSON.parse(Buffer.from(SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8'));
    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return google.sheets({ version: 'v4', auth });
}

async function fetchSheet(sheets, { range }) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
    });
    return res.data;
}

// ---------------------------------------------------------------------------
// FPL
// ---------------------------------------------------------------------------

async function fetchFplData() {
    console.log('\n── FPL API ──────────────────────────────────────');

    console.log('  bootstrap-static...');
    const bootstrap = await fetchFpl('/bootstrap-static/');
    await saveJson(join(OUTPUT_ROOT, 'fpl/bootstrap-static.json'), bootstrap);
    console.log(`  ✓ bootstrap-static saved (${bootstrap.elements?.length ?? 0} players)`);

    console.log('  fixtures...');
    const fixtures = await fetchFpl('/fixtures/');
    await saveJson(join(OUTPUT_ROOT, 'fpl/fixtures.json'), fixtures);
    console.log(`  ✓ fixtures saved (${fixtures.length} fixtures)`);

    const players = bootstrap.elements ?? [];
    console.log(`  element-summary — fetching ${players.length} players...`);

    let saved = 0;
    let failed = 0;
    for (const player of players) {
        try {
            await sleep(FPL_DELAY_MS);
            const detail = await fetchFpl(`/element-summary/${player.id}/`);
            await saveJson(join(OUTPUT_ROOT, `fpl/element-summary/${player.id}.json`), detail);
            saved++;
            if (saved % 50 === 0) console.log(`    ${saved}/${players.length} done...`);
        } catch (err) {
            failed++;
            console.warn(`    ⚠ player ${player.id} (${player.web_name}) failed: ${err.message}`);
        }
    }
    console.log(`  ✓ element-summary: ${saved} saved, ${failed} failed`);
}

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

async function fetchSheetsData() {
    if (!SPREADSHEET_ID) {
        console.warn('\n── Sheets — skipped (GOOGLE_SHEETS_ID not set) ─────');
        return;
    }
    if (!SERVICE_ACCOUNT_KEY_B64) {
        console.warn('\n── Sheets — skipped (GOOGLE_SERVICE_ACCOUNT_KEY not set) ─────');
        return;
    }

    console.log('\n── Google Sheets ────────────────────────────────');

    let sheetsClient;
    try {
        sheetsClient = await createSheetsClient();
    } catch (err) {
        console.error(`  ✗ Failed to create Sheets client: ${err.message}`);
        return;
    }

    // Fetch all tabs that exist in the spreadsheet
    const metaRes = await sheetsClient.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const tabs = (metaRes.data.sheets ?? []).map((s) => s.properties?.title ?? '').filter(Boolean);
    console.log(`  Found ${tabs.length} tabs: ${tabs.join(', ')}`);

    for (const tab of tabs) {
        const range = WIDE_RANGE_TABS.has(tab) ? `'${tab}'!A:ZZ` : `'${tab}'!A:Z`;
        try {
            const data = await fetchSheet(sheetsClient, { name: tab, range });
            const filePath = join(OUTPUT_ROOT, `spreadsheets/${tab}.json`);
            await saveJson(filePath, data);
            const rowCount = (data.values?.length ?? 1) - 1;
            console.log(`  ✓ ${tab} (${rowCount} rows)`);
        } catch (err) {
            console.warn(`  ⚠ ${tab} — ${err.message}`);
        }
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log(`\nFetching season fixtures: ${season}`);
    console.log(`Output: ${OUTPUT_ROOT}`);

    if (!sheetsOnly) await fetchFplData();
    if (!fplOnly) await fetchSheetsData();

    console.log('\n✓ Done\n');
}

main().catch((err) => {
    console.error('\n✗ Fatal error:', err);
    process.exit(1);
});
