import type { FplPlayerData, PlayerData, FplPlayerGameweekData } from "../../types";

export interface RefreshOptions {
    forceFullRefresh?: boolean;
    clearAll?: boolean;
    specificGameweeks?: number[];
    useCacheFirst?: boolean;
    quickRefresh?: boolean;
    skipCaching?: boolean;
}

export interface CacheMetadata {
    version: string;
    lastUpdated: Date | { seconds: number; nanoseconds: number };
    currentGameweek: number;
    totalPlayers: number;
    lastFullRefresh: Date | { seconds: number; nanoseconds: number };
    gameweeksProcessed: number[];
}

export interface PlayerGameweekCache {
    [gameweek: string]: {
        data: FplPlayerGameweekData;
        pointsBreakdown: any;
        isFinal: boolean;
        lastUpdated: Date | { seconds: number; nanoseconds: number };
    };
}

export interface CacheOperationStatus {
    operationType: 'quick_refresh' | 'full_refresh' | 'clear_rebuild';
    status: 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    progress?: {
        currentStep: string;
        playersProcessed?: number;
        totalPlayers?: number;
    };
    error?: string;
}

export interface EnhancedPlayerData extends FplPlayerData {
    team_name: string;
    position_name: string;
    custom_points: number;
    points_breakdown: any;
    player_info?: PlayerData;
    gameweek_data?: FplPlayerGameweekData[];
}

export interface CachedPlayerData extends EnhancedPlayerData {
    cached_at: Date | { seconds: number; nanoseconds: number };
    cache_version: string;
    gameweeks: PlayerGameweekCache; // All gameweeks in one document
}

export interface PlayerStatsData {
    players: EnhancedPlayerData[];
    teams: Record<number, string>;
    positions: Record<string, string>;
    cacheStatus?: {
        isRefreshing: boolean;
        operationType?: string;
        progress?: {
            currentStep: string;
            playersProcessed?: number;
            totalPlayers?: number;
        };
    };
}
