/**
 * Fetches and saves all FPL API data and Google Sheets data for a given season.
 *
 * Usage:
 *   node --env-file=.env.local scripts/fetch-season-fixtures.mjs 2526
 *
 * Output:
 *   test-fixtures/spreadsheets/<slug>.json               tracked — the harness reads these
 *   archive/<season>/fpl/bootstrap-static.json           gitignored — raw, 57MB
 *   archive/<season>/fpl/fixtures.json
 *   archive/<season>/fpl/element-summary/<id>.json
 *
 * Every tab is read `A:ZZ`. It used to be `A:Z` for all but one tab, which silently truncated
 * `Player Export` and `FPL_Player_export` at exactly 26 columns — losing every FPL stat that
 * sorts after `status`, including the defensive-contribution components the scoring engine needs.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// `@googleapis/sheets`, not the `googleapis` umbrella — that dependency was removed in 8bd01a7
// and this script was left importing it, so it had been broken since. `JWT` comes from this
// package's own `auth` export for the reason documented in
// `draft/app/_shared/lib/sheets/utils/common.ts`: the nested google-auth-library is a different
// version to the workspace one, and `sheets()` will not accept a JWT built from the other copy.
import { auth as googleAuth, sheets as sheetsApi } from '@googleapis/sheets';

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
/**
 * Two destinations, by owner. Sheets are small and the harness reads them directly, so they are
 * tracked in `test-fixtures/`. The raw FPL captures are 57MB and go to gitignored `archive/`.
 *
 * Neither goes under `draft/app/` any more: a dynamic import there once pulled every fixture JSON
 * into the deployed server bundle (35MB, 1318 chunks). See archive/README.md.
 */
const SHEETS_ROOT = join(REPO_ROOT, 'test-fixtures/spreadsheets');
const FPL_ROOT = join(REPO_ROOT, 'archive', season, 'fpl');

/**
 * Tab name -> filename. Sheet tabs use four naming styles (`UserTeams`,
 * `premierLeague-transfers`, `FPL Team Codes`, `FPL_Player_export`); fixture filenames are
 * lower-kebab-case. Must stay identical to the resolver the harness uses to read them back —
 * see test-fixtures/README.md.
 */
const slugForTab = (tab) =>
    tab
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_KEY_B64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;


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
    const auth = new googleAuth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return sheetsApi({ version: 'v4', auth });
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
    await saveJson(join(FPL_ROOT, 'bootstrap-static.json'), bootstrap);
    console.log(`  ✓ bootstrap-static saved (${bootstrap.elements?.length ?? 0} players)`);

    console.log('  fixtures...');
    const fixtures = await fetchFpl('/fixtures/');
    await saveJson(join(FPL_ROOT, 'fixtures.json'), fixtures);
    console.log(`  ✓ fixtures saved (${fixtures.length} fixtures)`);

    const players = bootstrap.elements ?? [];
    console.log(`  element-summary — fetching ${players.length} players...`);

    let saved = 0;
    let failed = 0;
    for (const player of players) {
        try {
            await sleep(FPL_DELAY_MS);
            const detail = await fetchFpl(`/element-summary/${player.id}/`);
            await saveJson(join(FPL_ROOT, `element-summary/${player.id}.json`), detail);
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
        try {
            const data = await fetchSheet(sheetsClient, { name: tab, range: `'${tab}'!A:ZZ` });
            const filePath = join(SHEETS_ROOT, `${slugForTab(tab)}.json`);
            await saveJson(filePath, data);
            const rowCount = (data.values?.length ?? 1) - 1;
            const colCount = data.values?.[0]?.length ?? 0;
            console.log(`  ✓ ${tab} → ${slugForTab(tab)}.json (${rowCount} rows, ${colCount} cols)`);
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
    console.log(`Sheets: ${SHEETS_ROOT}`);
    console.log(`FPL:    ${FPL_ROOT}`);

    if (!sheetsOnly) await fetchFplData();
    if (!fplOnly) await fetchSheetsData();

    console.log('\n✓ Done\n');
}

main().catch((err) => {
    console.error('\n✗ Fatal error:', err);
    process.exit(1);
});
