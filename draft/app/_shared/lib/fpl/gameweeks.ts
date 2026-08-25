import { now } from '../clock';
import type { EventData, GameWeekData } from './fpl-types';

/**
 * A gameweek's window runs from the **previous** gameweek's deadline to its own.
 *
 * So GW21 is "current" from GW20's deadline until GW21's deadline -- the period in which
 * you pick a GW21 team -- not the period its matches are played. That is the app's own
 * definition and it differs from FPL's `is_current`, which tracks matches in progress.
 *
 * Both questions get asked, so both have a function. This one answers "which team is being
 * picked" and backs `getSelectionGameweekData()`; `findScoringGameweek()` below answers
 * "which matches are being played" and backs `getScoringGameweekData()`. Reaching for the
 * wrong one is not a subtle bug -- it points every page at a gameweek nobody has played.
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

/**
 * The gameweek whose matches are being played, or were played most recently.
 *
 * This is a different question from `isCurrent` above, and the distinction is the whole
 * point of having two functions. `isCurrent` is the window in which you pick a team, so it
 * moves to GW21 the instant GW20's deadline passes -- while GW20's matches are still to be
 * played. Points pages want the other one.
 *
 * It is what FPL's own `is_current` means, re-derived from the clock rather than read from
 * the stored events, whose flags are frozen at whenever `populateEvents` last ran and only
 * move when an admin repopulates bootstrap data.
 *
 * Before the first deadline nothing has been played; GW1 is returned so pre-season renders
 * squads rather than an error. An empty calendar returns `undefined`, which is what lets
 * `describeGameweekAvailability` tell "nobody has loaded the data" apart from every other
 * state.
 *
 * Assumes `gameweeks` is in deadline order, as FPL's bootstrap gives it. That survives
 * Firestore because the events are one document holding an array, not a document each --
 * if that ever changes, this and `findSelectionGameweek` both need a sort.
 */
export function findScoringGameweek<T extends { end: Date | string }>(gameweeks: T[], at: Date = now()): T | undefined {
    const played = gameweeks.filter((gameweek) => new Date(gameweek.end) <= at);

    return played.at(-1) ?? gameweeks[0];
}

/**
 * The gameweek a team is being picked for: the first whose deadline has not passed.
 *
 * The mirror of `findScoringGameweek`, and derived from the clock for the same reason. The
 * stored `isCurrent` says this too, but only as of whenever `populateEvents` last ran, and
 * nothing runs it on a schedule -- so reading it offers managers whichever round was open
 * the last time an admin pressed the button.
 *
 * Returns `undefined` once the final deadline has passed. There is no team left to pick,
 * and saying so lets `describeGameweekAvailability` explain the end of the season instead
 * of callers inventing a gameweek 39.
 */
export function findSelectionGameweek<T extends { end: Date | string }>(
    gameweeks: T[],
    at: Date = now(),
): T | undefined {
    return gameweeks.find((gameweek) => new Date(gameweek.end) > at);
}
