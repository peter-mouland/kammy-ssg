// app/_shared/lib/fpl/api-cache.ts
/* Responsibility: */
/* - the public interface to get fantasy.premierleague.com data */
/* - common helper functions e.g. data-transfers should live here */

import type { EnhancedPlayerData } from '../../../scoring/types/scoring-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { FplFirestore } from './fpl-firestore';
import type { FplPlayerSeasonData, FplTeam, GameWeekData } from './fpl-types';

interface Doc<T> {
    lastUpdated: string;
    source?: string;
    data: T;
}

/**
 * Updated FPL Data Orchestrator - Uses Individual Player Caching
 * Fixes cache key explosion by caching individual players instead of batches
 * Maintains performance with smart batching for cache misses
 */
export class FplApiCache {
    fplFirestore: FplFirestore;

    constructor() {
        this.fplFirestore = new FplFirestore();
    }

    // === BOOTSTRAP DATA ORCHESTRATION ===

    /**
     * Get all FPL players using unified cache
     */
    async getFplPlayers(): Promise<EnhancedPlayerData[]> {
        return await dataCache.get(
            CACHE_KEYS.FPL.PLAYERS,
            async () => {
                console.log('🔄 getFplPlayers() - Loading from Firestore');
                try {
                    const cached = await this.fplFirestore.getElements();
                    return cached;
                } catch (error) {
                    console.error('❌ getFplPlayers() - Error:', error);
                    throw error;
                }
            },
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.PLAYERS) },
        );
    }

    /**
     * Get FPL teams using unified cache
     */
    async getFplTeams() {
        return await dataCache.get(
            CACHE_KEYS.FPL.TEAMS,
            async () => {
                console.log('🔄 getFplTeams() - Loading from Firestore');
                const cached = await this.fplFirestore.getTeams();
                return cached;
            },
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.TEAMS) },
        );
    }

    /**
     * Get FPL events using unified cache
     */
    async getFplEvents() {
        return await dataCache.get(
            CACHE_KEYS.FPL.EVENTS,
            async () => {
                console.log('🔄 getFplEvents() - Loading from Firestore');
                const cached = await this.fplFirestore.getEvents();
                return cached;
            },
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.EVENTS) },
        );
    }

    /**
     * Get teams by code using unified cache
     */
    async getTeamsByCode(): Promise<Record<FplTeam['code'], FplTeam>> {
        return await dataCache.get(
            'fpl:teams-by-code',
            async () => {
                console.log('🔄 getTeamsByCode() - Building lookup from teams');
                const elements = await this.getFplTeams(); // This will use cache
                const byId = elements.reduce(
                    (acc, e) => ({
                        ...acc,
                        [e.code]: e,
                    }),
                    {},
                );
                return byId;
            },
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.TEAMS) },
        );
    }

    /**
     * Get specific players by IDs (from cached elements)
     */
    async getPlayersByCodes(playerCodes: number[]): Promise<EnhancedPlayerData[]> {
        const elements = await this.getFplPlayers();
        if (!elements) return [];

        const playerMap = new Map(elements.map((player) => [player.code, player]));
        return playerCodes
            .map((code) => playerMap.get(code))
            .filter((player): player is EnhancedPlayerData => player !== undefined);
    }
    /**
     * Get specific players by IDs (from cached elements)
     */
    async getPlayerByCode(playerCode: number): Promise<EnhancedPlayerData> {
        const elements = await this.getFplPlayers();
        if (!elements) return null;

        return elements.find((player) => player.code === playerCode);
    }

    /**
     * Get specific players by IDs (from cached elements)
     */
    async getPlayersByCode(): Promise<Record<EnhancedPlayerData['code'], EnhancedPlayerData>> {
        const elements = await this.getFplPlayers();
        if (!elements) return {};
        return elements.reduce((acc, player) => ({ ...acc, [player.code]: player }), {});
    }

    /**
     * Get current gameweek using unified cache
     */
    async getCurrentGameweekData(): Promise<GameWeekData> {
        const events = await this.getFplEvents();
        return (
            events.find((event) => event.fplEvent.is_current) || events[events.length - 1] || { fplEvent: { id: 0 } }
        );
    }

    /**
     * Get finished events using unified cache
     */
    async getFinishedEvents(): Promise<GameWeekData[]> {
        const events = await this.getFplEvents();
        if (!events) return [];

        return events.filter((event) => event.fplEvent.finished);
    }

    /**
     * Get current gameweek number from cached events
     */
    async getCurrentGameweek(): Promise<number> {
        const event = await this.getCurrentGameweekData();
        return event?.fplEvent.id || 0;
    }

    /**
     * Search players by name (from cached elements)
     */
    async searchPlayersByName(searchTerm: string): Promise<EnhancedPlayerData[]> {
        const elements = await this.getFplPlayers();
        if (!elements) return [];

        const normalizedSearch = searchTerm.toLowerCase().trim();

        return elements.filter((player) => {
            const firstName = player.first_name.toLowerCase();
            const secondName = player.second_name.toLowerCase();
            const webName = player.web_name.toLowerCase();

            return (
                firstName.includes(normalizedSearch) ||
                secondName.includes(normalizedSearch) ||
                webName.includes(normalizedSearch)
            );
        });
    }

    // === DETAILED STATS ORCHESTRATION ===

    /**
     * Get detailed stats for a single player using individual cache
     */

    async getPlayerDetailedStats(playerId: number): Promise<Doc<FplPlayerSeasonData | null>> {
        const cacheKey = CACHE_KEYS.FPL.PLAYER_STATS(playerId.toString());

        return await dataCache.get(
            cacheKey,
            async () => {
                console.log(`🔄 getPlayerDetailedStats(${playerId}) - Loading from Firestore`);
                const cached = await this.fplFirestore.getPlayerDetailedStats(playerId);
                return cached;
            },
            { ttlMs: getCacheTTL(cacheKey) },
        );
    }

    /**
     * Get batch player detailed stats using individual caching with smart batching
     * NEW APPROACH: Check individual caches first, batch fetch only cache misses
     */
    async getBatchPlayerDetailedStats(playerIds: number[]): Promise<Record<number, FplPlayerSeasonData>> {
        console.log(`🔄 getBatchPlayerDetailedStats() - Processing ${playerIds.length} players`);

        const results: Record<number, FplPlayerSeasonData> = {};
        const cacheMisses: number[] = [];

        // Step 1: Check individual caches for each player
        for (const playerId of playerIds) {
            const cacheKey = CACHE_KEYS.FPL.PLAYER_STATS(playerId.toString());

            // Check if data exists in cache and is not expired
            if (dataCache.has(cacheKey)) {
                const cached = dataCache.getCacheInfo(cacheKey);
                if (cached.exists && !cached.expired) {
                    // Get the cached data using the existing get method (will be a cache hit)
                    const data = await dataCache.get(
                        cacheKey,
                        async () => {
                            // This should not be called due to cache hit
                            throw new Error('Unexpected cache miss');
                        },
                        { ttlMs: getCacheTTL(cacheKey) },
                    );
                    results[playerId] = data;
                } else {
                    cacheMisses.push(playerId);
                }
            } else {
                cacheMisses.push(playerId);
            }
        }

        console.log(`💾 Cache hits: ${Object.keys(results).length}/${playerIds.length} players`);

        // Step 2: Batch fetch cache misses from Firestore
        if (cacheMisses.length > 0) {
            console.log(`🔄 Fetching ${cacheMisses.length} players from Firestore`);

            try {
                const firestoreResults = await this.fplFirestore.getBatchPlayerDetailedStats(cacheMisses);

                // Step 3: Cache individual results and add to final results
                for (const [playerIdStr, data] of Object.entries(firestoreResults)) {
                    const playerId = Number.parseInt(playerIdStr, 10);
                    const cacheKey = CACHE_KEYS.FPL.PLAYER_STATS(playerId.toString());

                    // Cache individual player data using existing set method
                    dataCache.set(cacheKey, data, getCacheTTL(cacheKey));

                    // Add to results
                    results[playerId] = data;
                }

                console.log(`✅ Cached ${Object.keys(firestoreResults).length} new players individually`);
            } catch (error) {
                console.error('❌ Failed to fetch cache misses:', error);
                // Continue with partial results from cache hits
            }
        }

        console.log(`✅ Batch player stats completed: ${Object.keys(results).length}/${playerIds.length} players`);
        return results;
    }

    // === CACHE MANAGEMENT ===

    /**
     * Get cache health status
     */
    async getCacheHealth() {
        return await dataCache.get(
            'fpl:cache-health',
            async () => {
                const data = await this.getCacheStatus();
                let status = 'healthy' as 'healthy' | 'warning' | 'critical';

                // Check for critical issues
                if (data.missing.elements) status = 'critical';
                if (data.missing.teams || data.missing.events) status = 'critical';

                // Check for warnings
                if (status !== 'critical') {
                    if (data.missing.draftData && data.counts.elements > 0) status = 'warning';
                    if (data.missing.elementDetailedStats && data.counts.elements > 0) status = 'warning';
                }

                return {
                    status: status,
                    data: data,
                };
            },
            { ttlMs: getCacheTTL('fpl:cache-health') },
        );
    }

    /**
     * Get cache status (uncached - always fresh)
     */
    async getCacheStatus() {
        console.log('🔄 getCacheStatus() - Getting fresh status');

        // This should always be fresh to get accurate cache status
        const [elements, elementsCount, eventsCount, teamsCount, elementDetailedStatsCount] = await Promise.all([
            this.fplFirestore.getElements(),
            this.fplFirestore.getElementsCount(),
            this.fplFirestore.getEventsCount(),
            this.fplFirestore.getTeamsCount(),
            this.fplFirestore.getElementDetailedStatsCount(),
        ]);

        const hasDraftData = elements?.some((player) => player.draft) || false;

        return {
            completionPercentage: elementsCount > 0 ? Math.round((elementDetailedStatsCount / elementsCount) * 100) : 0,
            counts: {
                elements: elementsCount,
                events: eventsCount,
                teams: teamsCount,
                elementDetailedStats: elementDetailedStatsCount,
            },
            missing: {
                elements: elementsCount === 0,
                events: eventsCount === 0,
                teams: teamsCount === 0,
                elementDetailedStats: elementDetailedStatsCount === 0,
                draftData: !hasDraftData,
            },
        };
    }

    /**
     * Clear all FPL-related caches
     */
    clearAllCaches(): void {
        console.log('🧹 FplApiCache: Clearing all FPL caches');
        dataCache.invalidatePattern('fpl:');
    }

    /**
     * Clear all FPL related caches
     */
    async clearFplCaches(): Promise<void> {
        console.log('🗑️ Clearing all FPL caches');

        // Clear main FPL data caches
        dataCache.invalidate(CACHE_KEYS.FPL.PLAYERS);
        dataCache.invalidate(CACHE_KEYS.FPL.TEAMS);
        dataCache.invalidate(CACHE_KEYS.FPL.EVENTS);
        dataCache.invalidate('fpl:cache-health');

        // Clear all individual player stats caches
        dataCache.invalidatePattern('fpl:player-stats:');

        console.log('✅ FPL caches cleared');
    }

    /**
     * Invalidate specific cache
     */
    invalidateCache(cacheKey: string): void {
        console.log(`🗑️ FplApiCache: Invalidating cache: ${cacheKey}`);
        dataCache.invalidate(cacheKey);
    }
}

// Export singleton instance
export const fplApiCache = new FplApiCache();

// Export the class for testing or multiple instances
export default FplApiCache;
