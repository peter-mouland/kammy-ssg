import { now } from '../clock';
import type { EventData, GameWeekData } from './fpl-types';

/**
 * A gameweek's window runs from the **previous** gameweek's deadline to its own.
 *
 * So GW21 is "current" from GW20's deadline until GW21's deadline -- the period in which
 * you pick a GW21 team -- not the period its matches are played. That is the app's own
 * definition and it differs from FPL's `is_current`, which tracks matches in progress.
 * Both are used; see `getCurrentGameweekData()` in `api-cache.ts` for which wins where.
 */
function isCurrentAt(start: Date, end: Date, at: Date): boolean {
    return at < end && at > start;
}

/**
 * `isCurrent` / `isNext` / `hasPassed` for a list of gameweeks, at a given time.
 *
 * The three are derived together because they are defined in terms of each other: `isNext`
 * is "the one after the current one" and `hasPassed` is "before we reached the current
 * one", so computing any of them alone would produce a set that disagrees with itself.
 */
function withFlagsAt<T extends { start: Date; end: Date }>(gameweeks: T[], at: Date): T[] {
    let hasHadCurrent = false;
    let isNext = false;

    return gameweeks.map((gameweek) => {
        const isCurrent = isCurrentAt(new Date(gameweek.start), new Date(gameweek.end), at);
        const flagged = { ...gameweek, isCurrent, isNext, hasPassed: !hasHadCurrent && !isCurrent };

        isNext = isCurrent;
        hasHadCurrent = isCurrent || hasHadCurrent;

        return flagged;
    });
}

/** Build the app's gameweek list from FPL's raw events. */
export const getGameweekData = (fplEvents: EventData[], at: Date = now()): GameWeekData[] => {
    const windows = fplEvents.map((event, i) => ({
        fplEvent: {
            deadline_time: event.deadline_time,
            finished: event.finished,
            id: event.id,
            is_current: event.is_current,
            is_next: event.is_next,
            name: event.name,
        },
        gameWeekIndex: i,
        start: new Date(fplEvents[i - 1]?.deadline_time || '2023-07-30T11:00:00.000Z'),
        end: new Date(event.deadline_time),
        isCurrent: false,
        isNext: false,
        hasPassed: false,
    }));

    return withFlagsAt(windows, at);
};

/**
 * Re-derive the flags on an already-built gameweek list.
 *
 * Needed because these are **stored**: `populateEvents` runs `getGameweekData` once and
 * writes the result to Firestore, so the flags are frozen at whenever that ran. Applying
 * this on read -- outside the 4h `fpl:events` cache callback -- is what makes the current
 * gameweek follow the clock rather than the last population, and what lets one server
 * answer two requests at two different dates.
 *
 * `start` and `end` arrive as ISO strings from Firestore rather than Dates, which is why
 * `withFlagsAt` re-wraps them.
 */
export function recomputeGameweekFlags(gameweeks: GameWeekData[], at: Date = now()): GameWeekData[] {
    return withFlagsAt(gameweeks, at);
}
