/* Location: app/_shared/lib/sheets/utils/common.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { googleAuthHandler } from '../../../test/google-sheets-msw';
import { dataCache } from '../../cache/data-cache.service';
import { readDivisions } from '../divisions';
import { toPlainHeaders } from './common';

/**
 * **Every Sheets request must actually carry its credentials.**
 *
 * This file exists because they silently stopped. `fetchTransporterRequest` did
 * `{ ...opts.headers }`, which yields `{}` for a `Headers` instance — `Headers` keeps its
 * entries in internal slots, not own enumerable properties. So `Authorization` was dropped
 * on every call and Google replied 403 "Method doesn't allow unregistered callers", an
 * error that reads like a spreadsheet sharing problem and is not one.
 *
 * The existing Sheets tests all passed throughout, because MSW answers a request whether or
 * not it is authenticated and nothing asserted otherwise. That is the gap this closes: the
 * network harness can only catch an auth bug if it looks at the auth.
 */

let seenAuthorization: string | null = null;

const server = setupServer(
    googleAuthHandler,
    http.get('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range', ({ request }) => {
        seenAuthorization = request.headers.get('authorization');
        return HttpResponse.json({
            range: 'Divisions!A:E',
            majorDimension: 'ROWS',
            values: [
                ['id', 'spreadsheetKey', 'label', 'order', 'url'],
                ['leagueOne', 'leagueOne', 'League One', 3, 'league-one'],
            ],
        });
    }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
    server.resetHandlers();
    dataCache.clear();
    seenAuthorization = null;
});

afterAll(() => server.close());

describe('a real Sheets read', () => {
    it('sends an Authorization header', async () => {
        await readDivisions();

        expect(seenAuthorization).toBeTruthy();
        expect(seenAuthorization).toMatch(/^Bearer /);
    });

    it('still returns the parsed rows', async () => {
        expect(await readDivisions()).toHaveLength(1);
    });
});

describe('normalising the headers the auth library provides', () => {
    // The auth library has passed both shapes across versions: plain objects from the
    // `googleapis` umbrella, `Headers` from the scoped package's newer gaxios.
    it('reads a fetch Headers instance, which a spread cannot', () => {
        const headers = new Headers({ Authorization: 'Bearer abc', 'Content-Type': 'application/json' });

        // The bug, preserved so the reason for this function is legible:
        expect(Object.keys({ ...headers })).toEqual([]);

        expect(toPlainHeaders(headers)).toEqual({
            authorization: 'Bearer abc',
            'content-type': 'application/json',
        });
    });

    it('reads a plain object', () => {
        expect(toPlainHeaders({ Authorization: 'Bearer abc' })).toEqual({ Authorization: 'Bearer abc' });
    });

    it('reads anything else with an entries() method', () => {
        expect(toPlainHeaders(new Map([['authorization', 'Bearer abc']]))).toEqual({ authorization: 'Bearer abc' });
    });

    it('treats undefined and null as no headers', () => {
        expect(toPlainHeaders(undefined)).toEqual({});
        expect(toPlainHeaders(null)).toEqual({});
    });
});
