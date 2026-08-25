/* Location: app/_shared/lib/fpl/api-cache.test.ts */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fplBootstrap } from '../../test/fixtures/season-fixtures';
import { CACHE_KEYS } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { setNow } from '../clock';
import { fplApiCache } from './api-cache';
import type { EventData, GameWeekData } from './fpl-types';
import { getGameweekData } from './gameweeks';

/**
 * `getScoringGameweekData()` and `getSelectionGameweekData()` are the single answers four
 * loaders build a whole page around, and neither had a test when the first of them
 * silently changed meaning in #118.
 *
 * The events they read are STORED: `populateEvents` runs `getGameweekData()` once and
 * writes the flags to Firestore, so `isCurrent` on them is frozen at whenever an admin
 * last ran Populate Bootstrap Data. **That gap is the whole subject of these tests**, so
 * they seed the real cache and let the real `getFplEvents()` run -- including its
 * `isFakeNow()` gate, which is the exact mechanism whose misreading caused the bug.
 *
 * Which means the two halves below cannot share a clock:
 *
 * - **Production** sets no fake clock, so the gate is off and the stored flags are used
 *   as written. To read frozen flags at a later date the calendar has to be built around
 *   the real `Date.now()`; a `setNow()` here would switch the gate on and quietly test
 *   the other path.
 * - **The harness** sets one, so the flags are recomputed on read and the frozen values
 *   never reach the accessors at all.
 */

/** Seed the events document through the real cache, as the loaders read it. */
const seedEvents = async (events: GameWeekData[]) => {
    dataCache.clear();
    await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => events);
};

beforeEach(() => dataCache.clear());
afterEach(() => {
    setNow(null);
    dataCache.clear();
});

describe('on the production clock, with flags frozen at the last populate', () => {
    const at = (hoursFromNow: number) => new Date(Date.now() + hoursFromNow * 3_600_000);

    /**
     * Three gameweeks around the real now: GW1's deadline has passed, GW2's has not.
     * The flags say GW1 is current, as a populate run before GW1's deadline would have
     * left them -- so every one of them is now wrong, which is the point.
     */
    const frozenCalendar = (): GameWeekData[] =>
        [1, 2, 3].map((id) => {
            const end = at(id === 1 ? -48 : id === 2 ? 120 : 288);
            return {
                fplEvent: {
                    deadline_time: end.toISOString(),
                    finished: id === 1,
                    id,
                    is_current: id === 1,
                    is_next: id === 2,
                    name: `Gameweek ${id}`,
                },
                gameWeekIndex: id - 1,
                start: at(id === 1 ? -200 : id === 2 ? -48 : 120),
                end,
                isCurrent: id === 1,
                isNext: id === 2,
                hasPassed: false,
            } as GameWeekData;
        });

    beforeEach(() => seedEvents(frozenCalendar()));

    it('scores the gameweek whose deadline has passed', async () => {
        expect((await fplApiCache.getScoringGameweekData())?.fplEvent.id).toBe(1);
    });

    it('selects the gameweek still open, not the one the stale flag names', async () => {
        // The frozen `isCurrent` says GW1, whose deadline is two days gone. Reading it
        // would offer managers a gameweek they can no longer enter a team for.
        expect((await fplApiCache.getSelectionGameweekData())?.fplEvent.id).toBe(2);
    });

    it('keeps the two one apart once a deadline has passed', async () => {
        const scoring = await fplApiCache.getScoringGameweekData();
        const selection = await fplApiCache.getSelectionGameweekData();

        expect(selection?.fplEvent.id).toBe((scoring?.fplEvent.id ?? 0) + 1);
    });

    it('has no selection once the final deadline has passed, so the guard can explain it', async () => {
        // The season is over: there is no team left to pick, but there are still points
        // to show. Returning a gameweek 39 that does not exist is the failure to avoid.
        await seedEvents(frozenCalendar().map((gameweek) => ({ ...gameweek, end: at(-1), isCurrent: false })));

        expect(await fplApiCache.getSelectionGameweekData()).toBeUndefined();
        expect((await fplApiCache.getScoringGameweekData())?.fplEvent.id).toBe(3);
    });

    it('has no answer at all when the calendar has not been loaded', async () => {
        await seedEvents([]);

        expect(await fplApiCache.getScoringGameweekData()).toBeUndefined();
        expect(await fplApiCache.getSelectionGameweekData()).toBeUndefined();
    });
});

describe('on a fake clock, where the harness recomputes the flags on read', () => {
    const events = fplBootstrap().events as EventData[];
    /** Events as Firestore holds them: flags computed once, at `populatedAt`. */
    const storedAt = (populatedAt: string) => getGameweekData(events, new Date(populatedAt));

    it('moves through the season without anyone repopulating', async () => {
        // Flags written in August, read in January. `getFplEvents()` recomputes them
        // because the clock is fake, which is the only reason the harness season moves.
        await seedEvents(storedAt('2024-08-16T18:00:00Z'));
        setNow('2025-01-10T00:00:00Z');

        expect((await fplApiCache.getScoringGameweekData())?.fplEvent.id).toBe(20);
        expect((await fplApiCache.getSelectionGameweekData())?.fplEvent.id).toBe(21);
    });

    it('separates the gameweek being played from the one being picked, mid weekend', async () => {
        await seedEvents(storedAt('2024-08-16T18:00:00Z'));
        setNow('2024-08-17T14:00:00Z');

        expect((await fplApiCache.getScoringGameweekData())?.fplEvent.id).toBe(1);
        expect((await fplApiCache.getSelectionGameweekData())?.fplEvent.id).toBe(2);
    });
});

/**
 * A characterization test, written to justify a deletion rather than to drive a change.
 *
 * `transfers.route.tsx` rolled its own selection gameweek -- `isPastDeadline ? id + 1 : id`
 * on top of the scoring one -- because there was no accessor for the question it was
 * asking. This pins that the accessor agrees at every point in the cycle.
 *
 * It runs on a fake clock, because naming four dates in a real season needs one. That is
 * also why it cannot speak to staleness: the gate recomputes the flags here. The frozen
 * case is covered on the production clock above, and neither accessor reads those flags
 * any more in any case.
 */
describe('the selection gameweek matches what transfers used to compute by hand', () => {
    const events = fplBootstrap().events as EventData[];
    const handRolled = (scoring: GameWeekData, at: Date) =>
        at > new Date(scoring.fplEvent.deadline_time) ? scoring.fplEvent.id + 1 : scoring.fplEvent.id;

    it.each([
        ['before the first deadline', '2024-08-16T12:00:00Z'],
        ['mid match weekend', '2024-08-17T14:00:00Z'],
        ['the day before the next deadline', '2024-08-23T12:00:00Z'],
        ['mid season', '2025-01-10T00:00:00Z'],
    ])('agrees %s', async (_when, iso) => {
        await seedEvents(getGameweekData(events, new Date('2024-08-16T18:00:00Z')));
        setNow(iso);

        const scoring = await fplApiCache.getScoringGameweekData();
        const selection = await fplApiCache.getSelectionGameweekData();

        expect(selection?.fplEvent.id).toBe(handRolled(scoring as GameWeekData, new Date(iso)));
    });
});
