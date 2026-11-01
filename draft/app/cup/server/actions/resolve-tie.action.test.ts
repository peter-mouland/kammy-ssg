/* Location: app/cup/server/actions/resolve-tie.action.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../../../_shared/test/google-sheets-msw';
import { resolveTieAction } from './resolve-tie.action';

/**
 * Resolving a knockout tie from the managers' submitted teams (rule 4.8).
 *
 * Scores come from league points, so the tests run the real sheets client and
 * the real scoring behind MSW; only the network is substituted. The FPL side
 * reads Firestore over gRPC, which MSW cannot intercept, so deadlines are
 * seeded through the app's own in-memory cache.
 */

const gameweek = (id: number, { start = '2020-01-01T00:00:00Z', end = '2020-01-02T00:00:00Z' } = {}) => ({
    fplEvent: { id, name: `Gameweek ${id}`, is_current: false, deadline_time: end },
    gameWeekIndex: id - 1,
    start: new Date(start),
    end: new Date(end),
    isCurrent: false,
    isNext: false,
    hasPassed: false,
});

const FINISHED = { start: '2020-01-01T00:00:00Z', end: '2020-01-02T00:00:00Z' };
const OPEN = { start: '2020-01-01T00:00:00Z', end: '2099-01-01T00:00:00Z' };

const CUP_CONFIG_TAB = [
    ['Key', 'Value'],
    ['season', '2526'],
    ['league', '1,2'],
    ['r16', '3,4'],
    ['qf', '5,6'],
    ['sf', '7,8'],
    ['final', '10'],
];

const CUP_HEADERS = [
    'Status',
    'Timestamp',
    'Manager',
    'Division',
    'Gameweek',
    'Stage',
    'Leg',
    'Players',
    'SubmittedByAdmin',
    'AdminReason',
];

const sub = (manager: string, gameweekId: number, leg: number, players: string): (string | number)[][] => [
    [
        'Y',
        '2026-08-12T10:00:00Z',
        manager,
        'premierLeague',
        String(gameweekId),
        'r16',
        String(leg),
        players,
        'FALSE',
        '',
    ],
];

// Tie 0 is level 12-12 on aggregate; first-entered players split it 11-6 for ann.
// Tie 1 is decisive: 18-2 for cat.
const CUP_TAB = [
    CUP_HEADERS,
    ...sub('ann', 3, 1, '101,102'),
    ...sub('bob', 3, 1, '103,104'),
    ...sub('ann', 4, 2, '105,106'),
    ...sub('bob', 4, 2, '107,108'),
    ...sub('cat', 3, 1, '201,202'),
    ...sub('dee', 3, 1, '203,204'),
    ...sub('cat', 4, 2, '201,202'),
    ...sub('dee', 4, 2, '203,204'),
];

const CUP_BRACKET_TAB = [
    ['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner'],
    ['r16', '0', 'ann', 'bob', '', '', ''],
    ['r16', '1', 'cat', 'dee', '', '', ''],
];

const POINTS_TAB = [
    ['playerCode', 'webName', 'position', 'teamName', 'gw-3', 'gw-4'],
    ['101', 'A', 'mid', 'LIV', '5', '6'],
    ['102', 'B', 'mid', 'LIV', '1', '0'],
    ['103', 'C', 'mid', 'ARS', '4', '2'],
    ['104', 'D', 'mid', 'ARS', '4', '2'],
    ['201', 'E', 'mid', 'LIV', '9', '0'],
    ['202', 'F', 'mid', 'LIV', '0', '0'],
    ['203', 'G', 'mid', 'ARS', '1', '0'],
    ['204', 'H', 'mid', 'ARS', '0', '0'],
    ['105', 'I', 'mid', 'LIV', '0', '6'],
    ['106', 'J', 'mid', 'LIV', '0', '0'],
    ['107', 'K', 'mid', 'ARS', '0', '2'],
    ['108', 'L', 'mid', 'ARS', '0', '2'],
];

