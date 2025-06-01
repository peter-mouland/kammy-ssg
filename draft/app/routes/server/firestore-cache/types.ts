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
