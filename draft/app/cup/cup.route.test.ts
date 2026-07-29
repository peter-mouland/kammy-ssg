/* Location: app/cup/cup.route.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../_shared/lib/cache/cache-config';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler, useFakeSheetsCredentials } from '../_shared/test/google-sheets-msw';

/**
 * The first route-loader test — the boundary `testing-conventions.md` names as the most
 * valuable place to test, and the one that had no coverage at all.
 *
 * The loader is exercised end to end: the real sheets client and its parsing run behind
 * MSW, the real cup config parsing runs, and the real (pure) `getCupPageData` computes
 * the page. Nothing is module-mocked. The FPL side reads Firestore over gRPC, which MSW
 * cannot intercept, so those values are seeded through the app's own in-memory cache.
 *
 * What it asserts is what the page receives for a given URL — not how the loader is
 * assembled — so it should survive the loader being refactored.
 */

let route: typeof import('./cup.route');

/**
 * A gameweek's `end` is what decides whether submitted squads are revealed —
 * `isDeadlinePassed` compares it against now, not `deadline_time`. The loader takes no
 * clock, so moving `end` either side of the real `now` is the lever these tests pull.
 */
const gameweek = (id: number, { isCurrent = false, end = FUTURE } = {}) => ({
    fplEvent: { id, name: `Gameweek ${id}`, is_current: isCurrent, deadline_time: end },
    gameWeekIndex: id - 1,
    start: new Date('2020-01-01T11:00:00Z'),
    end: new Date(end),
    isCurrent,
    isNext: false,
    hasPassed: false,
});

const FUTURE = '2099-01-01T11:00:00Z';
const FINISHED = '2020-01-02T11:00:00Z';

/** Gameweek 3 is current. It is still in progress unless a test says otherwise. */
const events = (gw3End = FUTURE) => [
    gameweek(1),
    gameweek(2),
    gameweek(3, { isCurrent: true, end: gw3End }),
    gameweek(4),
    gameweek(5),
];

const USER_TEAMS_TAB = [
    ['User ID', 'User Name', 'Team Name', 'Division ID', 'Last Updated'],
    ['ann', 'Ann', 'Ann FC', 'premierLeague', '2026-08-01'],
    ['bob', 'Bob', 'Bob FC', 'championship', '2026-08-01'],
];

const CUP_CONFIG_TAB = [
    ['Key', 'Value'],
    ['season', '2526'],
    ['league', '1,2,3'],
    ['r16', '4,5'],
    ['qf', '6,7'],
    ['sf', '8,9'],
    ['final', '10'],
];

const CUP_TAB = [
    [
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
    ],
    ['Y', '2026-08-12T10:00:00Z', 'ann', 'premierLeague', '3', 'league', '1', '118748,223340', 'FALSE', ''],
];

const POINTS_TAB = [
    ['playerCode', 'webName', 'position', 'teamName', 'gw-1', 'gw-2', 'gw-3'],
    ['118748', 'Salah', 'mid', 'Liverpool', '7', '3', '9'],
    ['223340', 'Saliba', 'cb', 'Arsenal', '11', '5', '6'],
];

const CUP_BRACKET_TAB = [['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner']];

const allTabs = (over: Record<string, (string | number)[][]> = {}) =>
    sheetValuesHandler({
        UserTeams: USER_TEAMS_TAB,
        CupConfig: CUP_CONFIG_TAB,
        Cup: CUP_TAB,
        'player-gw-points': POINTS_TAB,
        CupBracket: CUP_BRACKET_TAB,
        ...over,
    });

const server = setupServer(googleAuthHandler, allTabs());

/** The FPL reads sit behind Firestore; seed them through the real cache API. */
async function seedFpl(gw3End?: string) {
    await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => events(gw3End));
    await dataCache.get(CACHE_KEYS.FPL.FIXTURES, async () => []);
    await dataCache.get(CACHE_KEYS.FPL.TEAMS, async () => [{ code: 14, name: 'Liverpool', id: 1, short_name: 'LIV' }]);
}

