// Scoring status types

/**
 * How fresh the published points are for the gameweek being played.
 *
 * - 'up-to-date': every match in the gameweek is finished, and points were generated
 *   after the last of them settled
 * - 'pending': nothing to do yet -- the gameweek has not started, has no fixtures loaded,
 *   or the loader could not tell
 * - 'stale': a match had not settled by the time points were last generated, whether it is
 *   still in play or has since finished
 *
 * `calculateScoringStatus` is where the reasoning lives; keep this in step with it.
 */
export type ScoringStatus = 'up-to-date' | 'pending' | 'stale';

/**
 * Result of calculating scoring status
 */
export interface ScoringStatusResult {
    status: ScoringStatus;
    lastGenerated: string | null;
}

/**
 * Input data needed to calculate scoring status
 */
export interface ScoringStatusInput {
    lastGenerated: string | null;
    currentGameweekNumber: number;
    /**
     * The live FPL fixture list. Whether the gameweek has finished is derived from these
     * rather than passed in: the gameweek's own `finished` flag lives on the stored events
     * document and only moves when an admin repopulates bootstrap data.
     */
    fixtures: Array<{
        event: number;
        started: boolean;
        finished: boolean;
        kickoff_time: string;
    }>;
}

/**
 * Pending game information for display
 */
export interface PendingGame {
    id: number;
    homeTeam: string;
    awayTeam: string;
    kickoffTime: string;
}
