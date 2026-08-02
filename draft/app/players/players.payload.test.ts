/* Location: app/players/players.payload.test.ts */

/**
 * What the player list receives at each scenario date.
 *
 * Real loader, real sheets client, real scoring, real division documents rebuilt through
 * the app's own pipeline. The only thing that varies between cases is the clock.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { setNow } from '../_shared/lib/clock';
import { expectPayloadMatches } from '../_shared/test/payload-snapshot';
import { SCENARIOS } from '../_shared/test/scenarios';
import * as route from './players.route';

const load = async (search = '') => {
    const result = await route.loader({
        request: new Request(`http://localhost/players${search}`),
    } as Parameters<typeof route.loader>[0]);

    return (result as unknown as { data: Record<string, unknown> }).data;
};

beforeEach(() => {
    // Every read is cached; without clearing, scenario two is served scenario one's answer.
    dataCache.clear();
});

describe('the players page payload', () => {
    for (const scenario of SCENARIOS) {
        describe(`${scenario.name} (${scenario.now})`, () => {
            beforeEach(() => {
                setNow(scenario.now);
            });

            it('matches its committed payload', async () => {
                await expectPayloadMatches('players', scenario.name, await load());
            });
        });
    }

    it('gives every player a draft block, which eight columns dereference', async () => {
        setNow('2025-01-10T00:00:00.000Z');

        const players = (await load()).players as Array<{ draft?: unknown }>;

        expect(players.length).toBeGreaterThan(0);
        expect(players.every((player) => player.draft !== undefined)).toBe(true);
    });
});
