// app/_shared/lib/fpl/api-cache.ts
/* Responsibility: */
/* - the public interface to get fantasy.premierleague.com data */
/* - common helper functions e.g. data-transfers should live here */

import type { EnhancedPlayerData } from '../../types/player-types';
import { CACHE_KEYS, getCacheTTL, getInvalidationKeys } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { isFakeNow } from '../clock';
import { fuzzyStringMatch } from '../fuzzy-string-match';
import { fplApi } from './api';
import { FplFirestore } from './fpl-firestore';
import type {
    FplBootstrapData,
    FplFixtureData,
    FplLiveData,
    FplPlayerSeasonData,
    FplTeam,
    GameWeekData,
} from './fpl-types';
import { findScoringGameweek, recomputeGameweekFlags } from './gameweeks';

const CACHE_STATUS_TIMEOUT_MS = 15_000;

/**
 * Resolve a promise within a timeout, returning fallback on expiry.
 * Pure helper kept at module scope (not nested inside callers).
 */
async function withTimeoutFallback<T>(
    promise: Promise<T>,
    fallback: T,
    label: string,
    timeoutMs = CACHE_STATUS_TIMEOUT_MS,
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
        const result = await Promise.race([
            promise.then((value) => ({ ok: true as const, value })),
            new Promise<{ ok: false }>((resolve) => {
                timeoutId = setTimeout(() => resolve({ ok: false }), timeoutMs);
            }),
        ]);

        if (!result.ok) {
            console.warn(`⚠️ getCacheStatus() - ${label} timed out after ${timeoutMs}ms`);
            return fallback;
        }
        return result.value;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

/**
 * Updated FPL Data Orchestrator - Uses Individual Player Caching
 * Fixes cache key explosion by caching individual players instead of batches
 * Maintains performance with smart batching for cache misses
 */
class FplApiCache {
    fplFirestore: FplFirestore;

    constructor() {
        this.fplFirestore = new FplFirestore();
    }

    // === BOOTSTRAP DATA ORCHESTRATION ===

    /**
     * Get all FPL players using unified cache
     */
    async getFplBootstrap(): Promise<FplBootstrapData> {
        return await dataCache.get(
            CACHE_KEYS.FPL.BOOTSTRAP,
            async () => {
                console.log('🔄 getFplPlayers() - Loading from Firestore');
                try {
                    const data = await fplApi.getFplBootstrapData();
                    return data;
                } catch (error) {
                    console.error('❌ getFplPlayers() - Error:', error);
                    throw error;
                }
            },
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.BOOTSTRAP) },
        );
    }
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
     * Get all FPL players using unified cache
     */
    async getFplFixtures(): Promise<FplFixtureData[]> {
        return await dataCache.get(
            CACHE_KEYS.FPL.FIXTURES,
            async () => {
                console.log('🔄 getFplFixtures() - Loading from Firestore');
                try {
                    const cached = await fplApi.getFplFixtureData();
                    return cached;
                } catch (error) {
                    console.error('❌ getFplFixtures() - Error:', error);
                    throw error;
                }
            },
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.FIXTURES) },
        );
    }

    /**
     * Get live data for all players in a specific gameweek
     */
    async getGameweekLiveData(gameweek: number): Promise<FplLiveData> {
        const cacheKey = CACHE_KEYS.FPL.GAMEWEEK_LIVE(gameweek);
        return await dataCache.get(
            cacheKey,
            async () => {
                console.log(`🔄 getGameweekLiveData(${gameweek}) - Loading from FPL API`);
                try {
                    const data = await fplApi.getGameweekLiveData(gameweek);
                    return data;
                } catch (error) {
                    console.error(`❌ getGameweekLiveData(${gameweek}) - Error:`, error);
                    throw error;
                }
            },
            { ttlMs: getCacheTTL(cacheKey) },
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
        const events = await dataCache.get(
            CACHE_KEYS.FPL.EVENTS,
            async () => {
                console.log('🔄 getFplEvents() - Loading from Firestore');
                const cached = await this.fplFirestore.getEvents();
                return cached;
            },
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.EVENTS) },
        );

        // Recomputed on READ, deliberately outside the cache callback above. The stored
        // flags were frozen when `populateEvents` last ran, and `fpl:events` has a 4h TTL,
        // so recomputing inside the fetcher would pin them to whenever the cache filled --
        // and one server could not then answer two requests at two different dates.
        //
        // Only under a fake clock. In production this would be a real semantic change:
        // the app's own date math and FPL's `is_current` disagree about which gameweek is
        // current once a deadline has passed (see gameweeks.ts), and that is not this
        // change's argument to have.
        return isFakeNow() ? recomputeGameweekFlags(events) : events;
    }

    /**
     * Get teams by code using unified cache
     */
    async getTeamsByCode(): Promise<Record<FplTeam['code'], FplTeam>> {
        return await dataCache.get(
            CACHE_KEYS.FPL.TEAMS_BY_CODE,
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

        // The gameweek being PLAYED, which is not the one `isCurrent` marks. `isCurrent`
        // is the window for picking the next team, so it moves on at the deadline while
        // that gameweek's matches are still to come -- and every caller here is a points
        // page. Neither stored flag is used: both are frozen at whenever an admin last
        // populated bootstrap data. See `findScoringGameweek`.
        return findScoringGameweek(events);
    }

    /**
     * The gameweek managers are picking a team for: the window that runs from the previous
     * deadline to this one.
     *
     * The counterpart to `getCurrentGameweekData()`, and the reason both exist. A page
     * showing points wants the gameweek being played; a page taking team submissions wants
     * the one still open. They are the same number only in the run-up to a deadline.
     */
    async getSelectionGameweekData(): Promise<GameWeekData | undefined> {
        const events = await this.getFplEvents();

        // FPL's flag as the fallback: a finished season has no open window at all, which
        // is the state the offline harness replays.
        return events.find((event) => event.isCurrent) ?? events.find((event) => event.fplEvent.is_current);
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

        return elements.filter((player) => {
            return (
                fuzzyStringMatch(player.web_name, searchTerm) ||
                fuzzyStringMatch(player.first_name, searchTerm) ||
                fuzzyStringMatch(player.second_name, searchTerm)
            );
        });
    }

    // === DETAILED STATS ORCHESTRATION ===

    /**
     * Get detailed stats for a single player using individual cache
     */

    async getPlayerDetailedStats(playerId: number): Promise<FplPlayerSeasonData | null> {
        const cacheKey = CACHE_KEYS.FPL.PLAYER_STATS(playerId.toString());

        return await dataCache.get(
            cacheKey,
            async () => {
                console.log(`🔄 getPlayerDetailedStats(${playerId}) - Loading from Firestore`);
                const cached = await fplApi.getPlayerDetailedStats(playerId);
                return cached;
            },
            { ttlMs: getCacheTTL(cacheKey) },
        );
    }

    /**
     * Get batch player detailed stats using individual caching with smart batching
     * Check individual caches first, batch fetch only cache misses
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
                const firestoreResults = await fplApi.getBatchPlayerDetailedStats(cacheMisses);

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
            CACHE_KEYS.FPL.CACHE_HEALTH,
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
            { ttlMs: getCacheTTL(CACHE_KEYS.FPL.CACHE_HEALTH) },
        );
    }

    /**
     * Get cache status (uncached - always fresh)
     */
    async getCacheStatus() {
        console.log('🔄 getCacheStatus() - Getting fresh status');

        // Load elements once — getElementsCount() previously re-read the same large document
        const elements = await withTimeoutFallback(this.fplFirestore.getElements(), [], 'getElements');
        const elementsCount = elements.length;
        const hasDraftData = elements.some((player) => Boolean(player.draft));

        const [eventsCount, teamsCount, elementDetailedStatsCount] = await Promise.all([
            withTimeoutFallback(this.fplFirestore.getEventsCount(), 0, 'getEventsCount'),
            withTimeoutFallback(this.fplFirestore.getTeamsCount(), 0, 'getTeamsCount'),
            withTimeoutFallback(this.fplFirestore.getElementDetailedStatsCount(), 0, 'getElementDetailedStatsCount'),
        ]);

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
     * Clear all FPL related caches
     */
    clearFplCaches(): void {
        const cleared = dataCache.invalidateMultiple(getInvalidationKeys('FPL_DATA_UPDATED'));
        console.log(`✅ FPL caches cleared (${cleared} entries)`);
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