/** A request for the cup page, optionally at a specific gameweek. */
const cupRequest = (search = '') => new Request(`http://localhost/cup${search}`);

const load = async (search = '') => {
    // The loader only reads `request`; params/context are required by the signature.
    const result = await route.loader({ request: cupRequest(search) } as Parameters<typeof route.loader>[0]);
    return (result as { data: Awaited<ReturnType<typeof route.loader>>['data'] }).data;
};

beforeAll(async () => {
    useFakeSheetsCredentials();
    server.listen({ onUnhandledRequest: 'error' });
    route = await import('./cup.route');
});
beforeEach(async () => {
    dataCache.clear();
    await seedFpl();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('the cup page loader', () => {
    it('returns the page the managers and their teams', async () => {
        const pageData = await load();

        expect(pageData.hasConfig).toBe(true);
        expect(pageData.userTeams.map((team) => team.userName)).toEqual(['Ann', 'Bob']);
    });

    // With no ?gameweek, the loader shows the current gameweek when it is a cup
    // gameweek. GW3 is current and is in the league stage, so that is what should load.
    it('defaults to the current gameweek when it is a cup gameweek', async () => {
        const pageData = await load();

        expect(pageData.selectedGameweek).toBe(3);
    });

    // An explicit ?gameweek always wins -- that is what the gameweek selector sends.
    it('honours an explicit ?gameweek', async () => {
        const pageData = await load('?gameweek=2');

        expect(pageData.selectedGameweek).toBe(2);
    });

    it('reads the configured cup rounds from the sheet', async () => {
        const pageData = await load();

        expect(pageData.round?.gameweek).toBe(3);
        expect(pageData.round?.stage).toBe('league');
    });

    // The point of the cup's visibility mechanic: before the deadline nobody can see
    // anyone else's squad, so points stay hidden even though they are computable. This
    // is what issue #60 is about -- the server, not the UI, has to hold this line.
    it('hides a submitted squad and its points until the deadline passes', async () => {
        const pageData = await load();
        const ann = pageData.rows.find((row) => row.manager === 'ann');

        expect(pageData.deadlinePassed).toBe(false);
        expect(ann?.players).toBeNull();
        expect(ann?.points).toBeNull();
    });

    // Once the deadline has gone, the squad is revealed and scored from that gameweek's
    // column only: Salah 9 + Saliba 6 in GW3.
    it('reveals and scores a submitted squad once the deadline has passed', async () => {
        dataCache.clear();
        await seedFpl(FINISHED);

        const pageData = await load();
        const ann = pageData.rows.find((row) => row.manager === 'ann');

        expect(pageData.deadlinePassed).toBe(true);
        expect(ann?.players).toEqual([118748, 223340]);
        expect(ann?.points).toBe(15);
    });

    it('shows a manager who never submitted with no players, even after the deadline', async () => {
        dataCache.clear();
        await seedFpl(FINISHED);

        const pageData = await load();
        const bob = pageData.rows.find((row) => row.manager === 'bob');

        expect(bob?.players).toBeNull();
        expect(bob?.points).toBeNull();
    });

    // The cup is optional. With no configured round the page reports hasConfig: false
    // and no round -- but it still lists the managers, which is the intended design
    // rather than an empty screen.
    it('reports no config when the selected gameweek is not a cup gameweek', async () => {
        server.use(allTabs({ CupConfig: [['Key', 'Value']] }));

        const pageData = await load();

        expect(pageData.hasConfig).toBe(false);
        expect(pageData.round).toBeNull();
        expect(pageData.userTeams.map((team) => team.userName)).toEqual(['Ann', 'Bob']);
    });

    // Nobody knows what a manager sees when a sheet read fails. Now they do: the page
    // still renders, rather than the route throwing.
    it('still renders when the cup sheet is unavailable', async () => {
        server.use(allTabs({ Cup: [] }));

        const pageData = await load();

        expect(pageData.userTeams).toHaveLength(2);
    });
});
