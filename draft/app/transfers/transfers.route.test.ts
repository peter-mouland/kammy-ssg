/* Location: app/transfers/transfers.route.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_KEYS } from '../_shared/lib/cache/cache-config';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { resetInMemoryFirestore } from '../_shared/lib/firestore-cache/firestore-memory';
import { googleAuthHandler, sheetValuesHandler } from '../_shared/test/google-sheets-msw';
import * as route from './transfers.route';

/**
 * The transfers loader, end to end, for the fixtures the out step shows (issue #174).
 *
 * Sheets and FPL's fixtures endpoint run behind MSW, so the real clients run. The rest of
 * FPL (calendar, teams, players) is read from Firestore, which MSW cannot intercept, so it
 * is seeded through the app's own cache; the `division-teams` documents come from the
 * in-memory Firestore, which here is simply empty. Nothing is module-mocked.
 *
 * The flag is read lazily by `getFirestoreInstance()`, so setting it after the imports is fine.
 */
process.env.KAMMY_FIXTURE_FIRESTORE = '1';

const FPL_FIXTURES_URL = 'https://fantasy.premierleague.com/api/fixtures/';
const FPL_BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';

/** FPL's live player list, cut down to what availability reads: one fit, one doubtful, one injured. */
const BOOTSTRAP = {
    elements: [
        { id: 1, code: 101, web_name: 'Fit', status: 'a', chance_of_playing_next_round: null },
        { id: 2, code: 102, web_name: 'Knock', status: 'd', chance_of_playing_next_round: 75 },
        { id: 3, code: 103, web_name: 'Crocked', status: 'i', chance_of_playing_next_round: 0 },
    ],
};
const bootstrapFails = () => http.get(FPL_BOOTSTRAP_URL, () => new HttpResponse(null, { status: 500 }));
const HOUR = 60 * 60 * 1000;

const PLAYED = '2020-01-01T11:00:00Z';
const AHEAD = '2099-01-01T11:00:00Z';

const gameweek = (id: number, end: string) => ({
    fplEvent: { id, name: `Gameweek ${id}`, is_current: false, deadline_time: end, finished: end === PLAYED },
    gameWeekIndex: id - 1,
    start: new Date(PLAYED),
    end: new Date(end),
    isCurrent: false,
    isNext: false,
    hasPassed: end === PLAYED,
});

/** GW1-3 played, GW4 onwards still to come: a transfer now is for GW4. */
const EVENTS = [1, 2, 3, 4, 5, 6].map((id) => gameweek(id, id <= 3 ? PLAYED : AHEAD));

/** Fixtures name clubs by `id`; the page keys them by `code`. They differ on purpose. */
const ARS = { id: 1, code: 3, name: 'Arsenal', short_name: 'ARS' };
const LIV = { id: 12, code: 14, name: 'Liverpool', short_name: 'LIV' };

/** Arsenal play Liverpool every gameweek, home in odd weeks, so each week is identifiable. */
const FIXTURES = EVENTS.map(({ fplEvent: { id } }) => ({
    id,
    event: id,
    team_h: id % 2 ? ARS.id : LIV.id,
    team_a: id % 2 ? LIV.id : ARS.id,
    team_h_difficulty: 3,
    team_a_difficulty: 3,
    kickoff_time: `2025-01-0${id}T15:00:00Z`,
    finished: false,
    started: false,
}));

const DIVISIONS_TAB = [
    ['id', 'spreadsheetKey', 'label', 'order', 'url', 'promotion', 'relegation', 'cup'],
    ['premierLeague', 'premierLeague', 'Premier League', 1, 'premier-league', 'FALSE', 'TRUE', 'TRUE'],
];

const USER_TEAMS_TAB = [
    ['User ID', 'User Name', 'Team Name', 'Division ID', 'Last Updated'],
    ['ann', 'Ann', 'Ann FC', 'premierLeague', '2026-08-01'],
];

const server = setupServer(
    googleAuthHandler,
    sheetValuesHandler({
        Divisions: DIVISIONS_TAB,
        UserTeams: USER_TEAMS_TAB,
        Players: [],
        'premierLeague-transfers': [],
    }),
    http.get(FPL_FIXTURES_URL, () => HttpResponse.json(FIXTURES)),
    http.get(FPL_BOOTSTRAP_URL, () => HttpResponse.json(BOOTSTRAP)),
);

