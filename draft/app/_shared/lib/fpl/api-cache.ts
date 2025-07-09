// app/_shared/lib/fpl/api-cache.ts
/* Responsibility: */
/* - the public interface to get fantasy.premierleague.com data */
/* - common helper functions e.g. data-transfers should live here */

import type { EnhancedPlayerData } from '../../../scoring/types/scoring-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { FplFirestore } from './fpl-firestore';
import type { FplPlayerSeasonData, GameWeekData } from './fpl-types';

/**
 * Updated FPL Data Orchestrator - Uses DataCacheService
 * Removes custom caching logic, keeps promise deduplication for performance
 * All caching is now handled by the unified DataCacheService
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
    async getTeamsByCode() {
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
        return events.find((event) => event.fplEvent.is_current) || events[events.length - 1];
    }

    /**
     * Get current gameweek from cached events
     */
    async getCurrentGameweek(): Promise<number> {
        const event = await this.getCurrentGameweekData();
        return event.fplEvent.id;
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
     * Get detailed stats for a single player using unified cache
     */
    async getPlayerDetailedStats(playerId: number) {
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
     * Get batch player detailed stats using unified cache
     */
    async getBatchPlayerDetailedStats(playerIds: number[]): Promise<Record<number, FplPlayerSeasonData>> {
        const sortedIds = [...playerIds].sort();
        const cacheKey = CACHE_KEYS.FPL.BATCH_PLAYER_STATS(sortedIds.map(String));

        return await dataCache.get(
            cacheKey,
            async () => {
                console.log(`🔄 getBatchPlayerDetailedStats() - Loading ${playerIds.length} players from Firestore`);

                const results = await this.fplFirestore.getPlayerDetailedStats(playerIds);

                console.log(`✅ Batch player stats loaded: ${Object.keys(results).length}/${playerIds.length} players`);
                return results;
            },
            { ttlMs: getCacheTTL(cacheKey) },
        );
    }

    // === CACHE MANAGEMENT ===

    /**
     * Get cache health status
     */
    async getCacheHealth() {
        return await dataCache.get(
            'fpl:cache-health',
            async () => {
                const status = await this.getCacheStatus();

                const health = {
                    overall: 'healthy' as 'healthy' | 'warning' | 'critical',
                    issues: [] as string[],
                    recommendations: [] as string[],
                };

                // Check for critical issues
                if (status.missing.elements) {
                    health.overall = 'critical';
                    health.issues.push('No player data (elements) found');
                    health.recommendations.push('Run "Populate Bootstrap Data" to fetch basic player data');
                }

                if (status.missing.teams || status.missing.events) {
                    health.overall = 'critical';
                    health.issues.push('Missing core FPL data (teams/events)');
                    health.recommendations.push('Run "Populate Bootstrap Data" to fetch core FPL data');
                }

                // Check for warnings
                if (status.missing.draftData && status.counts.elements > 0) {
                    if (health.overall !== 'critical') health.overall = 'warning';
                    health.issues.push('Player data missing draft calculations');
                    health.recommendations.push('Run "Generate Enhanced Data" to add draft scoring');
                }

                if (status.missing.elementDetailedStats && status.counts.elements > 0) {
                    if (health.overall !== 'critical') health.overall = 'warning';
                    health.issues.push('Missing detailed player statistics');
                    health.recommendations.push('Run "Populate Element Summaries" for detailed stats');
                }

                return {
                    ...status,
                    health,
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
            completionPercentage: elementsCount > 0 ? 100 : 0,
            lastUpdated: this.fplFirestore.lastUpdated?.elements || null,
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
                elementDetailedStats: elementDetailedStatsCount === 0, // Would need to implement this check
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
     * Invalidate specific cache
     */
    invalidateCache(cacheKey: string): void {
        console.log(`🗑️ FplApiCache: Invalidating cache: ${cacheKey}`);
        dataCache.invalidate(cacheKey);
    }
}

// Export a singleton instance for easy use
export const fplApiCache = new FplApiCache();

// Export the class for testing or multiple instances
export default FplApiCache;
