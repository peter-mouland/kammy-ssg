// app/scoring/types/scoring-types.ts

// ================================
// ENHANCED PLAYER DATA TYPES
// ================================

export interface GameweekStatWithPoints {
    gameweek: number;
    // Basic stats
    minutes: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    defensiveContribution: number;
    clearancesBlocksInterceptions: number;
    tackles: number;
    recoveries: number;

    // Match info
    opponent: number;
    opponentName: string;
    wasHome: boolean;
    teamHScore: number;
    teamAScore: number;

    // Points breakdown
    customPoints: number | null;

    // FPL original points
    fplPoints: number;

    // Metadata
    generatedAt: string | null;
}

export interface SeasonTotals {
    // Basic stats
    gamesPlayed: number;
    totalMinutes: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    defensiveContribution: number;

    // Points
    totalFplPoints: number;
    totalCustomPoints: number;

    // Averages
    averageMinutes: number;
    averageFplPoints: number;
    averageCustomPoints: number;

    form: number;

    // Performance metrics
    goalsPerGame: number;
    savesPerGame: number;
    assistsPerGame: number;
    cleanSheetPercentage: number;
    savesPerGamePercentage: number;
}
