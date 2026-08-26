/* Location: app/_shared/test/google-sheets-msw.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { googleAuthHandler, sheetHandlers } from './google-sheets-msw';

/**
 * The write handlers have to mutate something.
 *
 * What they replaced answered every PUT and append with success and changed nothing, so a
 * write path could pass its test while writing to nowhere -- and every POST path in the
 * app was unverified for exactly that reason. These tests are the guard on the guard: if
 * the fake ever goes back to discarding writes, the round-trips below stop round-tripping.
 *
 * The real `@googleapis/sheets` client runs throughout: it signs its JWT, builds its A1
 * ranges and parses the responses. Only the bytes on the wire are ours.
 */

const HEADERS = ['code', 'web', 'position'];
const PLAYERS_TAB = [HEADERS, [118748, 'Dubravka', 'GK'], [542273, 'Kone', 'MID']];

// Imported in beforeAll, not statically: `sheets/utils/common.ts` reads the service
// account when its client is first built and memoises it, so the fake credentials that
// `vitest.setup.ts` installs have to be in place first.
let common: typeof import('../lib/sheets/utils/common');

const { handlers, store } = sheetHandlers({ Players: structuredClone(PLAYERS_TAB) });
const server = setupServer(googleAuthHandler, ...handlers);

const range = (a1: string) => ({ spreadsheetId: process.env.GOOGLE_SHEETS_ID as string, range: a1 });

beforeAll(async () => {
    server.listen({ onUnhandledRequest: 'error' });
    common = await import('../lib/sheets/utils/common');
});

afterEach(() => {
    server.resetHandlers();
    store.reset();
});

afterAll(() => server.close());

describe('sheetHandlers', () => {
    it('serves the rows it was seeded with', async () => {
        expect(await common.readSheetRange(range("'Players'!A:Z"))).toEqual(PLAYERS_TAB);
    });

    it('makes an appended row visible to the next read', async () => {
        await common.appendToSheet(range("'Players'!A:Z"), [[601122, 'Ferreira', 'CA']]);

        expect(await common.readSheetRange(range("'Players'!A:Z"))).toEqual([
            ...PLAYERS_TAB,
            [601122, 'Ferreira', 'CA'],
        ]);
    });

    it('writes an update to the row its range names, not the top of the tab', async () => {
        // Row 3 is Kone -- header is row 1. Getting this wrong silently corrupts a
        // neighbouring record, which is why `startRowFromRange` exists.
        await common.writeSheetRange(range("'Players'!A3:C3"), [[542273, 'Kone', 'WA']]);

        expect(store.values('Players')).toEqual([HEADERS, [118748, 'Dubravka', 'GK'], [542273, 'Kone', 'WA']]);
    });

    it('does not truncate the rows after an update, matching the real API', async () => {
        await common.writeSheetRange(range("'Players'!A:Z"), [HEADERS]);

        expect(store.values('Players')).toHaveLength(PLAYERS_TAB.length);
    });

    it('seeds an undeclared tab empty rather than failing the read', async () => {
        expect(await common.readSheetRange(range("'NotDeclared'!A:Z"))).toEqual([]);
    });

    it('resets to the seeded rows between cases', async () => {
        await common.appendToSheet(range("'Players'!A:Z"), [[1, 'Temp', 'CB']]);
        store.reset();

        expect(store.values('Players')).toEqual(PLAYERS_TAB);
    });
});
