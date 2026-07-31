/* Location: app/cup/lib/cup-deadlines.ts */

// Aliased because both functions below take a parameter called `now`, which would shadow
// the import inside its own default expression.
import { now as clockNow } from '../../_shared/lib/clock';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';

/**
 * Deadline + visibility rules for the cup. Deadlines come from the configured
 * gameweek's FPL deadline (GameWeekData.end), matching the rest of the site —
 * no cup-specific deadline data exists.
 *
 * These already took an injected `now`; only the default changed, from the real date to
 * the clock. That is the pattern for every other date decision in the app.
 */

/** The gameweek deadline has passed; submissions are locked. */
export function isDeadlinePassed(gameweek: GameWeekData, now: Date = clockNow()): boolean {
    return now.getTime() >= new Date(gameweek.end).getTime();
}

/** Submissions are open between the previous deadline and this gameweek's deadline. */
export function isSubmissionOpen(gameweek: GameWeekData, now: Date = clockNow()): boolean {
    const start = new Date(gameweek.start).getTime();
    const end = new Date(gameweek.end).getTime();
    const current = now.getTime();
    return current >= start && current < end;
}

/**
 * A manager's team is revealed publicly only once BOTH the deadline has passed
 * AND their substitutions are confirmed. Confirmation gates reveal because a
 * pending sub could still change the team, so showing it early would be wrong.
 */
export function isTeamRevealed(params: { deadlinePassed: boolean; subsConfirmed: boolean }): boolean {
    return params.deadlinePassed && params.subsConfirmed;
}

/** The two-legged aggregate is only shown once both legs are individually revealed. */
export function isAggregateRevealed(legRevealed: boolean[]): boolean {
    return legRevealed.length > 0 && legRevealed.every(Boolean);
}
