/* Location: app/scoring/server/services/player-gw-points.service.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../../../_shared/test/google-sheets-msw';
import * as service from './player-gw-points.service';

/**
 * Building the `player-gw-points` table.
 *
 * This computation used to live inside `_shared/lib/sheets/player-gw-points.ts`, where a
 * sheets reader ran the scoring engine to decide what to write. It lives here now and the
 * sheets module only stores what it is handed (P2.3).
 *
 * The `Players` sheet is served through MSW so the real sheet client and its parsing run.
 * The FPL side reaches Firestore over gRPC, which MSW cannot intercept — so those values
 * are seeded through the app's own in-memory cache instead. That is the same substitution
 * idea one layer up: a real seam the app genuinely has, with all the code under test still
 * running for real. Nothing is module-mocked.
 */

const PLAYERS_TAB = [
    ['code', 'position', 'team', 'webName', 'isHidden', 'new'],
    ['118748', 'mid', 'Liverpool', 'Salah', '', ''],
    ['223340', 'cb', 'Arsenal', 'Saliba', '', ''],
];

const FPL_TEAMS = [
    { code: 14, name: 'Liverpool', short_name: 'LIV', id: 1 },
    { code: 3, name: 'Arsenal', short_name: 'ARS', id: 2 },
];

const FPL_PLAYERS = [
    { code: 118748, id: 1, web_name: 'Salah', team_code: 14 },
    { code: 223340, id: 2, web_name: 'Saliba', team_code: 3 },
];

/** One FPL history entry — only the fields the scoring engine reads are set. */
const history = (round: number, over: Record<string, number> = {}) => ({
    round,
    minutes: 90,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 0,
    bonus: 0,
    clearances_blocks_interceptions: 0,
    tackles: 0,
    recoveries: 0,
    defensive_contribution: 0,
    total_points: 0,
    ...over,
});

const server = setupServer(googleAuthHandler, sheetValuesHandler({ Players: PLAYERS_TAB }));

/** Seed the FPL side through the real cache API, so its Firestore fetcher never runs. */
async function seedFplCache(statsById: Record<number, { history: ReturnType<typeof history>[] }>) {
    await dataCache.get(CACHE_KEYS.FPL.PLAYERS, async () => FPL_PLAYERS);
    await dataCache.get(CACHE_KEYS.FPL.TEAMS, async () => FPL_TEAMS);
    for (const [id, stats] of Object.entries(statsById)) {
        await dataCache.get(CACHE_KEYS.FPL.PLAYER_STATS(id), async () => stats);
    }
}

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => dataCache.clear());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('generatePlayerGameweekPointsTable', () => {
    it('writes one row per tracked player', async () => {
        await seedFplCache({ 1: { history: [history(1)] }, 2: { history: [history(1)] } });

        const { dataRows } = await service.generatePlayerGameweekPointsTable();

        expect(dataRows).toHaveLength(2);
        expect(dataRows.map((r) => r.webName).sort()).toEqual(['Salah', 'Saliba']);
    });

    // REGRESSION. This column was written as `undefined` for every player, forever:
    // the code read `fplPlayer.team_name`, which does not exist on EnhancedPlayerData
    // (it has team_code), and carried a `// todo map to name`. It only surfaced when the
    // code moved into a file that was actually being type-checked.
    it('resolves each player’s club name from their team code', async () => {
        await seedFplCache({ 1: { history: [history(1)] }, 2: { history: [history(1)] } });

        const { dataRows } = await service.generatePlayerGameweekPointsTable();
        const byName = Object.fromEntries(dataRows.map((r) => [r.webName, r.teamName]));

        expect(byName.Salah).toBe('Liverpool');
        expect(byName.Saliba).toBe('Arsenal');
    });

    // The points are the app's own, not FPL's. A midfielder's goal is 4, so a 90-minute
    // appearance (3) plus a goal is 7 — proof the scoring engine really ran.
    it('scores each gameweek with our rules and our position', async () => {
        await seedFplCache({
            1: { history: [history(1, { goals_scored: 1 })] },
            2: { history: [history(1)] },
        });

        const { dataRows } = await service.generatePlayerGameweekPointsTable();
        const salah = dataRows.find((r) => r.webName === 'Salah');

        expect(salah?.['gw-1']).toBe(7); // 90 min = 3, mid goal = 4
    });

    // The same match scores differently by position, which is the whole reason the
    // position comes from OUR sheet rather than from FPL.
    it('uses the position from the Players sheet, not FPL’s', async () => {
        await seedFplCache({
            1: { history: [history(1, { goals_scored: 1 })] },
            2: { history: [history(1, { goals_scored: 1 })] },
        });

        const { dataRows } = await service.generatePlayerGameweekPointsTable();
        const byName = Object.fromEntries(dataRows.map((r) => [r.webName, r['gw-1']]));

        expect(byName.Salah).toBe(7); // mid: 3 + 4
        expect(byName.Saliba).toBe(11); // cb: 3 + 8
    });

    it('gives every gameweek played its own column, in order', async () => {
        await seedFplCache({
            1: { history: [history(1), history(2), history(3)] },
            2: { history: [history(1)] },
        });

        const { headerRows } = await service.generatePlayerGameweekPointsTable();

        expect(headerRows).toEqual(['playerCode', 'webName', 'position', 'teamName', 'gw-1', 'gw-2', 'gw-3']);
    });

    // A double gameweek is two matches in one round. Both are scored, and the second
    // gets its own column rather than overwriting the first.
    it('keeps both matches of a double gameweek', async () => {
        await seedFplCache({
            1: { history: [history(2, { goals_scored: 1 }), history(2)] },
            2: { history: [history(1)] },
        });

        const { dataRows, headerRows } = await service.generatePlayerGameweekPointsTable();
        const salah = dataRows.find((r) => r.webName === 'Salah');

        expect(headerRows).toContain('gw-2');
        expect(headerRows).toContain('gw-2-b');
        expect(salah?.['gw-2']).toBe(7); // the match with the goal
        expect(salah?.['gw-2-b']).toBe(3); // appearance only
    });

    // Only players the league tracks get a row -- FPL has ~700, the league has far fewer.
    it('ignores FPL players who are not in the Players sheet', async () => {
        server.use(sheetValuesHandler({ Players: [PLAYERS_TAB[0], PLAYERS_TAB[1]] })); // Salah only
        await seedFplCache({ 1: { history: [history(1)] }, 2: { history: [history(1)] } });

        const { dataRows } = await service.generatePlayerGameweekPointsTable();

        expect(dataRows.map((r) => r.webName)).toEqual(['Salah']);
    });

    it('fails loudly when no tracked player matches FPL', async () => {
        server.use(sheetValuesHandler({ Players: [PLAYERS_TAB[0]] })); // headers only
        await seedFplCache({});

        await expect(service.generatePlayerGameweekPointsTable()).rejects.toThrow(/No players found/);
    });
});
