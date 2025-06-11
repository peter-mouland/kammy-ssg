// src/lib/firestore-cache/types.ts
export interface CacheDocument {
    id: string;
    data: unknown;
    lastUpdated: string; // ISO string
    source: 'fpl' | 'sheets' | 'enhanced';
}

export interface FplEndpointDocument extends CacheDocument {
    source: 'fpl';
    endpoint: string;
    data: unknown;
}

export interface PlayerSeasonDocument extends CacheDocument {
    source: 'enhanced';
    playerId: number;
    season: string;
    data: {
        information: unknown;
        stats: unknown;
        pointsBreakdown: unknown;
    };
}

export interface PlayerGameweekDocument extends CacheDocument {
    source: 'enhanced';
    playerId: number;
    gameweek: number;
    season: string;
    data: {
        stats: unknown;
        points: unknown;
    };
}

export interface CacheState {
    isUpdating: boolean;
    lastFullUpdate: string | null;
    activeOperations: Set<string>;
}
// src/lib/firestore-cache/types.ts - Add these to your existing types

export interface GameweekPointsMetadata extends CacheDocument {
    source: 'enhanced';
    data: {
        lastGeneratedGameweek: number;
        lastGeneratedAt: string;
        currentGameweek: number;
        generationHistory: Array<{
            gameweek: number;
            generatedAt: string;
            playerCount: number;
            type: 'full' | 'selective';
        }>;
    };
}

// Extend your existing EnhancedPlayerData type to include generation metadata
export interface EnhancedPlayerDataWithMetadata extends EnhancedPlayerData {
    draft: {
        position: string;
        pointsTotal: number;
        pointsBreakdown: any;
        // Add metadata about generation
        __generatedFor?: {
            gameweeks?: number[];
            generatedAt: string;
            type: 'selective' | 'full';
        };
    };
}

// Add these types to your existing types.ts file

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
    bonus: number;

    // Match info
    opponent: number;
    opponentName: string;
    wasHome: boolean;
    teamHScore: number;
    teamAScore: number;

    // Points breakdown
    customPoints: {
        appearance: number;
        goals: number;
        assists: number;
        cleanSheets: number;
        goalsConceded: number;
        yellowCards: number;
        redCards: number;
        saves: number;
        penaltiesSaved: number;
        bonus: number;
        total: number;
    } | null;

    // FPL original points
    fplPoints: number;

    // Metadata
    generatedAt: string | null;
}

export interface PlayerDetailData {
    player: FplPlayerData;
    team: {
        id: number;
        name: string;
        short_name: string;
    };
    position: string;
    gameweekStats: GameweekStatWithPoints[];
    seasonTotals: {
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
        bonus: number;

        // Points
        totalFplPoints: number;
        totalCustomPoints: number;

        // Averages
        averageMinutes: number;
        averageFplPoints: number;
        averageCustomPoints: number;

        // Performance metrics
        goalsPerGame: number;
        assistsPerGame: number;
        cleanSheetPercentage: number;
    };
    currentGameweek: number;
}
