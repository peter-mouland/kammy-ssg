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
