/* Location: app/transfers/transfers.payload.test.ts */

/**
 * What the transfer page receives at each scenario date.
 *
 * Real loader, real sheets client, real scoring, real division documents rebuilt through
 * the app's own pipeline. The only thing that varies between cases is the clock.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { setNow } from '../_shared/lib/clock';
import { expectPayloadMatches } from '../_shared/test/payload-snapshot';
import { SCENARIOS } from '../_shared/test/scenarios';
import * as route from './transfers.route';

const load = async (search = '') => {
    const result = await route.loader({
        request: new Request(`http://localhost/transfers${search}`),
    } as Parameters<typeof route.loader>[0]);

    return (result as unknown as { data: Record<string, unknown> }).data;
};

beforeEach(() => {
    // Every read is cached; without clearing, scenario two is served scenario one's answer.
    dataCache.clear();
});

describe('the transfers page payload', () => {
    for (const scenario of SCENARIOS) {
        describe(`${scenario.name} (${scenario.now})`, () => {
            beforeEach(() => {
                setNow(scenario.now);
            });

            it('matches its committed payload', async () => {
                await expectPayloadMatches('transfers', scenario.name, await load());
            });

            it('targets a gameweek you can still transfer into', async () => {
                // Not always the current gameweek, and that is the design: once a deadline
                // has passed you are transferring into the *next* one. So this asserts the
                // rule rather than the scenario's number -- they diverge only at season-end,
                // where GW38's deadline is behind us.
                const payload = await load();
                const currentGameweekData = payload.currentGameweekData as {
                    // biome-ignore lint/style/useNamingConvention: FPL's own field name
                    fplEvent: { id: number; deadline_time: string };
                };
                const deadlinePassed = new Date(scenario.now) > new Date(currentGameweekData.fplEvent.deadline_time);

                expect(payload.currentGameweek).toBe(
                    deadlinePassed ? scenario.currentGameweek + 1 : scenario.currentGameweek,
                );
            });
        });
    }
});
