/* Location: app/_shared/test/google-sheets-msw.ts */

import { generateKeyPairSync } from 'node:crypto';
import { HttpResponse, http, type RequestHandler } from 'msw';
import { startRowFromRange, tabNameFromRange } from './sheet-range';
import { RecordSheetStore, type SheetCell, type SheetStore } from './sheet-store';

const SHEETS_VALUES_URL = 'https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range';

interface SheetWriteBody {
    values?: SheetCell[][];
}

/**
 * MSW handlers for the Google Sheets API, so sheets code can be tested with everything
 * except the network running for real — the `googleapis` client, its auth handshake and
 * its response parsing all execute. See "MSW is the standard for anything crossing the
 * network" in `.kiro/steering/testing-conventions.md`.
 *
 * The credentials are set globally in `vitest.setup.ts`, which runs before a test file's
 * imports, so a test can import the module under test **statically**. That was not always
 * true: `_shared/lib/sheets/utils/common.ts` reads `GOOGLE_SHEETS_ID` at module scope and
 * memoises its client, so tests used to import it dynamically inside `beforeAll` to be
 * sure the fake credentials existed first. Doing the heavy `googleapis` import inside a
 * hook is what made the suite flaky -- see the note on the key below.
 *
 * The awkward part is auth. `_shared/lib/sheets/utils/common.ts` uses `google.auth.JWT`,
 * which signs a JWT **locally** with the service account's private key before exchanging
 * it for an access token. So a test needs a real (throwaway) RSA key — nothing ever
 * verifies the signature, but the client will not get as far as the network without one.
 */

/**
 * A syntactically valid service account, generated once per worker and never committed.
 *
 * **1024 bits is deliberate and is not a security decision.** Nothing verifies this
 * signature — `google.auth.JWT` only needs a key it can sign *with* before MSW intercepts
 * the token exchange. Measured: 1024 costs 23ms against 148ms for 2048. Do not copy this
 * size into anything that is not a throwaway test key.
 *
 * Memoised because `vitest.setup.ts` now calls this for every test file, not just the six
 * that touch Sheets.
 */
let cachedServiceAccount: string | null = null;

export function fakeServiceAccount(): string {
    cachedServiceAccount ??= buildFakeServiceAccount();
    return cachedServiceAccount;
}

function buildFakeServiceAccount(): string {
    const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 1024,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
    });

    return btoa(
        JSON.stringify({
            type: 'service_account',
            project_id: 'kammy-test',
            client_email: 'test@kammy-test.iam.gserviceaccount.com',
            private_key: privateKey,
        }),
    );
}

/**
 * Point the sheets client at a fake project.
 *
 * `vitest.setup.ts` calls this for every test file, before the file's own imports run, so
 * a test does not need to call it — and must not rely on calling it later, because
 * `common.ts` reads `GOOGLE_SHEETS_ID` at module scope and memoises its client.
 */
export function useFakeSheetsCredentials(): void {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fakeServiceAccount();
    process.env.GOOGLE_SHEETS_ID = 'test-spreadsheet-id';
}

/** Satisfies the OAuth token exchange the JWT client performs before its first request. */
export const googleAuthHandler: RequestHandler = http.post('https://oauth2.googleapis.com/token', () =>
    HttpResponse.json({ access_token: 'test-access-token', expires_in: 3600, token_type: 'Bearer' }),
);

/**
 * One read handler, used by both the read-only and the read/write helpers below, so the
 * two cannot answer a GET differently.
 */
function readHandler(store: SheetStore): RequestHandler {
    return http.get(SHEETS_VALUES_URL, ({ params }) => {
        // The range arrives percent-encoded, e.g. "'Cup'!A:G".
        const range = decodeURIComponent(String(params.range));

        return HttpResponse.json({ range, majorDimension: 'ROWS', values: store.values(tabNameFromRange(range)) });
    });
}

/**
 * Serve a tab's cell values, read-only. `tabs` is keyed by sheet name, each an array of
 * rows INCLUDING the header row, exactly as the Sheets API returns them.
 *
 * Use `sheetHandlers` instead when the code under test writes.
 */
export function sheetValuesHandler(tabs: Record<string, SheetCell[][]>): RequestHandler {
    return readHandler(new RecordSheetStore(tabs));
}

/**
 * Serve a tab's cell values **and accept writes against them**, so a test can assert that
 * a write actually landed rather than that a request was made.
 *
 * This is what the discarded-write handlers this replaced could not do: they answered
 * every PUT and append with success and changed nothing, so a write path could pass its
 * test while writing to nowhere. The returned `store` is the same object the handlers
 * mutate -- read `store.values(tab)` to assert, or call `store.reset()` between cases.
 *
 * ```ts
 * const { handlers, store } = sheetHandlers({ Players: [HEADERS, ...rows] });
 * const server = setupServer(googleAuthHandler, ...handlers);
 * // ... exercise the code under test ...
 * expect(store.values('Players')).toContainEqual([123456, 'Dubravka', 'GK']);
 * ```
 */
export function sheetHandlers(tabs: Record<string, SheetCell[][]>): {
    handlers: RequestHandler[];
    store: RecordSheetStore;
} {
    const store = new RecordSheetStore(tabs);

    const countCells = (rows: SheetCell[][]) => rows.reduce((total, row) => total + row.length, 0);

    return {
        store,
        handlers: [
            readHandler(store),

            http.put(SHEETS_VALUES_URL, async ({ params, request }) => {
                const range = decodeURIComponent(String(params.range));
                const rows = ((await request.json()) as SheetWriteBody).values ?? [];

                store.update(tabNameFromRange(range), startRowFromRange(range), rows);

                return HttpResponse.json({
                    spreadsheetId: String(params.id),
                    updatedRange: range,
                    updatedRows: rows.length,
                    updatedCells: countCells(rows),
                });
            }),

            http.post(`${SHEETS_VALUES_URL}\\:append`, async ({ params, request }) => {
                const range = decodeURIComponent(String(params.range));
                const rows = ((await request.json()) as SheetWriteBody).values ?? [];

                store.append(tabNameFromRange(range), rows);

                return HttpResponse.json({
                    spreadsheetId: String(params.id),
                    updates: {
                        updatedRange: range,
                        updatedRows: rows.length,
                        updatedCells: countCells(rows),
                    },
                });
            }),
        ],
    };
}
