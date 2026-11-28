/* Location: app/cup/cup-admin.route.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../_shared/lib/cache/cache-config';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetHandlers } from '../_shared/test/google-sheets-msw';
import * as route from './cup-admin.route';

/**
 * Cup admin actions against the stateful sheet harness: writes land in the
 * store, so a test can read the CupConfig back and check what actually
 * persisted, not just that a request was made.
 */

const CUP_CONFIG_TAB = [
    ['Key', 'Value'],
    ['season', '2526'],
    ['league', '3,4'],
    ['r16', '5,6'],
    ['qf', '7,8'],
    ['sf', '9,10'],
    ['final', '11'],
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

const USER_TEAMS_TAB = [
    ['User ID', 'User Name', 'Team Name', 'Division ID', 'Last Updated'],
    ['ann', 'Ann', 'Ann FC', 'premierLeague', '2026-08-01'],
    ['bob', 'Bob', 'Bob FC', 'premierLeague', '2026-08-01'],
    ['cat', 'Cat', 'Cat FC', 'premierLeague', '2026-08-01'],
    ['dee', 'Dee', 'Dee FC', 'premierLeague', '2026-08-01'],
];

const DIVISIONS_TAB = [
    ['id', 'spreadsheetKey', 'label', 'order', 'url', 'promotion', 'relegation', 'cup'],
    ['premierLeague', 'premierLeague', 'Premier League', 1, 'premier-league', 'FALSE', 'TRUE', 'TRUE'],
];

const { handlers, store } = sheetHandlers({
    CupConfig: CUP_CONFIG_TAB,
    Cup: [CUP_HEADERS],
    CupBracket: [['Stage', 'Tie', 'Home', 'Away']],
    'player-gw-points': [['playerCode']],
    UserTeams: USER_TEAMS_TAB,
    Divisions: DIVISIONS_TAB,
});
const server = setupServer(googleAuthHandler, ...handlers);

const post = async (fields: Record<string, string>) => {
    const result = await route.action({
        request: new Request('http://localhost/cup/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(fields),
        }),
        context: undefined,
    } as unknown as Parameters<typeof route.action>[0]);
    return (result as { data: { success?: boolean; error?: string; message?: string } }).data;
};

const seedEvents = (gw3End: string) =>
    dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => [
        {
            fplEvent: { id: 3, deadline_time: gw3End, finished: false },
            start: new Date('2020-01-01T00:00:00Z'),
            end: new Date(gw3End),
        },
        {
            fplEvent: { id: 4, deadline_time: '2099-01-08T00:00:00Z', finished: false },
            start: new Date(gw3End),
            end: new Date('2099-01-08T00:00:00Z'),
        },
    ]);

const configValue = (key: string) => store.values('CupConfig').find((row) => row[0] === key)?.[1];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => dataCache.clear());
afterEach(() => {
    server.resetHandlers();
    store.reset();
});
afterAll(() => server.close());

describe('cup admin league generation', () => {
    it('generates leagues of the chosen size covering every cup manager', async () => {
        await seedEvents('2099-01-01T00:00:00Z');

        const result = await post({ actionType: 'generateLeagues', leagueSize: '2' });

        expect(result.success).toBe(true);
        expect(configValue('leagueSize')).toBe('2');
        const leagues = String(configValue('leagues')).split(';');
        expect(leagues).toHaveLength(2);
        expect(leagues.flatMap((league) => league.split(','))).toEqual(
            expect.arrayContaining(['ann', 'bob', 'cat', 'dee']),
        );
    });

    it('keeps the generated leagues when the gameweeks are saved again', async () => {
        await seedEvents('2099-01-01T00:00:00Z');
        await post({ actionType: 'generateLeagues', leagueSize: '2' });
        const leaguesBefore = configValue('leagues');
        dataCache.clear();

        const result = await post({
            actionType: 'setConfig',
            season: '2526',
            league: '3,4',
            r16: '5,6',
            qf: '7,8',
            sf: '9,10',
            final: '11',
        });

        expect(result.success).toBe(true);
        expect(configValue('leagues')).toBe(leaguesBefore);
        expect(configValue('leagueSize')).toBe('2');
    });

    it('refuses to regenerate once the first league gameweek deadline has passed', async () => {
        await seedEvents('2020-01-02T00:00:00Z');

        const result = await post({ actionType: 'generateLeagues', leagueSize: '2' });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/can no longer be regenerated/i);
        expect(configValue('leagues')).toBeUndefined();
    });
});
