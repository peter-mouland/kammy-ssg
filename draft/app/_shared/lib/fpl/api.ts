/* Location: app/_shared/lib/fpl/api.ts */
/* Responsibility: our fantasy.premierleague.com data fetching interface */
/* Notes: */
/* - 100% of use-cases should use api-firestore or api-cache */

import { processBatched } from '../batch-processor';
import { createAppError } from '../sheets/utils/common';
import type { FplBootstrapData, FplFixtureData, FplLiveData, FplPlayerSeasonData } from './fpl-types';

// FPL API endpoints
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const FPL_BOOTSTRAP_URL = `${FPL_BASE_URL}/bootstrap-static/`;
const FPL_FIXTURES_URL = `${FPL_BASE_URL}/fixtures/`;
const FPL_PLAYER_DETAIL_URL = (playerId: number) => `${FPL_BASE_URL}/element-summary/${playerId}/`;
const FPL_GAMEWEEK_LIVE_URL = (gameweek: number) => `${FPL_BASE_URL}/event/${gameweek}/live/`;
const _FPL_ENTRY_URL = (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/`;
const _FPL_ENTRY_HISTORY_URL = (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/history/`;

/**
 * FPL API Client - pure data fetching from FPL endpoints
 * No caching or orchestration logic, just HTTP requests
 */
class FplApi {
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
            throw createAppError('FPL_API_ERROR', `Failed to fetch data from FPL API: ${url}`, error);
        }
    }

    /**
     * Get FPL bootstrap data (with basic in-memory cache)
     */
    async getFplBootstrapData(): Promise<FplBootstrapData> {
        try {
            const data = await this.fetchFplData<FplBootstrapData>(FPL_BOOTSTRAP_URL);
            return data;
        } catch (error) {
            throw createAppError('FPL_BOOTSTRAP_ERROR', 'Failed to fetch FPL bootstrap data', error);
        }
    }

    /**
     * Get FPL bootstrap data (with basic in-memory cache)
     */
    async getFplFixtureData(): Promise<FplFixtureData[]> {
        try {
            const data = await this.fetchFplData<FplFixtureData[]>(FPL_FIXTURES_URL);
            return data;
        } catch (error) {
            throw createAppError('FPL_FIXTURES_ERROR', 'Failed to fetch FPL fixture data', error);
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
                error,
            );
        }
    }

    /**
     * Get live data for all players in a specific gameweek
     */
    async getGameweekLiveData(gameweek: number): Promise<FplLiveData> {
        try {
            const url = FPL_GAMEWEEK_LIVE_URL(gameweek);
            return await this.fetchFplData<FplLiveData>(url);
        } catch (error) {
            throw createAppError(
                'FPL_GAMEWEEK_LIVE_ERROR',
                `Failed to fetch live data for gameweek: ${gameweek}`,
                error,
            );
        }
    }

    async getBatchPlayerDetailedStats(playerIds: number[]): Promise<Record<number, FplPlayerSeasonData>> {
        const freshData: Record<number, FplPlayerSeasonData> = {};

        if (playerIds.length > 0) {
            const fetchPlayer = async (playerId: number) => {
                try {
                    const playerData = await fplApi.getPlayerDetailedStats(playerId);
                    return { playerId, playerData };
                } catch (error) {
                    console.error(`Failed to fetch player ${playerId}:`, error);
                    return { playerId, playerData: null };
                }
            };

            const results = await processBatched(playerIds, fetchPlayer, {
                batchSize: 50,
                maxConcurrent: 10,
                logProgress: true,
            });

            // Convert results to freshData object
            results.forEach(({ playerId, playerData }) => {
                if (playerData) {
                    freshData[playerId] = playerData;
                }
            });
            return freshData;
        }
        return {};
    }
}

// Export a singleton instance for easy use
export const fplApi = new FplApi();

// Export the class for testing or multiple instances
