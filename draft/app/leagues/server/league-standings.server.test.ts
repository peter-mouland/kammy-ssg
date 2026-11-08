/* Location: app/leagues/server/league-standings.server.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../_shared/lib/cache/cache-config';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
import { resetInMemoryFirestore } from '../../_shared/lib/firestore-cache/firestore-memory';
import { googleAuthHandler, sheetValuesHandler } from '../../_shared/test/google-sheets-msw';
import { createDivisionTeamsDocument } from '../../scoring/index.server';
import type { DivisionTeamsDocument, RosterByManagerId } from '../../teams';
import { getManagerCategoryStandings } from '../index.server';

/**
 * A manager's category standings, read the way the transfers page reads them: Sheets
 * behind MSW, the `division-teams` documents in the in-memory Firestore, and the FPL
 * calendar seeded through the app's own cache. Nothing is module-mocked.
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

/** GW1-2 played, GW3 still to come: GW2 is the gameweek the league table shows. */
const EVENTS = [gameweek(1, PLAYED), gameweek(2, PLAYED), gameweek(3, AHEAD)];

const USER_TEAMS_TAB = [
    ['User ID', 'User Name', 'Team Name', 'Division ID', 'Last Updated'],
    ['ann', 'Ann', 'Ann FC', 'premierLeague', '2026-08-01'],
    ['bob', 'Bob', 'Bob FC', 'premierLeague', '2026-08-01'],
    ['cat', 'Cat', 'Cat FC', 'premierLeague', '2026-08-01'],
];

const server = setupServer(googleAuthHandler, sheetValuesHandler({ UserTeams: USER_TEAMS_TAB }));

const slot = (seasonPoints: number) => ({
    gameweek: { points: { total: 0 } },
    season: { points: { total: seasonPoints } },
});

/** Season CB points per manager, as of one gameweek. */
async function seedWeek(gw: number, cbPoints: Record<string, number>) {
    const teams = Object.fromEntries(
        Object.entries(cbPoints).map(([userId, cb]) => [userId, { roster: { cb_0: slot(cb) } }]),
    ) as unknown as RosterByManagerId;

    await createDivisionTeamsDocument({
        divisionId: 'premierLeague',
        gameweek: gw,
        lastUpdated: PLAYED,
        teams,
        metadata: { createdAt: PLAYED, updatedAt: PLAYED, pointsLastUpdated: null, pointsLastGameweek: null },
    } as DivisionTeamsDocument);
}

const cbFor = async (userId: string) =>
    (await getManagerCategoryStandings('premierLeague', userId)).find((standing) => standing.position === 'cb');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(async () => {
    dataCache.clear();
    await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => EVENTS);
});
afterEach(() => {
    server.resetHandlers();
    resetInMemoryFirestore();
});
afterAll(() => server.close());

describe("a manager's category standings", () => {
    it('reflect the gameweek the league table shows, not an earlier one', async () => {
        await seedWeek(1, { ann: 50, bob: 10, cat: 5 });
        await seedWeek(2, { ann: 60, bob: 70, cat: 40 });

        expect(await cbFor('ann')).toMatchObject({ rank: 2, rankPoints: 1, points: 60, gapAbove: 10, gapBelow: 20 });
    });

    it('are empty, not an error, when the gameweek has not been processed yet', async () => {
        expect(await getManagerCategoryStandings('premierLeague', 'ann')).toEqual([]);
    });
});
