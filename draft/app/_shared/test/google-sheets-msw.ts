/* Location: app/_shared/test/google-sheets-msw.ts */

import { generateKeyPairSync } from 'node:crypto';
import { HttpResponse, http, type RequestHandler } from 'msw';
import { tabNameFromRange } from './sheet-range';

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
 * Serve a tab's cell values. `tabs` is keyed by sheet name, each an array of rows
 * INCLUDING the header row, exactly as the Sheets API returns them.
 */
export function sheetValuesHandler(tabs: Record<string, (string | number)[][]>): RequestHandler {
    return http.get('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range', ({ params }) => {
        // The range arrives percent-encoded, e.g. "'Cup'!A:G".
        const range = decodeURIComponent(String(params.range));

        return HttpResponse.json({ range, majorDimension: 'ROWS', values: tabs[tabNameFromRange(range)] ?? [] });
    });
}

/** Accepts writes so a write path can be exercised without asserting on Google's shape. */
export const sheetWriteHandlers: RequestHandler[] = [
    http.put('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range', () =>
        HttpResponse.json({ updatedCells: 1 }),
    ),
    http.post('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range\\:append', () =>
        HttpResponse.json({ updates: { updatedCells: 1 } }),
    ),
];
