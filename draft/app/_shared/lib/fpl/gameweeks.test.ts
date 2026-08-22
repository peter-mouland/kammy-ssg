/* Location: app/_shared/lib/fpl/gameweeks.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { fplBootstrap } from '../../test/fixtures/season-fixtures';
import { setNow } from '../clock';
import type { EventData, GameWeekData } from './fpl-types';
import { findScoringGameweek, getGameweekData, recomputeGameweekFlags } from './gameweeks';

/**
 * Which gameweek is "current" decides what almost every page shows, and until now nothing
 * asserted it (G7). These run against the **real** 2024/25 event calendar from the
 * fixtures rather than invented deadlines, because the thing worth catching is the
 * behaviour at the actual dates the harness scenarios use.
 *
 * The definition under test: a gameweek is current from the PREVIOUS gameweek's deadline
 * until its own -- the window in which you pick that gameweek's team. It is not the window
 * its matches are played, and it is not the same as FPL's `is_current`.
 */

const events = fplBootstrap().events as EventData[];

const currentIdAt = (iso: string) =>
    getGameweekData(events, new Date(iso)).find((gw) => gw.isCurrent)?.fplEvent.id ?? 0;

afterEach(() => setNow(null));

describe('which gameweek is current', () => {
    it('is GW1 up to its own deadline', () => {
        // GW1's deadline is 2024-08-16T17:30Z.
        expect(currentIdAt('2024-08-16T12:00:00Z')).toBe(1);
    });

    it('moves to GW2 the moment GW1’s deadline passes', () => {
        expect(currentIdAt('2024-08-16T18:00:00Z')).toBe(2);
    });

    it('is GW21 in the window that closes at GW21’s deadline', () => {
        // GW20 deadline 2025-01-04T11:00Z -> GW21 deadline 2025-01-14T18:00Z.
        expect(currentIdAt('2025-01-10T00:00:00Z')).toBe(21);
    });

    it('is GW23 on 2025-01-20, not GW21', () => {
        // Worth pinning: the harness plan's scenario table assumed GW21 for this date.
        // GW21's deadline had already passed on the 14th and GW22's on the 18th.
        expect(currentIdAt('2025-01-20T00:00:00Z')).toBe(23);
    });

    it('has no current gameweek once the final deadline has passed', () => {
        // GW38's deadline is 2025-05-25T13:30Z. Callers fall back to FPL's frozen
        // `is_current` here, which is GW38 -- see `getScoringGameweekData()`.
        expect(currentIdAt('2025-05-26T00:00:00Z')).toBe(0);
    });

    it('treats any date before the first deadline as GW1, including deep pre-season', () => {
        // GW1's window opens at a hardcoded floor, so there is no "no gameweek yet" state
        // at the start of a season -- only at the end of one. The plan's `preseason`
        // scenario expected an empty state and does not get one.
        expect(currentIdAt('2024-08-01T00:00:00Z')).toBe(1);
    });

    it('has exactly one current gameweek at any date in the season', () => {
        const current = getGameweekData(events, new Date('2025-01-10T00:00:00Z')).filter((gw) => gw.isCurrent);

        expect(current).toHaveLength(1);
    });
});

describe('the flags that describe the rest of the season', () => {
    const at = (iso: string) => getGameweekData(events, new Date(iso));

    it('marks every gameweek before the current one as passed', () => {
        const gameweeks = at('2025-01-10T00:00:00Z'); // GW21 current

        expect(gameweeks.filter((gw) => gw.hasPassed)).toHaveLength(20);
        expect(gameweeks.find((gw) => gw.fplEvent.id === 20)?.hasPassed).toBe(true);
        expect(gameweeks.find((gw) => gw.fplEvent.id === 22)?.hasPassed).toBe(false);
    });

    it('marks the gameweek after the current one as next', () => {
        const next = at('2025-01-10T00:00:00Z').find((gw) => gw.isNext);

        expect(next?.fplEvent.id).toBe(22);
    });

    it('marks the whole season as passed once it is over', () => {
        expect(at('2025-05-26T00:00:00Z').every((gw) => gw.hasPassed)).toBe(true);
    });

    it('runs a gameweek’s window from the previous deadline to its own', () => {
        const gw21 = at('2025-01-10T00:00:00Z').find((gw) => gw.fplEvent.id === 21);

        expect(gw21?.start.toISOString()).toBe('2025-01-04T11:00:00.000Z'); // GW20's deadline
        expect(gw21?.end.toISOString()).toBe('2025-01-14T18:00:00.000Z'); // its own
    });
});

