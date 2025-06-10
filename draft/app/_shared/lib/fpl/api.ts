// src/lib/fpl/api.ts
import type {
    FplBootstrapData,
    FplPlayerData
} from '../../types';
import { createAppError } from '../sheets/utils/common';

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

}

// Export a singleton instance for easy use
export const fplApi = new FplApi();

// Export the class for testing or multiple instances
export default FplApi;
