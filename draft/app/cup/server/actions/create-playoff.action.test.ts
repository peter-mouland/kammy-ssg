/* Location: app/cup/server/actions/create-playoff.action.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../../../_shared/test/google-sheets-msw';
import { createPlayoffAction } from './create-playoff.action';

/**
 * Creating a play-off tie (rule 4.8) for a scored but winnerless tie. The real
 * sheets client runs behind MSW; the FPL calendar is seeded through the cache.
 */

const gameweek = (id: number) => ({
    fplEvent: { id, name: `Gameweek ${id}`, is_current: false, deadline_time: '2020-01-02T00:00:00Z' },
    gameWeekIndex: id - 1,
    start: new Date('2020-01-01T00:00:00Z'),
    end: new Date('2020-01-02T00:00:00Z'),
    isCurrent: false,
    isNext: false,
    hasPassed: false,
});

const CUP_CONFIG_TAB = [
    ['Key', 'Value'],
    ['season', '2526'],
    ['league', '1,2'],
    ['r16', '3,4'],
    ['qf', '5,6'],
    ['sf', '7,8'],
    ['final', '10'],
];

const BRACKET_HEADERS = ['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner', 'Gameweek'];

// Tie 0 is scored 12-12 with no winner: exactly what needs a play-off.
// Tie 1 already has a winner; tie 2 is not yet scored.
const CUP_BRACKET_TAB = [
    BRACKET_HEADERS,
    ['r16', '0', 'ann', 'bob', '12', '12', '', ''],
    ['r16', '1', 'cat', 'dee', '18', '2', 'cat', ''],
    ['r16', '2', 'eve', 'fin', '', '', '', ''],
];

const server = setupServer(
    googleAuthHandler,
    sheetValuesHandler({ CupConfig: CUP_CONFIG_TAB, CupBracket: CUP_BRACKET_TAB }),
);

/** Captures the cell values a bracket write sends to the Sheets API. */
const captureWrite = () => {
    const sent: (string | number)[][][] = [];
    server.use(
        http.put('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range', async ({ request }) => {
            const body = (await request.json()) as { values: (string | number)[][] };
            sent.push(body.values);
            return HttpResponse.json({ updatedCells: body.values.length });
        }),
    );
    return sent;
};

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(async () => {
    dataCache.clear();
    await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => [1, 2, 3, 4, 5, 11].map((id) => gameweek(id)));
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createPlayoffAction', () => {
    it('creates a play-off tie for a scored draw', async () => {
        const sent = captureWrite();

        const result = await createPlayoffAction({ stage: 'r16', tie: 0, gameweek: 11 });

        expect(result.success).toBe(true);
        expect(result.message).toContain('ann v bob');
        const [rows] = sent;
        expect(rows).toContainEqual(['playoff', 0, 'ann', 'bob', '', '', '', 11]);
    });

    it('refuses a tie that already has a winner', async () => {
        const result = await createPlayoffAction({ stage: 'r16', tie: 1, gameweek: 11 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/already has a winner/i);
    });

    it('refuses a tie that has not been resolved yet', async () => {
        const result = await createPlayoffAction({ stage: 'r16', tie: 2, gameweek: 11 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/resolve the tie first/i);
    });

    it('refuses a gameweek that already hosts a cup round', async () => {
        const result = await createPlayoffAction({ stage: 'r16', tie: 0, gameweek: 3 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/already hosts a cup round/i);
    });

    it('refuses an unknown gameweek and an unknown tie', async () => {
        expect((await createPlayoffAction({ stage: 'r16', tie: 0, gameweek: 99 })).error).toMatch(
            /not a real gameweek/i,
        );
        expect((await createPlayoffAction({ stage: 'r16', tie: 99, gameweek: 11 })).error).toMatch(/no r16 tie 99/i);
    });
});
