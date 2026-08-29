/**
 * The plumbing behind `/admin/new-players`: work out who needs a position researched, and
 * put the answers into the `PlayerInbox` tab for the admin page to read.
 *
 * The research itself is not here. It is a judgement about where a footballer actually plays,
 * so it is done by a scheduled Claude agent that calls `list`, researches each player, and
 * calls `write`. Keeping the two apart means the sheet ranges, the column order and the
 * encoding live in one tested place, and the agent only has to produce an opinion.
 *
 * WHY THE CANDIDATE LIST IS NARROWER THAN "IN FPL, NOT IN THE SHEET"
 * Four of the eight columns in `Players` are VLOOKUPs into `FPL_Player_export`. A row added
 * for a code that tab does not carry yet gets `#N/A` in club, value and status, and
 * `isHidden` then derives from an `#N/A` status. The export is refreshed on its own schedule
 * and runs behind the FPL API, so this filter is doing real work rather than being defensive.
 * `new-players.service.ts` applies the same rule; if you change one, change both.
 *
 * Usage:
 *   node --env-file=.env.local scripts/new-player-inbox.mjs init
 *   node --env-file=.env.local scripts/new-player-inbox.mjs list
 *   node --env-file=.env.local scripts/new-player-inbox.mjs list --json > todo.json
 *   node --env-file=.env.local scripts/new-player-inbox.mjs write researched.json
 *
 * Never writes to `Players`. Releasing a player into the game is a decision an admin takes on
 * the page, after the batch has been announced.
 */

import { readFile } from 'node:fs/promises';
// `@googleapis/sheets`, not the `googleapis` umbrella, and `JWT` from this package's own auth
// export -- the nested google-auth-library is a different version to the workspace one and
// `sheets()` will not accept a JWT built from the other copy. Same reason as
// `draft/app/_shared/lib/sheets/utils/common.ts` and `fetch-season-fixtures.mjs`.
import { auth as googleAuth, sheets as sheetsApi } from '@googleapis/sheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_KEY_B64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

const FPL_BOOTSTRAP = 'https://fantasy.premierleague.com/api/bootstrap-static/';

const INBOX_TAB = 'PlayerInbox';
const PLAYERS_TAB = 'Players';
const EXPORT_TAB = 'FPL_Player_export';

/** Column order is the sheet's contract. Must match `_shared/lib/sheets/player-inbox.ts`. */
const INBOX_HEADERS = [
    'code',
    'name',
    'club',
    'fplType',
    'suggested',
    'confidence',
    'basis',
    'summary',
    'reasoning',
    'sources',
    'added',
    'position',
    'status',
];

const LAST_COLUMN = 'M'; // 13 headers -> A..M

const FPL_ELEMENT_TYPES = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

const POSITIONS = ['GK', 'CB', 'FB', 'MID', 'WA', 'CA'];
const CONFIDENCES = ['high', 'medium', 'low'];
const BASES = ['record', 'projection'];

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

function createSheetsClient() {
    if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEETS_ID is not set');
    if (!SERVICE_ACCOUNT_KEY_B64) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set');

    const credentials = JSON.parse(Buffer.from(SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8'));
    const auth = new googleAuth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return sheetsApi({ version: 'v4', auth });
}

async function readRange(sheets, range) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return res.data.values ?? [];
}

/** Codes in a tab's first column, header skipped. */
async function readCodes(sheets, tab, column) {
    const rows = await readRange(sheets, `'${tab}'!${column}:${column}`);
    return new Set(
        rows
            .slice(1)
            .map((row) => Number.parseInt(String(row[0] ?? ''), 10))
            .filter((code) => Number.isFinite(code)),
    );
}

async function tabExists(sheets, title) {
    const meta = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: 'sheets.properties.title',
    });
    return meta.data.sheets.some((sheet) => sheet.properties.title === title);
}

// ---------------------------------------------------------------------------
// Encoding -- must round-trip with `player-inbox.ts`
// ---------------------------------------------------------------------------

const encodeLines = (lines) => (lines ?? []).filter(Boolean).join('\n');
const encodeSources = (sources) => encodeLines((sources ?? []).map((s) => `${s.label} | ${s.url}`));

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/**
 * Create the tab with its header row.
 *
 * Separate from `write` on purpose: creating a tab changes the shape of somebody's
 * spreadsheet, and that should be something you chose to do rather than a side effect of a
 * scheduled job running for the first time.
 */
async function commandInit(sheets) {
    if (await tabExists(sheets, INBOX_TAB)) {
        console.log(`'${INBOX_TAB}' already exists. Nothing to do.`);
        return;
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: INBOX_TAB } } }] },
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${INBOX_TAB}'!A1:${LAST_COLUMN}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [INBOX_HEADERS] },
    });

    console.log(`Created '${INBOX_TAB}' with its header row.`);
}

