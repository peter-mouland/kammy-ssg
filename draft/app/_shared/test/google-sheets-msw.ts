/* Location: app/_shared/test/google-sheets-msw.ts */

import { generateKeyPairSync } from 'node:crypto';
import { HttpResponse, http, type RequestHandler } from 'msw';

/**
 * MSW handlers for the Google Sheets API, so sheets code can be tested with everything
 * except the network running for real — the `googleapis` client, its auth handshake and
 * its response parsing all execute. See "MSW is the standard for anything crossing the
 * network" in `.kiro/steering/testing-conventions.md`.
 *
 * IMPORTANT: import the module under test **dynamically, inside `beforeAll`**, after
 * calling `useFakeSheetsCredentials()`. `_shared/lib/sheets/utils/common.ts` builds its
 * client on first use and memoises it in a module-scope promise, so a static import at
 * the top of a test file can bind before the fake credentials exist.
 *
 * The awkward part is auth. `_shared/lib/sheets/utils/common.ts` uses `google.auth.JWT`,
 * which signs a JWT **locally** with the service account's private key before exchanging
 * it for an access token. So a test needs a real (throwaway) RSA key — nothing ever
 * verifies the signature, but the client will not get as far as the network without one.
 */

/** A syntactically valid service account. The key is generated per run, never committed. */
export function fakeServiceAccount(): string {
    const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
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
 * Point the sheets client at a fake project. Call inside `beforeAll`.
 *
 * Note `common.ts` memoises the client in a module-scope promise, so within one test
 * file the first call wins — set this up before anything reads a sheet.
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
        const tabName = range.replace(/^'?/, '').replace(/'?!.*$/, '');

        return HttpResponse.json({ range, majorDimension: 'ROWS', values: tabs[tabName] ?? [] });
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
