// Scoring status types

/**
 * Represents the freshness status of scoring data
 *
 * - 'up-to-date': Gameweek is finished and all scores have been generated
 * - 'pending': Gameweek not finished yet, no new games have started since last generation
 * - 'stale': New games have started since last score generation - scores need updating
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
    isGameweekFinished: boolean;
    fixtures: Array<{
        event: number;
        started: boolean;
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
