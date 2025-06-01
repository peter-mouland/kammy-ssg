// src/lib/fpl/api.ts
import type {
    FplBootstrapData,
    FplPlayerData
} from '../../../types';
import { createAppError } from '../sheets/common';

// FPL API endpoints
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const FPL_BOOTSTRAP_URL = `${FPL_BASE_URL}/bootstrap-static/`;
const FPL_PLAYER_DETAIL_URL = (playerId: number) => `${FPL_BASE_URL}/element-summary/${playerId}/`;
const FPL_GAMEWEEK_LIVE_URL = (gameweek: number) => `${FPL_BASE_URL}/event/${gameweek}/live/`;
const FPL_ENTRY_URL = (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/`;
const FPL_ENTRY_HISTORY_URL = (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/history/`;

// Type definitions for FPL API responses
export interface FplPlayerGameweekData {
    element: number; // player ID
    fixture: number;
    opponent_team: number;
    total_points: number;
    was_home: boolean;
    kickoff_time: string;
    team_h_score: number;
    team_a_score: number;
    round: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
}

export interface FplPlayerSeasonData {
    history: FplPlayerGameweekData[];
    history_past: any[];
    fixtures: any[];
}

/**
 * FPL API Client - pure data fetching from FPL endpoints
 * No caching or orchestration logic, just HTTP requests
 */
export class FplApi {
    private bootstrapCache: { data: FplBootstrapData | null; timestamp: number } = {
        data: null,
        timestamp: 0
    };
    private readonly CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

    /**
     * Fetch data from FPL API with error handling
     */
    private async fetchFplData<T>(url: string): Promise<T> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Fantasy Football Draft App)',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw createAppError(
                'FPL_API_ERROR',
                `Failed to fetch data from FPL API: ${url}`,
                error
            );
        }
    }

    /**
     * Get FPL bootstrap data (with basic in-memory cache)
     */
    async getFplBootstrapData(): Promise<FplBootstrapData> {
        const now = Date.now();

        if (this.bootstrapCache.data && (now - this.bootstrapCache.timestamp) < this.CACHE_DURATION) {
            return this.bootstrapCache.data;
        }

        try {
            const data = await this.fetchFplData<FplBootstrapData>(FPL_BOOTSTRAP_URL);

            this.bootstrapCache = {
                data,
                timestamp: now
            };

            return data;
        } catch (error) {
            throw createAppError(
                'FPL_BOOTSTRAP_ERROR',
                'Failed to fetch FPL bootstrap data',
                error
            );
        }
    }

    /**
     * Get player detailed stats for all gameweeks
     */
    async getPlayerDetailedStats(playerId: number): Promise<FplPlayerSeasonData> {
        try {
            const url = FPL_PLAYER_DETAIL_URL(playerId);
            return await this.fetchFplData<FplPlayerSeasonData>(url);
        } catch (error) {
            throw createAppError(
                'PLAYER_DETAILED_STATS_ERROR',
                `Failed to get detailed stats for player: ${playerId}`,
                error
            );
        }
    }

    async getBatchPlayerDetailedStats(playerIds: number[], delay: number = 50): Promise<Record<number, FplPlayerSeasonData>> {
        const results: Record<number, FplPlayerSeasonData> = {};

        for (const playerId of playerIds) {
            try {
                results[playerId] = await this.getPlayerDetailedStats(playerId);
                // Add delay to avoid rate limiting
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                console.error(`Failed to fetch gameweek data for player ${playerId}:`, error);
                // Continue with other players even if one fails
            }
        }

        return results;
    }
    /**
     * Get live gameweek data
     */
    async getLiveGameweekData(gameweek: number): Promise<any> {
        try {
            const url = FPL_GAMEWEEK_LIVE_URL(gameweek);
            return await this.fetchFplData(url);
        } catch (error) {
            throw createAppError(
                'LIVE_GAMEWEEK_ERROR',
                `Failed to get live data for gameweek: ${gameweek}`,
                error
            );
        }
    }

    /**
     * Get FPL entry (team) data
     */
    async getFplEntryData(entryId: number): Promise<any> {
        try {
            const url = FPL_ENTRY_URL(entryId);
            return await this.fetchFplData(url);
        } catch (error) {
            throw createAppError(
                'FPL_ENTRY_ERROR',
                `Failed to get FPL entry data: ${entryId}`,
                error
            );
        }
    }

    async getFplPlayers(): Promise<FplPlayerData[]> {
        try {
            const bootstrap = await this.getFplBootstrapData();
            return bootstrap.elements;
        } catch (error) {
            throw createAppError(
                'FPL_PLAYERS_ERROR',
                'Failed to get FPL players',
                error
            );
        }
    }

    /**
     * Get FPL player by ID
     */
    async getFplPlayer(playerId: number): Promise<FplPlayerData | null> {
        try {
            const players = await this.getFplPlayers();
            return players.find(player => player.id === playerId) || null;
        } catch (error) {
            throw createAppError(
                'FPL_PLAYER_ERROR',
                `Failed to get FPL player: ${playerId}`,
                error
            );
        }
    }

    async getTopPerformers(limit = 10): Promise<FplPlayerData[]> {
        try {
            const players = await this.getFplPlayers();
            return players
                .filter(player => player.minutes > 0)
                .sort((a, b) => b.total_points - a.total_points)
                .slice(0, limit);
        } catch (error) {
            throw createAppError(
                'TOP_PERFORMERS_ERROR',
                'Failed to get top performers',
                error
            );
        }
    }

    /**
     * Get FPL entry history
     */
    async getFplEntryHistory(entryId: number): Promise<any> {
        try {
            const url = FPL_ENTRY_HISTORY_URL(entryId);
            return await this.fetchFplData(url);
        } catch (error) {
            throw createAppError(
                'FPL_ENTRY_HISTORY_ERROR',
                `Failed to get FPL entry history: ${entryId}`,
                error
            );
        }
    }

    /**
     * Clear bootstrap cache (useful for testing or forced refresh)
     */
    clearBootstrapCache(): void {
        this.bootstrapCache = {
            data: null,
            timestamp: 0
        };
    }
}

// Export a singleton instance for easy use
export const fplApi = new FplApi();

// Export the class for testing or multiple instances
export default FplApi;
