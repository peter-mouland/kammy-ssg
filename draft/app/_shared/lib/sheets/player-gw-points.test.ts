/* Location: app/_shared/lib/sheets/player-gw-points.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { googleAuthHandler, sheetValuesHandler, useFakeSheetsCredentials } from '../../test/google-sheets-msw';
import type { PlayerGameweekPointsRow } from '../../types/sheets-types';
import { dataCache } from '../cache/data-cache.service';

/**
 * Storage only. This module used to compute the points it wrote, which is what made
 * `_shared` depend on the `scoring` domain; the computation moved to
 * `scoring/server/services/player-gw-points.service.ts` (P2.3) and this now stores rows
 * it is handed and reads them back.
 */

let sheet: typeof import('./player-gw-points');

const POINTS_TAB = [
    ['playerCode', 'webName', 'position', 'teamName', 'gw-1', 'gw-2'],
    ['118748', 'Salah', 'mid', 'Liverpool', '7', '3'],
    ['223340', 'Saliba', 'cb', 'Arsenal', '11', '5'],
];

const server = setupServer(googleAuthHandler, sheetValuesHandler({ 'player-gw-points': POINTS_TAB }));

beforeAll(async () => {
    useFakeSheetsCredentials();
    server.listen({ onUnhandledRequest: 'error' });
    sheet = await import('./player-gw-points');
});
beforeEach(() => dataCache.clear());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('readPlayerGameweekPointsFromSheet', () => {
    it('reads each player’s identifying columns', async () => {
        const [salah] = await sheet.readPlayerGameweekPointsFromSheet();

        expect(salah.playerCode).toBe(118748);
        expect(salah.webName).toBe('Salah');
        expect(salah.teamName).toBe('Liverpool');
    });

    // Gameweek columns arrive as strings from the API. If they are not coerced, the
    // summary below sums strings and every total is nonsense.
    it('reads gameweek columns as numbers, not strings', async () => {
        const [salah] = await sheet.readPlayerGameweekPointsFromSheet();

        expect(salah['gw-1']).toBe(7);
        expect(salah['gw-2']).toBe(3);
    });

    it('returns nothing when the sheet is empty', async () => {
        server.use(sheetValuesHandler({ 'player-gw-points': [] }));

        expect(await sheet.readPlayerGameweekPointsFromSheet()).toEqual([]);
    });
});

describe('getGameweekPointsSummary', () => {
    it('reports the top scorer across all gameweeks', async () => {
        const summary = await sheet.getGameweekPointsSummary();

        expect(summary.totalPlayers).toBe(2);
        expect(summary.totalRounds).toBe(2);
        expect(summary.topScorer).toEqual({ playerName: 'Saliba', totalPoints: 16 }); // 11 + 5
    });

    it('reports nothing rather than dividing by zero on an empty sheet', async () => {
        server.use(sheetValuesHandler({ 'player-gw-points': [] }));

        const summary = await sheet.getGameweekPointsSummary();

        expect(summary).toEqual({ totalPlayers: 0, totalRounds: 0, averagePointsPerRound: 0, topScorer: null });
    });
});

describe('writePlayerGameweekPoints', () => {
    const captureWrite = () => {
        const sent: unknown[] = [];
        server.use(
            http.put('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range', async ({ request }) => {
                sent.push(await request.json());
                return HttpResponse.json({ updatedCells: 1 });
            }),
            http.post('https://sheets.googleapis.com/v4/spreadsheets/:id/:action', async ({ request }) => {
                sent.push(await request.json());
                return HttpResponse.json({ replies: [] });
            }),
        );
        return sent;
    };

    const ROWS: PlayerGameweekPointsRow[] = [
        { playerCode: 118748, webName: 'Salah', position: 'mid', teamName: 'Liverpool', 'gw-1': 7 },
    ];

    it('stores the rows it is given', async () => {
        const sent = captureWrite();

        await sheet.writePlayerGameweekPoints(ROWS, ['playerCode', 'webName', 'position', 'teamName', 'gw-1']);

        expect(sent.length).toBeGreaterThan(0);
    });

    // Writing an empty table would blank the sheet. Better to refuse than to destroy a
    // season of points because an upstream fetch came back empty.
    it('refuses to write an empty table', async () => {
        await expect(sheet.writePlayerGameweekPoints([], ['playerCode'])).rejects.toThrow();
    });
});