const server = setupServer(
    googleAuthHandler,
    sheetValuesHandler({
        CupConfig: CUP_CONFIG_TAB,
        Cup: CUP_TAB,
        CupBracket: CUP_BRACKET_TAB,
        'player-gw-points': POINTS_TAB,
    }),
);

const seed = (gw4: { start: string; end: string } = FINISHED) =>
    dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => [
        gameweek(1),
        gameweek(2),
        gameweek(3, FINISHED),
        gameweek(4, gw4),
        gameweek(5),
    ]);

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
    await seed();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('resolveTieAction', () => {
    it('resolves a level aggregate on the first-entered players (rule 4.8)', async () => {
        const sent = captureWrite();

        const result = await resolveTieAction({ stage: 'r16', tie: 0 });

        expect(result.success).toBe(true);
        expect(result.message).toContain('ann');
        const [rows] = sent;
        expect(rows[1]).toEqual(['r16', 0, 'ann', 'bob', 12, 12, 'ann']);
    });

    it('resolves a decisive aggregate directly', async () => {
        const sent = captureWrite();

        const result = await resolveTieAction({ stage: 'r16', tie: 1 });

        expect(result.success).toBe(true);
        const [rows] = sent;
        expect(rows[2]).toEqual(['r16', 1, 'cat', 'dee', 9, 1, 'cat']);
    });

    it('advances the present manager on a bye', async () => {
        server.use(
            sheetValuesHandler({
                CupConfig: CUP_CONFIG_TAB,
                Cup: [CUP_HEADERS],
                CupBracket: [
                    ['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner'],
                    ['r16', '5', 'zed', '', '', '', ''],
                ],
                'player-gw-points': POINTS_TAB,
            }),
        );
        const sent = captureWrite();

        const result = await resolveTieAction({ stage: 'r16', tie: 5 });

        expect(result.success).toBe(true);
        expect(result.message).toContain('zed');
        const [rows] = sent;
        expect(rows[1]?.[6]).toBe('zed');
    });

    it('flags a play-off when first, second and third-entered are all level', async () => {
        server.use(
            sheetValuesHandler({
                CupConfig: CUP_CONFIG_TAB,
                Cup: [
                    CUP_HEADERS,
                    ...sub('eve', 3, 1, '101,102'),
                    ...sub('fin', 3, 1, '101,102'),
                    ...sub('eve', 4, 2, '101,102'),
                    ...sub('fin', 4, 2, '101,102'),
                ],
                CupBracket: [
                    ['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner'],
                    ['r16', '0', 'eve', 'fin', '', '', ''],
                ],
                'player-gw-points': POINTS_TAB,
            }),
        );
        const sent = captureWrite();

        const result = await resolveTieAction({ stage: 'r16', tie: 0 });

        expect(result.success).toBe(true);
        expect(result.message).toMatch(/play-off/i);
        // Aggregates are recorded; the winner stays unset for the play-off.
        const [rows] = sent;
        expect(rows[1]).toEqual(['r16', 0, 'eve', 'fin', 12, 12, '']);
    });

    it('refuses a tie with a leg still open', async () => {
        dataCache.clear();
        await seed(OPEN);

        const result = await resolveTieAction({ stage: 'r16', tie: 0 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/both legs must finish/i);
    });

    it('refuses when a side has no submission', async () => {
        server.use(
            sheetValuesHandler({
                CupConfig: CUP_CONFIG_TAB,
                Cup: [CUP_HEADERS, ...sub('ann', 3, 1, '101,102')],
                CupBracket: CUP_BRACKET_TAB,
                'player-gw-points': POINTS_TAB,
            }),
        );

        const result = await resolveTieAction({ stage: 'r16', tie: 0 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/autopick first/i);
    });

    it('refuses a non-knockout stage and an unknown tie', async () => {
        expect((await resolveTieAction({ stage: 'league', tie: 0 })).success).toBe(false);
        expect((await resolveTieAction({ stage: 'r16', tie: 99 })).error).toMatch(/no r16 tie 99/i);
    });
});
