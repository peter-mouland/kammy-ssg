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
