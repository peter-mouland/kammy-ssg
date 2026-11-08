/* Location: app/leagues/league-standings.route.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../_shared/lib/cache/cache-config';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { resetInMemoryFirestore } from '../_shared/lib/firestore-cache/firestore-memory';
import { googleAuthHandler, sheetValuesHandler } from '../_shared/test/google-sheets-msw';
import { createDivisionTeamsDocument } from '../scoring/index.server';
import type { DivisionTeamsDocument, RosterByManagerId } from '../teams';
import * as route from './league-standings.route';

/**
 * The standings loader, end to end, for the gameweek range a monthly prize is played over.
 *
 * Sheets run behind MSW, the `division-teams` documents live in the in-memory Firestore (a
 * real boundary substitution: every line of the service runs), and the FPL calendar is
 * seeded through the app's own cache. Nothing is module-mocked.
 *
 * The flag is read lazily by `getFirestoreInstance()`, so setting it after the imports is fine.
 */
process.env.KAMMY_FIXTURE_FIRESTORE = '1';

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

/** GW1-3 played, GW4 still to come: GW3 is the gameweek being scored. */
const EVENTS = [gameweek(1, PLAYED), gameweek(2, PLAYED), gameweek(3, PLAYED), gameweek(4, AHEAD)];

const DIVISIONS_TAB = [
    ['id', 'spreadsheetKey', 'label', 'order', 'url', 'promotion', 'relegation', 'cup'],
    ['premierLeague', 'premierLeague', 'Premier League', 1, 'premier-league', 'FALSE', 'TRUE', 'TRUE'],
];

const USER_TEAMS_TAB = [
    ['User ID', 'User Name', 'Team Name', 'Division ID', 'Last Updated'],
    ['ann', 'Ann', 'Ann FC', 'premierLeague', '2026-08-01'],
    ['bob', 'Bob', 'Bob FC', 'premierLeague', '2026-08-01'],
];

const server = setupServer(
    googleAuthHandler,
    sheetValuesHandler({ Divisions: DIVISIONS_TAB, UserTeams: USER_TEAMS_TAB }),
);

/** A slot as the points processor leaves it: that week's points, and the season so far. */
const slot = (gameweekPoints: number, seasonPoints: number) => ({
    gameweek: { points: { total: gameweekPoints } },
    season: { points: { total: seasonPoints } },
});

/** Points per manager for one week, split across a keeper and a centre attacker. */
type WeekPoints = Record<string, { gk: number; ca: number; seasonTotal?: number }>;

async function seedWeek(gw: number, points: WeekPoints) {
    const teams = Object.fromEntries(
        Object.entries(points).map(([userId, { gk, ca, seasonTotal = 0 }]) => [
            userId,
            { roster: { gk_0: slot(gk, seasonTotal), ca_0: slot(ca, 0) } },
        ]),
    ) as unknown as RosterByManagerId;

    await createDivisionTeamsDocument({
        divisionId: 'premierLeague',
        gameweek: gw,
        lastUpdated: PLAYED,
        teams,
        metadata: { createdAt: PLAYED, updatedAt: PLAYED, pointsLastUpdated: null, pointsLastGameweek: null },
    } as DivisionTeamsDocument);
}

const load = async (search = '') => {
    const result = await route.loader({
        request: new Request(`http://localhost/leagues/premierLeague${search}`),
        params: { divisionId: 'premierLeague' },
    } as unknown as Parameters<typeof route.loader>[0]);
    return (result as { data: Awaited<ReturnType<typeof route.loader>>['data'] }).data;
};

const totalsByManager = (pageData: Awaited<ReturnType<typeof load>>) =>
    pageData.standingsData.premierLeague.map((team) => [team.userName, team.gameweekPoints.total]);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(async () => {
    dataCache.clear();
    await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => EVENTS);
    await seedWeek(1, { ann: { gk: 50, ca: 50 }, bob: { gk: 1, ca: 1 } });
    await seedWeek(2, { ann: { gk: 2, ca: 3 }, bob: { gk: 6, ca: 4 } });
    await seedWeek(3, { ann: { gk: 1, ca: 0 }, bob: { gk: 5, ca: 5 } });
});
afterEach(() => {
    server.resetHandlers();
    resetInMemoryFirestore();
});
afterAll(() => server.close());

describe('a range of gameweeks', () => {
    // Ann's 100 in GW1 is outside the range, so it must not count: Bob wins the mini-season.
    it('totals only the gameweeks in the range, highest first', async () => {
        const pageData = await load('?from=2&to=3');

        expect(pageData.selectedRange).toEqual({ from: 2, to: 3 });
        expect(totalsByManager(pageData)).toEqual([
            ['Bob', 20],
            ['Ann', 6],
        ]);
    });

    it('keeps the position breakdown, summed', async () => {
        const pageData = await load('?from=2&to=3');
        const bob = pageData.standingsData.premierLeague.find((team) => team.userId === 'bob');

        expect(bob?.gameweekPoints).toMatchObject({ gk: 11, ca: 9, total: 20 });
    });

    it('counts a manager who is missing from one week for the weeks they have', async () => {
        resetInMemoryFirestore();
        await seedWeek(2, { ann: { gk: 2, ca: 3 }, bob: { gk: 6, ca: 4 } });
        await seedWeek(3, { ann: { gk: 1, ca: 0 } });

        const pageData = await load('?from=2&to=3');

        expect(totalsByManager(pageData)).toEqual([
            ['Bob', 10],
            ['Ann', 6],
        ]);
    });

    it('treats the last week of the range as the selected gameweek', async () => {
        const pageData = await load('?from=1&to=2');

        expect(pageData.selectedGameweek).toBe(2);
    });
});

describe('without a usable range', () => {
    it('shows the normal page for the gameweek being scored', async () => {
        const pageData = await load();

        expect(pageData.selectedRange).toBeNull();
        expect(pageData.selectedGameweek).toBe(3);
        // That week's points only, not a total: the page's own gameweek table.
        expect(Object.fromEntries(totalsByManager(pageData))).toEqual({ Ann: 1, Bob: 10 });
    });

    it('ignores a range reaching past the gameweek being scored', async () => {
        const pageData = await load('?from=2&to=4');

        expect(pageData.selectedRange).toBeNull();
    });
});
