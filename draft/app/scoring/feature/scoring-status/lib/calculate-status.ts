// Calculate scoring status based on fixture and gameweek data

import type { ScoringStatus, ScoringStatusInput, ScoringStatusResult } from '../types';

/**
 * How fresh are the published points for the gameweek being played?
 *
 * - `stale` (RED) -- something has happened since the last run: a match kicked off after
 *   it, or a match is in play right now and its points are still moving.
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

    const startedSinceLastRun = gameweekFixtures.some(
        (fixture) => fixture.started && new Date(fixture.kickoff_time).getTime() > lastGeneratedTime,
    );
    // A match in play makes the published points wrong no matter when they were generated:
    // they keep moving for 90 minutes, and bonus lands after the whistle.
    const inPlay = gameweekFixtures.some((fixture) => fixture.started && !fixture.finished);
    // An empty list is "nothing loaded", not "everything done", so it must not read green.
    const allFinished = gameweekFixtures.length > 0 && gameweekFixtures.every((fixture) => fixture.finished);

    let status: ScoringStatus;
    if (startedSinceLastRun || inPlay) {
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
