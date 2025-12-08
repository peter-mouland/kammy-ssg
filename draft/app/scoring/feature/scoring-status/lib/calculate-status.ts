// Calculate scoring status based on fixture and gameweek data

import type { ScoringStatus, ScoringStatusInput, ScoringStatusResult } from '../types';

/**
 * Calculate the scoring status based on gameweek fixtures and last generation time
 *
 * Logic:
 * 1. If games have started since last generation -> 'stale' (RED)
 * 2. If gameweek is finished -> 'up-to-date' (GREEN)
 * 3. Otherwise -> 'pending' (ORANGE)
 */
export function calculateScoringStatus(input: ScoringStatusInput): ScoringStatusResult {
    const { lastGenerated, currentGameweekNumber, isGameweekFinished, fixtures } = input;

    // Get the timestamp of last generation, or 0 if never generated
    const lastGeneratedTime = lastGenerated ? new Date(lastGenerated).getTime() : 0;

    // Filter fixtures to only current gameweek
    const currentGameweekFixtures = fixtures.filter((f) => f.event === currentGameweekNumber);

    // Check if any fixtures in current gameweek have started since last generation
    const hasGamesStartedSinceUpdate = currentGameweekFixtures.some((fixture) => {
        if (!fixture.started) return false;
        const kickoffTime = new Date(fixture.kickoff_time).getTime();
        return kickoffTime > lastGeneratedTime;
    });

    // Determine score status based on conditions
    let status: ScoringStatus;
    if (hasGamesStartedSinceUpdate) {
        // New games have been played - scores are stale
        status = 'stale';
    } else if (isGameweekFinished) {
        // Gameweek is finished and no new games started - scores are up to date
        status = 'up-to-date';
    } else {
        // Gameweek not finished yet, but no new games - scores are pending
        status = 'pending';
    }

    return {
        status,
        lastGenerated,
    };
}