async function gatherCandidates(sheets) {
    const res = await fetch(FPL_BOOTSTRAP, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Kammy Fantasy Football)' },
    });
    if (!res.ok) throw new Error(`FPL bootstrap -> HTTP ${res.status}`);
    const bootstrap = await res.json();

    const [inGame, exported, inbox] = await Promise.all([
        readCodes(sheets, PLAYERS_TAB, 'C'),
        readCodes(sheets, EXPORT_TAB, 'A'),
        (await tabExists(sheets, INBOX_TAB)) ? readCodes(sheets, INBOX_TAB, 'A') : new Set(),
    ]);

    const clubByCode = {};
    for (const team of bootstrap.teams) clubByCode[team.code] = team.short_name;

    const missing = bootstrap.elements.filter((element) => !inGame.has(element.code));
    const awaitingExport = missing.filter((element) => !exported.has(element.code));

    const candidates = missing
        .filter((element) => exported.has(element.code))
        .filter((element) => !inbox.has(element.code))
        .map((element) => ({
            code: element.code,
            name: element.web_name,
            fullName: `${element.first_name} ${element.second_name}`.trim(),
            club: clubByCode[element.team_code] ?? '',
            fplType: FPL_ELEMENT_TYPES[element.element_type] ?? 'MID',
            price: element.now_cost / 10,
            status: element.status,
            minutes: element.minutes ?? 0,
        }));

    return { candidates, awaitingExport, counts: { inGame: inGame.size, exported: exported.size, inbox: inbox.size } };
}

async function commandList(sheets, { json }) {
    const { candidates, awaitingExport, counts } = await gatherCandidates(sheets);

    if (json) {
        console.log(JSON.stringify(candidates, null, 2));
        return;
    }

    console.log(`Players tab:        ${counts.inGame}`);
    console.log(`FPL_Player_export:  ${counts.exported}`);
    console.log(`PlayerInbox:        ${counts.inbox}`);
    console.log(`\nNeeding research:   ${candidates.length}`);

    for (const player of candidates) {
        const minutes = player.minutes ? `${player.minutes} mins` : 'no minutes yet';
        console.log(
            `  ${String(player.code).padEnd(7)} ${player.name.padEnd(22)} ${player.club.padEnd(4)} ` +
                `${player.fplType.padEnd(4)} ${`£${player.price}m`.padEnd(7)} ${minutes}`,
        );
    }

    if (awaitingExport.length > 0) {
        console.log(
            `\n${awaitingExport.length} more are in FPL but not in ${EXPORT_TAB} yet, so they are not ` +
                'listed. Refresh that tab and re-run.',
        );
    }
}

/**
 * Append researched rows.
 *
 * Validates first and writes nothing if anything fails. A half-written inbox is harder to
 * reason about than an empty one, and the job runs again tomorrow either way.
 */
async function commandWrite(sheets, filePath) {
    if (!filePath) throw new Error('Usage: write <researched.json>');

    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    if (rows.length === 0) {
        console.log('Nothing to write.');
        return;
    }

    const { candidates } = await gatherCandidates(sheets);
    const byCode = new Map(candidates.map((candidate) => [candidate.code, candidate]));

    const problems = [];
    for (const [index, row] of rows.entries()) {
        const where = `row ${index + 1} (code ${row.code ?? 'missing'})`;
        if (!byCode.has(row.code)) problems.push(`${where}: not awaiting research, so it would be a duplicate`);
        if (!POSITIONS.includes(row.suggested)) problems.push(`${where}: suggested must be one of ${POSITIONS}`);
        if (!CONFIDENCES.includes(row.confidence)) problems.push(`${where}: confidence must be one of ${CONFIDENCES}`);
        if (!BASES.includes(row.basis)) problems.push(`${where}: basis must be one of ${BASES}`);
        if (!row.summary) problems.push(`${where}: needs a summary`);
        if (!Array.isArray(row.reasoning) || row.reasoning.length === 0) {
            problems.push(`${where}: needs reasoning, which is what the admin actually argues with`);
        }
        if (!Array.isArray(row.sources) || row.sources.length === 0) {
            problems.push(`${where}: needs at least one source`);
        }
    }

    const codes = rows.map((row) => row.code);
    if (new Set(codes).size !== codes.length) problems.push('the same code appears twice in the file');

    if (problems.length > 0) {
        console.error(`Nothing written. ${problems.length} problem(s):`);
        for (const problem of problems) console.error(`  ${problem}`);
        process.exitCode = 1;
        return;
    }

    // Written at explicit row numbers rather than appended, so the range is known and a
    // concurrent edit shows up as a conflict rather than silently interleaving.
    const existing = await readRange(sheets, `'${INBOX_TAB}'!A:${LAST_COLUMN}`);
    const firstRow = Math.max(existing.length, 1) + 1;
    const added = new Date().toISOString();

    const values = rows.map((row) => {
        const player = byCode.get(row.code);
        return [
            row.code,
            player.name,
            player.club,
            player.fplType,
            row.suggested,
            row.confidence,
            row.basis,
            row.summary,
            encodeLines(row.reasoning),
            encodeSources(row.sources),
            added,
            '', // position: the admin's call, not the agent's
            '', // status: empty until somebody approves
        ];
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${INBOX_TAB}'!A${firstRow}:${LAST_COLUMN}${firstRow + values.length - 1}`,
        valueInputOption: 'RAW',
        requestBody: { values },
    });

    console.log(`Wrote ${values.length} row(s) to ${INBOX_TAB}, rows ${firstRow}-${firstRow + values.length - 1}.`);
    for (const row of rows) {
        console.log(`  ${byCode.get(row.code).name.padEnd(22)} ${row.suggested.padEnd(4)} ${row.confidence}`);
    }
}

// ---------------------------------------------------------------------------

async function main() {
    const [command, ...args] = process.argv.slice(2);
    const sheets = createSheetsClient();

    switch (command) {
        case 'init':
            return commandInit(sheets);
        case 'list':
            return commandList(sheets, { json: args.includes('--json') });
        case 'write':
            return commandWrite(sheets, args.find((arg) => !arg.startsWith('--')));
        default:
            console.error('Usage: new-player-inbox.mjs <init|list|write> [args]');
            process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
