import { getFplBootstrapData } from "./fpl/api";
import type { FplTeamData } from "../types";
import type { RefreshOptions, PlayerStatsData } from './cache/types';
import { getCacheOperationStatus } from './cache/operations';
import { getCachedPlayerStatsData, cachePlayerStatsData } from './cache/storage';
import { generateFreshPlayerData } from './cache/data-generator';
import { refreshPlayerCache, clearStuckOperations } from './cache/refresh';

// Re-export types for backward compatibility
export type {
    RefreshOptions,
    PlayerStatsData,
    EnhancedPlayerData,
    CacheOperationStatus
} from './cache/types';

// Main function - uses cache by default
export async function getPlayerStatsData(options: RefreshOptions = {}): Promise<PlayerStatsData> {
    const { useCacheFirst = true, ...refreshOptions } = options;

    try {
        // Check if cache operation is currently running
        const operationStatus = await getCacheOperationStatus();
        const isRefreshing = operationStatus?.status === 'running';

        // If cache is being refreshed, return cached data with status
        if (isRefreshing && useCacheFirst) {
            console.log('Cache refresh in progress, getting cached data');
            const cachedData = await getCachedPlayerStatsData();

            if (cachedData) {
                console.log('...returning cached data');
                return {
                    ...cachedData,
                    cacheStatus: {
                        isRefreshing: true,
                        operationType: operationStatus?.operationType,
                        progress: operationStatus?.progress
                    }
                };
            } else {
                // No cached data available during refresh - this happens during "Clear & Rebuild"
                // Generate fresh data without caching it (since refresh is in progress)
                console.log('No cached data available during refresh, generating fresh player data');
                const { players, currentGameweek } = await generateFreshPlayerData({
                    useCacheFirst: false,
                    // Don't cache during this call since refresh is in progress
                    skipCaching: true
                });

                console.log('getting getFplBootstrapData');
                const bootstrapData = await getFplBootstrapData();

                console.log('...returning fresh data');
                return {
                    players,
                    teams: bootstrapData.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
                        acc[team.id] = team.name;
                        return acc;
                    }, {}),
                    positions: {
                        'gk': 'gk',
                        'cb': 'cb',
                        'fb': 'fb',
                        'mid': 'mid',
                        'wa': 'wa',
                        'ca': 'ca'
                    },
                    cacheStatus: {
                        isRefreshing: true,
                        operationType: operationStatus?.operationType,
                        progress: operationStatus?.progress
                    }
                };
            }
        }

        // Try to get cached data first (unless explicitly disabled)
        if (useCacheFirst && !refreshOptions.forceFullRefresh && !refreshOptions.clearAll && !isRefreshing) {
            console.log('useCacheFirst: ' + useCacheFirst + ' or force refresh, getting cached data');
            const cachedData = await getCachedPlayerStatsData();
            if (cachedData) {
                console.log('Returning cached player stats data');
                return {
                    ...cachedData,
                    cacheStatus: {
                        isRefreshing: false
                    }
                };
            }
            console.log('Cache miss or invalid, generating fresh data');
        }

        // Generate fresh data
        console.log('Generating fresh player data');
        const { players, currentGameweek } = await generateFreshPlayerData(refreshOptions);

        console.log('getting getFplBootstrapData');
        const bootstrapData = await getFplBootstrapData();

        const result: PlayerStatsData = {
            players,
            teams: bootstrapData.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
                acc[team.id] = team.name;
                return acc;
            }, {}),
            positions: {
                'gk': 'gk',
                'cb': 'cb',
                'fb': 'fb',
                'mid': 'mid',
                'wa': 'wa',
                'ca': 'ca'
            },
            cacheStatus: {
                isRefreshing: false
            }
        };

        // Cache the fresh data (unless it was a specific gameweek update or skip caching is requested)
        if (!refreshOptions.specificGameweeks && !refreshOptions.skipCaching) {
            console.log('...caching fresh data');
            await cachePlayerStatsData(result, currentGameweek);
        }

        console.log('...returning fresh data');
        return result;

    } catch (error) {
        console.error('Error in getPlayerStatsData:', error);
        throw error;
    }
}

// Export cache refresh function
export { refreshPlayerCache };

// Export function to get cache operation status (for API routes)
export { getCacheOperationStatus as getCacheRefreshStatus };

// Export function to clear stuck operations
export { clearStuckOperations };