describe('recomputing flags on stored gameweeks', () => {
    // The stored documents were built once and their flags frozen at that moment. This is
    // what unfreezes them on read, and it is the only reason the season moves at all in
    // the harness.
    it('moves the current gameweek without rebuilding the list', () => {
        const stored = getGameweekData(events, new Date('2024-08-16T12:00:00Z'));
        expect(stored.find((gw) => gw.isCurrent)?.fplEvent.id).toBe(1);

        const later = recomputeGameweekFlags(stored, new Date('2025-01-10T00:00:00Z'));

        expect(later.find((gw) => gw.isCurrent)?.fplEvent.id).toBe(21);
    });

    it('survives start and end arriving as ISO strings, as they do from Firestore', () => {
        const stored = getGameweekData(events, new Date('2024-08-16T12:00:00Z'));
        // A Firestore round trip turns the Dates into strings; nothing re-hydrates them
        // before this runs.
        const asStored = JSON.parse(JSON.stringify(stored));

        const later = recomputeGameweekFlags(asStored, new Date('2025-01-10T00:00:00Z'));

        expect(later.find((gw) => gw.isCurrent)?.fplEvent.id).toBe(21);
    });

    it('leaves the underlying event data alone', () => {
        const stored = getGameweekData(events, new Date('2024-08-16T12:00:00Z'));

        const later = recomputeGameweekFlags(stored, new Date('2025-01-10T00:00:00Z'));

        expect(later).toHaveLength(38);
        expect(later[0].fplEvent.name).toBe(stored[0].fplEvent.name);
    });
});

describe('taking the date from the clock', () => {
    it('defaults to whatever the clock says, so callers need not thread a date', () => {
        setNow('2025-01-10T00:00:00Z');

        expect(getGameweekData(events).find((gw) => gw.isCurrent)?.fplEvent.id).toBe(21);
    });
});

/**
 * The other question, and the one every points page is actually asking: which gameweek's
 * matches are being played? That is one BEHIND `isCurrent` for the whole of every match
 * weekend, because `isCurrent` is the window in which you pick the NEXT team.
 *
 * Confusing the two is what emptied the gameweek table and both team views on 2026-08-22:
 * GW1 was being played, the site defaulted every points view to GW2, and GW2's matches
 * were still a week away.
 */
describe('which gameweek is being played', () => {
    const scoringIdAt = (iso: string) =>
        findScoringGameweek(getGameweekData(events, new Date(iso)), new Date(iso))?.fplEvent.id ?? 0;

    it('is GW1 through GW1’s match weekend, while isCurrent has already moved to GW2', () => {
        // GW1's deadline is 2024-08-16T17:30Z; its matches run across the weekend after it.
        expect(scoringIdAt('2024-08-17T14:00:00Z')).toBe(1);
        expect(currentIdAt('2024-08-17T14:00:00Z')).toBe(2);
    });

    it('is GW20 on 2025-01-10, the gameweek isCurrent calls 21', () => {
        // GW20's deadline 2025-01-04T11:00Z has passed; GW21's 2025-01-14T18:00Z has not.
        expect(scoringIdAt('2025-01-10T00:00:00Z')).toBe(20);
        expect(currentIdAt('2025-01-10T00:00:00Z')).toBe(21);
    });

    it('holds on the last gameweek once the season is over, rather than going blank', () => {
        // GW38's deadline is 2025-05-25T13:30Z. There are final standings to show.
        expect(scoringIdAt('2025-05-26T00:00:00Z')).toBe(38);
    });

    it('is GW1 before the first deadline, so pre-season renders squads not an error', () => {
        expect(scoringIdAt('2024-08-01T00:00:00Z')).toBe(1);
    });

    it('has nothing to return when the calendar has not been loaded', () => {
        // Distinct from every state above: an empty Firestore must still be explainable.
        expect(findScoringGameweek([], new Date('2025-01-10T00:00:00Z'))).toBeUndefined();
    });

    it('survives end arriving as an ISO string, as it does from Firestore', () => {
        const stored: GameWeekData[] = JSON.parse(
            JSON.stringify(getGameweekData(events, new Date('2024-08-17T14:00:00Z'))),
        );

        expect(findScoringGameweek(stored, new Date('2024-08-17T14:00:00Z'))?.fplEvent.id).toBe(1);
    });

    it('defaults to whatever the clock says, so callers need not thread a date', () => {
        setNow('2024-08-17T14:00:00Z');

        expect(findScoringGameweek(getGameweekData(events))?.fplEvent.id).toBe(1);
    });
});
