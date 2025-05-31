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


export interface EnhancedPlayerData {
    // FPL base data
    id: number;
    code: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
    team_name: string;
    element_type: number;
    position_name: string;
    status: string;
    photo: string;
    now_cost: number;
    cost_change_start: number;
    cost_change_event: number;
    form: number;
    points_per_game: number;
    selected_by_percent: number;
    transfers_in: number;
    transfers_out: number;
    transfers_in_event: number;
    transfers_out_event: number;
    total_points: number;
    event_points: number;

    // Season stats for table display
    stats: {
        minutesPlayed: number;
        goals: number;
        assists: number;
        cleanSheets: number;
        goalsConceded: number;
        penaltiesSaved: number;
        yellowCards: number;
        redCards: number;
        saves: number;
        bonus: number;
    }

    // Custom calculated data
    custom_points: number;
    points_breakdown: {
        minutesPlayed: number;
        goals: number;
        assists: number;
        cleanSheets: number;
        goalsConceded: number;
        penaltiesSaved: number;
        yellowCards: number;
        redCards: number;
        saves: number;
        bonus: number;
        total: number;
    };

    // Pre-calculated explanations for tooltip
    points_explanations: {
        minutesPlayed: string[];
        goals: string;
        assists: string;
        cleanSheets: string;
        goalsConceded: string[];
        penaltiesSaved: string;
        yellowCards: string;
        redCards: string;
        saves: string[];
        bonus: string;
    };

    // Additional data
    player_info: any; // Your PlayerData type from sheets
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
