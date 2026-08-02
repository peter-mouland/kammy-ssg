/* Location: app/leagues/league-standings.payload.test.ts */

/**
 * What the standings page receives, at each scenario date, from the real loader.
 *
 * Layer 2 of the plan: real loader, real sheets client, real scoring, real division
 * documents rebuilt through the app's own pipeline — MSW at the network and the in-memory
 * Firestore underneath. Nothing is module-mocked, so a pass means the data path works.
 *
 * The only thing that differs between these cases is the clock. That is the point: the same
 * fixtures produce a different page on different dates, and if they ever stop doing so, the
 * date handling has regressed somewhere no unit test looks.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { setNow } from '../_shared/lib/clock';
import { expectPayloadMatches } from '../_shared/test/payload-snapshot';
import { SCENARIOS } from '../_shared/test/scenarios';
import * as route from './league-standings.route';

const load = async (path = '/leagues') => {
    const result = await route.loader({
        request: new Request(`http://localhost${path}`),
        params: {},
        context: {},
    } as unknown as Parameters<typeof route.loader>[0]);

    return (result as { data: unknown }).data as {
        currentGameweek?: number;
        divisions?: Array<{ id: string }>;
        standings?: unknown;
    };
};

beforeEach(() => {
    // Every read is cached, and the cache is keyed by content rather than by date -- so
    // without this, scenario two would be served scenario one's answer.
    dataCache.clear();
});

describe('the standings page payload', () => {
    for (const scenario of SCENARIOS) {
        describe(`${scenario.name} (${scenario.now})`, () => {
            beforeEach(() => {
                setNow(scenario.now);
            });

            it('reports the gameweek the scenario says it is', async () => {
                const payload = await load();

                expect(payload.currentGameweek).toBe(scenario.currentGameweek);
            });

            it('matches its committed payload', async () => {
                await expectPayloadMatches('leagues', scenario.name, await load());
            });
        });
    }

    it('returns every division the sheet lists, including the one in no cross-division play', async () => {
        setNow(SCENARIOS[3].now);

        const payload = await load();

        // The fixtures are a three-division season; greatScott is code-covered but not
        // fixture-covered, which is why this expects three rather than four.
        expect(payload.divisions?.map((division) => division.id).sort()).toEqual([
            'championship',
            'leagueOne',
            'premierLeague',
        ]);
    });
});
