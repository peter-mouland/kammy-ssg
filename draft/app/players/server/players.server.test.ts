/* Location: app/players/server/players.server.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../_shared/lib/cache/cache-config';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
import { setNow } from '../../_shared/lib/clock';
import type { EventData } from '../../_shared/lib/fpl/fpl-types';
import { getGameweekData } from '../../_shared/lib/fpl/gameweeks';
import { fplBootstrap } from '../../_shared/test/fixtures/season-fixtures';
import { getPlayerStatsData } from './players.server';

/**
 * `/players` builds its gameweek selector from the current gameweek, so which of the two
 * gameweeks it means is visible in the UI: the list runs up to and including the gameweek
 * being PLAYED, and stops short of the one being picked.
 *
 * Worth pinning because #127 changed it without saying so -- its description claimed the
 * player pages did not reach the accessor at all, and they reach it three times. Nobody
 * noticed because these pages show per-player season history, so the current gameweek only
 * drives secondary things like this list.
 */

const events = fplBootstrap().events as EventData[];

const seed = async () => {
    dataCache.clear();
    await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => getGameweekData(events, new Date('2024-08-16T18:00:00Z')));
    await dataCache.get(CACHE_KEYS.FPL.PLAYERS, async () => [{ code: 1, web_name: 'Rice' }]);
    await dataCache.get(CACHE_KEYS.FPL.TEAMS, async () => [{ code: 3, short_name: 'ARS', id: 1, name: 'Arsenal' }]);
    await dataCache.get(CACHE_KEYS.SHEETS.PLAYERS, async () => [{ code: 1, name: 'Rice', pos: 'MID' }]);
};

afterEach(() => {
    setNow(null);
    dataCache.clear();
});

describe('the /players gameweek selector', () => {
    it('offers the gameweek being played, and not the one being picked', async () => {
        // GW20's deadline has passed and GW21's has not: 20 is being played, 21 is being
        // picked. Offering 21 would be offering a gameweek with no data in it.
        await seed();
        setNow('2025-01-10T00:00:00Z');

        const { availableGameweeks } = await getPlayerStatsData();

        expect(availableGameweeks).toHaveLength(20);
        expect(availableGameweeks?.at(-1)).toBe(20);
    });

    it('offers only GW1 through GW1’s own match weekend', async () => {
        await seed();
        setNow('2024-08-17T14:00:00Z');

        const { availableGameweeks } = await getPlayerStatsData();

        expect(availableGameweeks).toEqual([1]);
    });
});
