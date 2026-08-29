/* Location: app/_shared/test/fixtures/fixture-msw-handlers.ts */

import { HttpResponse, http, type RequestHandler } from 'msw';
import { startRowFromRange, tabNameFromRange } from '../sheet-range';
import { type SheetCell, SheetStore } from '../sheet-store';
import { elementSummary, fplBootstrap, fplFixtures, gameweekLive, sheetTab } from './season-fixtures';

/**
 * MSW handlers that serve the whole external world from `test-fixtures/`.
 *
 * This is the substitution the harness rests on, and it is made at the network: the real
 * `@googleapis/sheets` client runs, signs its JWT, builds its ranges and parses its
 * responses; the real FPL client runs with its own URL building and error handling. Only
 * the bytes on the wire are ours. See "MSW is the standard for anything crossing the
 * network" in `.kiro/steering/testing-conventions.md`.
 *
 * Firestore is the one boundary this cannot cover -- it is gRPC, not HTTP -- and is
 * handled by `_shared/lib/firestore-cache/firestore-memory.ts` instead.
 */

const SHEETS_VALUES_URL = 'https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range';
const SHEETS_METADATA_URL = 'https://sheets.googleapis.com/v4/spreadsheets/:id';
const FPL_BASE = 'https://fantasy.premierleague.com/api';

/**
 * The sheets, in memory and **writable**, seeded from `test-fixtures/` on disk.
 *
 * Writes have to mutate something. A handler that accepts a write and discards it makes
 * every action look like it worked while changing nothing, so a submitted transfer would
 * vanish on reload -- the difference between testing a form and testing a form's
 * rendering.
 *
 * Tabs load from disk on first read and stay in memory after, so a write is visible to the
 * next read and `reset()` returns to the captured state. Nothing touches `test-fixtures/`
 * on disk -- it is opened read-only.
 */
export class FixtureSheetStore extends SheetStore {
    /**
     * `sheetTab()` throws for an unknown tab rather than returning [], which is what stops
     * a mistyped name from looking like an empty sheet. That is the opposite of the
     * record-backed store's choice, and deliberately so: every tab the harness serves
     * exists on disk, so an unknown one is a bug rather than a tab a test did not declare.
     */
    protected seed(tab: string): SheetCell[][] {
        return sheetTab(tab);
    }
}

interface SheetWriteBody {
    values?: SheetCell[][];
}

const rangeOf = (params: Record<string, unknown>) => decodeURIComponent(String(params.range));

/**
 * Sheets: reads and writes against the store.
 *
 * The read handler answers the exact `{ range, majorDimension, values }` shape the client
 * parses, so `readSheetWithHeaders` and its header matching all run for real.
 */
export function fixtureSheetsHandlers(store: FixtureSheetStore): RequestHandler[] {
    return [
        // Spreadsheet metadata, not values -- `testConnection()` in `sheets/utils/common.ts`
        // reads only the title, and `/debug` is its one caller. Found by the route crawl:
        // without this the harness logged an unhandled request and the call escaped to the
        // real Sheets API, which is the one thing the fixture server must never do.
        http.get(SHEETS_METADATA_URL, ({ params }) =>
            HttpResponse.json({
                spreadsheetId: params.id,
                properties: { title: 'Kammy fixtures' },
            }),
        ),

        http.get(SHEETS_VALUES_URL, ({ params }) => {
            const range = rangeOf(params);
            return HttpResponse.json({
                range,
                majorDimension: 'ROWS',
                values: store.values(tabNameFromRange(range)),
            });
        }),

        http.put(SHEETS_VALUES_URL, async ({ params, request }) => {
            const range = rangeOf(params);
            const body = (await request.json()) as SheetWriteBody;
            const rows = body.values ?? [];

            store.update(tabNameFromRange(range), startRowFromRange(range), rows);

            return HttpResponse.json({
                spreadsheetId: String(params.id),
                updatedRange: range,
                updatedRows: rows.length,
                updatedCells: rows.reduce((total, row) => total + row.length, 0),
            });
        }),

        http.post(`${SHEETS_VALUES_URL}\\:append`, async ({ params, request }) => {
            const range = rangeOf(params);
            const body = (await request.json()) as SheetWriteBody;
            const rows = body.values ?? [];

            store.append(tabNameFromRange(range), rows);

            return HttpResponse.json({
                spreadsheetId: String(params.id),
                updates: {
                    updatedRange: range,
                    updatedRows: rows.length,
                    updatedCells: rows.reduce((total, row) => total + row.length, 0),
                },
            });
        }),
    ];
}

/**
 * Serialise once and reuse the string.
 *
 * The merged bootstrap is ~2MB. Re-stringifying it on every request turns the route crawl
 * into a JSON benchmark, and the payload never changes within a run.
 */
function jsonOnce(build: () => unknown): () => HttpResponse<string> {
    let body: string | undefined;

    return () => {
        body ??= JSON.stringify(build());
        return new HttpResponse(body, { headers: { 'Content-Type': 'application/json' } });
    };
}

const bootstrapResponse = jsonOnce(fplBootstrap);
const fixturesResponse = jsonOnce(fplFixtures);

/** FPL: the four endpoints `fpl/api.ts` actually calls. */
export function fixtureFplHandlers(): RequestHandler[] {
    return [
        http.get(`${FPL_BASE}/bootstrap-static/`, () => bootstrapResponse()),
        http.get(`${FPL_BASE}/fixtures/`, () => fixturesResponse()),
        http.get(`${FPL_BASE}/element-summary/:id/`, ({ params }) =>
            HttpResponse.json(elementSummary(Number(params.id))),
        ),
        http.get(`${FPL_BASE}/event/:gameweek/live/`, ({ params }) =>
            HttpResponse.json(gameweekLive(Number(params.gameweek))),
        ),
    ];
}

/**
 * Everything, plus the OAuth token exchange the JWT client may perform.
 *
 * `common.ts` sets `useJWTAccessWithScope`, so it usually self-signs and never reaches the
 * token endpoint -- but the handler costs nothing and its absence would be a confusing
 * failure if that setting ever changed.
 */
export function fixtureHandlers(store: FixtureSheetStore): RequestHandler[] {
    return [
        // Both endpoints, because the client picks between them: `google-auth-library` uses
        // the legacy `www.googleapis.com/oauth2/v4/token` on some paths. The route crawl
        // caught the second one escaping to the real network.
        ...['https://oauth2.googleapis.com/token', 'https://www.googleapis.com/oauth2/v4/token'].map((url) =>
            http.post(url, () =>
                HttpResponse.json({ access_token: 'fixture-access-token', expires_in: 3600, token_type: 'Bearer' }),
            ),
        ),
        ...fixtureSheetsHandlers(store),
        ...fixtureFplHandlers(),
    ];
}
