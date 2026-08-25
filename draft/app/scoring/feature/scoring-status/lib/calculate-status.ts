// Calculate scoring status based on fixture and gameweek data

import type { ScoringStatus, ScoringStatusInput, ScoringStatusResult } from '../types';

/**
 * Kickoff to bonus confirmed: 90 minutes, plus half time, plus stoppage, plus the delay
 * before FPL settles the bonus points. Deliberately generous -- being early by an hour
 * costs an admin an orange badge they can ignore, being late by a minute tells them there
 * is nothing to do when there is.
 *
 * This also sidesteps needing to know whether FPL flips a fixture's `finished` at the
 * whistle or after bonus, which nothing here has established.
 */
const MATCH_WINDOW_MS = 2.5 * 60 * 60 * 1000;

/**
 * How fresh are the published points for the gameweek being played?
 *
 * - `stale` (RED) -- some match in the gameweek had not settled by the time points were
 *   last generated, whether it is still in play or has since finished.
 * - `up-to-date` (GREEN) -- every match in the gameweek is finished and nothing has
 *   happened since the last run.
 * - `pending` (ORANGE) -- the gameweek has not started, or has no fixtures loaded.
 *
 * All three are read from the FPL fixtures, which are fetched live. Whether the gameweek
 * is finished is deliberately NOT taken from the stored events document: those flags only
 * change when an admin repopulates bootstrap data, so that answer can be days out of date
 * in either direction -- and this badge is the only prompt an admin gets to re-run points.
 */
export function calculateScoringStatus(input: ScoringStatusInput): ScoringStatusResult {
    const { lastGenerated, currentGameweekNumber, fixtures } = input;

    const lastGeneratedTime = lastGenerated ? new Date(lastGenerated).getTime() : 0;
    const gameweekFixtures = fixtures.filter((fixture) => fixture.event === currentGameweekNumber);

    // Anchored to when a match SETTLES, not when it starts. Comparing against kickoff left
    // a hole: a run made at half time saw neither the result nor the bonus, but the moment
    // the match was marked finished nothing was left in play and the badge went green. It
    // also subsumes the in-play case, since a match that has started but not settled is
    // always within its own window.
    const settledSinceLastRun = gameweekFixtures.some(
        (fixture) => fixture.started && new Date(fixture.kickoff_time).getTime() + MATCH_WINDOW_MS > lastGeneratedTime,
    );
    // The window is an estimate, so it is not the only guard: a match FPL has not marked
    // finished is in play whatever the clock says, and its points are still moving.
    const inPlay = gameweekFixtures.some((fixture) => fixture.started && !fixture.finished);
    // An empty list is "nothing loaded", not "everything done", so it must not read green.
    const allFinished = gameweekFixtures.length > 0 && gameweekFixtures.every((fixture) => fixture.finished);

    let status: ScoringStatus;
    if (settledSinceLastRun || inPlay) {
        status = 'stale';
    } else if (allFinished) {
        status = 'up-to-date';
    } else {
        status = 'pending';
    }

    return {
        status,
        lastGenerated,
    };
}
