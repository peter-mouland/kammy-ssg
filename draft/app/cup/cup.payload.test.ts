/* Location: app/cup/cup.payload.test.ts */

/**
 * What the cup page receives at each scenario date.
 *
 * Real loader, real sheets client, real scoring, real division documents rebuilt through
 * the app's own pipeline. The only thing that varies between cases is the clock.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { setNow } from '../_shared/lib/clock';
import { expectPayloadMatches } from '../_shared/test/payload-snapshot';
import { SCENARIOS } from '../_shared/test/scenarios';
import * as route from './cup.route';

const load = async (search = '') => {
    const result = await route.loader({
        request: new Request(`http://localhost/cup${search}`),
    } as Parameters<typeof route.loader>[0]);

    return (result as unknown as { data: Record<string, unknown> }).data;
};

beforeEach(() => {
    // Every read is cached; without clearing, scenario two is served scenario one's answer.
    dataCache.clear();
});

describe('the cup page payload', () => {
    for (const scenario of SCENARIOS) {
        describe(`${scenario.name} (${scenario.now})`, () => {
            beforeEach(() => {
                setNow(scenario.now);
            });

            it('matches its committed payload', async () => {
                await expectPayloadMatches('cup', scenario.name, await load());
            });

            it('shows a cup gameweek, whether or not today is one', async () => {
                // The design, from the loader: an explicit ?gameweek wins; otherwise the
                // current gameweek if it is a cup gameweek, else the first configured one.
                // So outside the cup weeks this is 21 rather than the scenario's gameweek --
                // the page always has a cup to show.
                const CUP_GAMEWEEKS = [21, 22, 23, 24, 25];

                expect(CUP_GAMEWEEKS).toContain((await load()).gameweek);
            });
        });
    }

    it('is in the league stage mid-January, which is what CupConfig says', async () => {
        setNow('2025-01-10T00:00:00.000Z');

        // league = 21,22,23 in the fixtures' CupConfig, and 2025-01-10 is GW21.
        const payload = await load();

        expect(payload.gameweek).toBe(21);
        expect((payload.round as { stage: string } | null)?.stage).toBe('league');
    });

    it('is in a two-legged knockout round at the end of January', async () => {
        setNow('2025-01-29T00:00:00.000Z');

        // r16 = 24,25. A two-legged round is where the player-reuse ban applies.
        const payload = await load();

        expect(payload.gameweek).toBe(24);
        expect((payload.round as { stage: string } | null)?.stage).toBe('r16');
    });
});