const load = async (search = '') => {
    const result = await route.loader({
        request: new Request(`http://localhost/transfers?user=ann${search}`),
        params: {},
    } as unknown as Parameters<typeof route.loader>[0]);
    return (result as { data: Awaited<ReturnType<typeof route.loader>>['data'] }).data;
};

/** Arsenal's window as [gameweek, opponent, home?] -- enough to tell the weeks apart. */
const arsenalWindow = (pageData: Awaited<ReturnType<typeof load>>) =>
    pageData.upcomingFixturesByTeamCode?.[ARS.code]?.map(({ gameweek, fixtures }) => [
        gameweek,
        fixtures[0]?.opponent,
        fixtures[0]?.isHome,
    ]);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
/** The FPL reads that sit behind Firestore. Seeding an expired key refills it. */
async function seedFpl() {
    await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => EVENTS);
    await dataCache.get(CACHE_KEYS.FPL.TEAMS, async () => [ARS, LIV]);
    await dataCache.get(CACHE_KEYS.FPL.PLAYERS, async () => []);
}

beforeEach(async () => {
    dataCache.clear();
    await seedFpl();
});
afterEach(() => {
    server.resetHandlers();
    resetInMemoryFirestore();
    vi.useRealTimers();
});
afterAll(() => server.close());

describe('the fixtures on the out step', () => {
    it('shows the three gameweeks from the one the transfer is for', async () => {
        const pageData = await load();

        expect(pageData.selectedGameweek).toBe(4);
        expect(arsenalWindow(pageData)).toEqual([
            [4, 'LIV', false],
            [5, 'LIV', true],
            [6, 'LIV', false],
        ]);
    });

    it('moves the window with ?gameweek=', async () => {
        const pageData = await load('&gameweek=2');

        expect(pageData.selectedGameweek).toBe(2);
        expect(arsenalWindow(pageData)?.map(([gw]) => gw)).toEqual([2, 3, 4]);
    });

    // Fixtures only feed the strip, so FPL being down must not stop a transfer.
    it('still loads the page, with no fixtures, when FPL fixtures cannot be read', async () => {
        server.use(http.get(FPL_FIXTURES_URL, () => new HttpResponse(null, { status: 500 })));

        const pageData = await load();

        expect(pageData.selectedUser).toBe('ann');
        expect(pageData.upcomingFixturesByTeamCode).toEqual({});
    });
});

describe("FPL's availability, streamed after the page", () => {
    it('lists only the players in doubt, with when it was fetched', async () => {
        const pageData = await load();
        const availability = await pageData.availability;

        expect(availability?.byCode).toEqual({
            102: { status: 'd', chanceNextRound: 75 },
            103: { status: 'i', chanceNextRound: 0 },
        });
        expect(Date.now() - Date.parse(availability?.fetchedAt ?? '')).toBeLessThan(1000);
    });

    // Availability is extra information: FPL being down must not stop a transfer, and the
    // page must not quietly show nothing as if everyone were fit -- null says "can't say".
    it('resolves to null, and the page still loads, when FPL cannot be read', async () => {
        server.use(bootstrapFails());

        const pageData = await load();

        expect(pageData.selectedUser).toBe('ann');
        expect(await pageData.availability).toBeNull();
    });

    describe('when a refresh fails, the cache hands back its last copy', () => {
        // Only Date is faked, so MSW and the loader's promises run as normal.
        beforeEach(async () => {
            vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-20T09:00:00Z') });
            await seedFpl(); // seeded under the real clock, so expired under this one
        });

        it('shows that copy, as of when it was fetched, while it is under six hours old', async () => {
            await (await load()).availability;
            server.use(bootstrapFails());
            vi.setSystemTime(Date.now() + 2 * HOUR);
            await seedFpl(); // the calendar expires too; only the bootstrap is under test

            const availability = await (await load()).availability;

            expect(availability?.byCode[103]).toEqual({ status: 'i', chanceNextRound: 0 });
            expect(availability?.fetchedAt).toBe('2026-11-20T09:00:00.000Z');
        });

        it('shows nothing once that copy is over six hours old: wrong news is worse than none', async () => {
            await (await load()).availability;
            server.use(bootstrapFails());
            vi.setSystemTime(Date.now() + 7 * HOUR);
            await seedFpl();

            expect(await (await load()).availability).toBeNull();
        });
    });
});
