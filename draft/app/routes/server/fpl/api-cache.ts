// src/lib/fpl/api-cache.ts
import type {
    FplBootstrapData,
    FplPlayerData,
} from '../../../types';
import type { FplPlayerSeasonData } from './api';
import { FplCache } from '../firestore-cache/fpl-cache';
import { FirestoreClient } from '../firestore-cache/firestore-client';
import { fplApi } from './api';
import * as fplStats from './stats';
import { processBatched } from '../utils/batch-processor';
import { generateEnhancedData } from '../scoring/generate-enhanced-data';
import { readPlayers } from '../sheets/players';

const currentSeason = '2024-25';

/**
 * FPL Data Orchestrator - manages cache and API calls
 * Provides intelligent data fetching with Firestore caching
 */
export class FplApiCache {
    private fplCache: FplCache;
    private pendingPromises: Map<string, Promise<any>> = new Map();

    constructor() {
        const firestoreClient = new FirestoreClient();
        this.fplCache = new FplCache(firestoreClient);
    }

    /**
     * Deduplicate promises to prevent multiple simultaneous calls to same method
     */
    private async withPromiseDeduplication<T>(
        key: string,
        promiseFactory: () => Promise<T>,
        timeoutMs: number = 30000
    ): Promise<T> {
        // If there's already a pending promise for this key, return it
        if (this.pendingPromises.has(key)) {
            console.log(`🔄 ${key} - Returning existing promise`);
            return this.pendingPromises.get(key) as Promise<T>;
        }

        // Create new promise with timeout cleanup
        const promise = promiseFactory().finally(() => {
            // Clean up the promise from cache when it completes
            this.pendingPromises.delete(key);
        });

        // Add timeout to prevent hanging promises
        const timeoutPromise = new Promise<T>((_, reject) => {
            setTimeout(() => {
                this.pendingPromises.delete(key);
                reject(new Error(`Promise timeout after ${timeoutMs}ms for ${key}`));
            }, timeoutMs);
        });

        const racedPromise = Promise.race([promise, timeoutPromise]);
        this.pendingPromises.set(key, racedPromise);

        return racedPromise;
    }

    // === BOOTSTRAP DATA ORCHESTRATION ===

    /**
     * Get FPL bootstrap data (orchestrates cache + API)
     */
    async getFplBootstrapData(): Promise<FplBootstrapData> {
        return this.withPromiseDeduplication('bootstrap', async () => {
            const startTime = performance.now();
            console.log('🔄 getFplBootstrapData() - Start');

            try {
                // Try to get from cache
                const cached = await this.tryGetBootstrapFromCache();
                if (cached) {
                    console.log(`✅ getFplBootstrapData() - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
                    return cached;
                }

                console.log('📡 getFplBootstrapData() - Cache miss, fetching from API');
                const fresh = await fplApi.getFplBootstrapData();
                console.log(`📡 getFplBootstrapData() - API fetch complete, now populating cache...`);
                await this.fplCache.populateBootstrap(fresh);
                console.log(`✅ getFplBootstrapData() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
                return fresh;
            } catch (error) {
                console.error('❌ getFplBootstrapData() - Error:', error);
                throw error;
            }
        });
    }

    /**
     * reconstruct bootstrap data from cache
     */
    private async tryGetBootstrapFromCache(): Promise<FplBootstrapData | null> {
        const [teams, events, elements] = await Promise.all([
            this.fplCache.getTeams(),
            this.fplCache.getEvents(),
            this.fplCache.getElements()
        ]);

        if (teams && events && elements) {
            return { teams, events, elements } as FplBootstrapData;
        }

        return null;
    }

    /**
     * Get all FPL players
     */
    async getFplPlayers(): Promise<FplPlayerData[]> {
        return this.withPromiseDeduplication('players', async () => {
            const startTime = performance.now();
            console.log('🔄 getFplPlayers() - Start');

            try {

                await this.fplCache.debugElementsSize();
                const cached = await this.fplCache.getElements();
                if (cached) {
                    console.log(`✅ getFplPlayers() - Cache hit with ${cached.length} players in ${(performance.now() - startTime).toFixed(2)}ms`);
                    return cached;
                }

                console.log('📡 getFplPlayers() - Cache miss, getting from bootstrap');
                const bootstrap = await this.getFplBootstrapData();
                console.log(`✅ getFplPlayers() - Complete with ${bootstrap.elements.length} players in ${(performance.now() - startTime).toFixed(2)}ms`);
                return bootstrap.elements;
            } catch (error) {
                console.error('❌ getFplPlayers() - Error:', error);
                throw error;
            }
        });
    }

    /**
     * Get FPL teams
     */
    async getFplTeams() {
        return this.withPromiseDeduplication('teams', async () => {
            const startTime = performance.now();
            console.log('🔄 getFplTeams() - Start');

            const cached = await this.fplCache.getTeams();
            if (cached) {
                console.log(`✅ getFplTeams() - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
                return cached;
            }

            console.log('📡 getFplTeams() - Cache miss, getting from bootstrap');
            const bootstrap = await this.getFplBootstrapData();
            const result = fplStats.extractFplTeams(bootstrap);
            console.log(`✅ getFplTeams() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return result;
        });
    }
    /**
     * Get FPL events
     */
    async getFplEvents() {
        return this.withPromiseDeduplication('events', async () => {
            const startTime = performance.now();
            console.log('🔄 getFplEvents() - Start');

            const cached = await this.fplCache.getEvents();
            if (cached) {
                console.log(`✅ getFplEvents() - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
                return cached;
            }

            console.log('📡 getFplEvents() - Cache miss, getting from bootstrap');
            const bootstrap = await this.getFplBootstrapData();
            const result = bootstrap.events;
            console.log(`✅ getFplEvents() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return result;
        });
    }

    /**
     * Get FPL element types
     */
    async getFplElementTypes(): Promise<Array<{ id: number; singular_name: string; plural_name: string }>> {
        return this.withPromiseDeduplication('element-types', async () => {
            const startTime = performance.now();
            console.log('🔄 getFplElementTypes() - Start');

            const bootstrap = await this.getFplBootstrapData();
            const result = fplStats.extractFplElementTypes(bootstrap);
            console.log(`✅ getFplElementTypes() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return result;
        });
    }

    /**
     * Get current gameweek
     */
    async getCurrentGameweek(): Promise<number> {
        return this.withPromiseDeduplication('current-gameweek', async () => {
            const startTime = performance.now();
            console.log('🔄 getCurrentGameweek() - Start');

            const cached = await this.fplCache.getCurrentGameweek();
            if (cached) {
                console.log(`✅ getCurrentGameweek() - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
                return cached;
            }

            console.log('📡 getCurrentGameweek() - Cache miss, getting from bootstrap');
            const bootstrap = await this.getFplBootstrapData();
            const result = fplStats.getCurrentGameweekFromBootstrap(bootstrap);
            console.log(`✅ getCurrentGameweek() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return result;
        });
    }

    // === PLAYER DATA ORCHESTRATION ===

    /**
     * Get FPL player by ID
     */
    async getFplPlayer(playerId: number): Promise<FplPlayerData | null> {
        return this.withPromiseDeduplication(`player-${playerId}`, async () => {
            const startTime = performance.now();
            console.log(`🔄 getFplPlayer(${playerId}) - Start`);

            const players = await this.fplCache.getPlayersByIds([playerId]);
            const result = players.length > 0 ? players[0] : null;
            console.log(`✅ getFplPlayer(${playerId}) - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return result;
        });
    }

    /**
     * Get player detailed stats (element summary)
     */
    async getPlayerDetailedStats(playerId: number): Promise<FplPlayerSeasonData> {
        return this.withPromiseDeduplication(`element-summary-${playerId}`, async () => {
            const startTime = performance.now();
            console.log(`🔄 getPlayerDetailedStats(${playerId}) - Start`);

            const cached = await this.fplCache.getElementSummary(playerId);
            if (cached) {
                console.log(`✅ getPlayerDetailedStats(${playerId}) - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
                return cached;
            }

            console.log(`📡 getPlayerDetailedStats(${playerId}) - Cache miss, fetching from API`);
            const fresh = await fplApi.getPlayerDetailedStats(playerId);
            await this.fplCache.populateElementSummary(playerId, fresh);
            console.log(`✅ getPlayerDetailedStats(${playerId}) - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return fresh;
        });
    }

    /**
    * Batch get player detailed stats (with internal chunking)
    */
    async getBatchPlayerDetailedStats(playerIds: number[]): Promise<Record<number, FplPlayerSeasonData>> {
        return this.withPromiseDeduplication(`batch-element-summaries-${playerIds.join(',')}`, async () => {
            const startTime = performance.now();
            console.log(`🔄 getBatchPlayerDetailedStats([${playerIds.length} players]) - Start`);

            // Check which players are cached
            let cached
            try {
                console.log('🔄 Step 5 getBatchPlayerDetailedStats:');
                cached = await this.fplCache.batchGetElementSummaries(playerIds);

            } catch (error) {
                console.error('❌ Step 5 FAILED:', error.message);
                throw new Error(`Step 5 failed: ${error.message}`);
            }
            const cachedPlayerIds = Object.keys(cached).map(Number);
            const missingPlayerIds = playerIds.filter(id => !cachedPlayerIds.includes(id));

            console.log(`🔍 getBatchPlayerDetailedStats() - ${cachedPlayerIds.length} cached, ${missingPlayerIds.length} missing`);

            // Fetch missing players from API in manageable chunks
            const freshData: Record<number, FplPlayerSeasonData> = {};

            if (missingPlayerIds.length > 0) {
                const fetchPlayer = async (playerId: number) => {
                    try {
                        const playerData = await fplApi.getPlayerDetailedStats(playerId);
                        return { playerId, playerData };
                    } catch (error) {
                        console.error(`Failed to fetch player ${playerId}:`, error);
                        return { playerId, playerData: null };
                    }
                };

                const results = await processBatched(missingPlayerIds, fetchPlayer, {
                    batchSize: 50,
                    maxConcurrent: 10,
                    logProgress: true
                });

                // Convert results to freshData object
                results.forEach(({ playerId, playerData }) => {
                    if (playerData) {
                        freshData[playerId] = playerData;
                    }
                });

                // Cache the fresh data
                if (Object.keys(freshData).length > 0) {
                    try {
                        console.log('🔄 Step 6 populateElementSummaries:');
                        await this.fplCache.populateElementSummaries(freshData);

                    } catch (error) {
                        console.error('❌ Step 6 FAILED:', error.message);
                        throw new Error(`Step 6 failed: ${error.message}`);
                    }
                }
            }

            // Combine cached and fresh data
            const finalResults = { ...cached, ...freshData };
            console.log(`✅ getBatchPlayerDetailedStats() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return finalResults;
        }, 600000); // 10 minutes timeout for large batches
    }

    // === FILTERED DATA METHODS ===

    /**
     * Get players by position
     */
    async getPlayersByPosition(elementType: number): Promise<FplPlayerData[]> {
        const startTime = performance.now();
        console.log(`🔄 getPlayersByPosition(${elementType}) - Start`);

        const result = await this.fplCache.getPlayersByPosition(elementType);
        console.log(`✅ getPlayersByPosition(${elementType}) - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }

    /**
     * Get players by team
     */
    async getPlayersByTeam(teamId: number): Promise<FplPlayerData[]> {
        const startTime = performance.now();
        console.log(`🔄 getPlayersByTeam(${teamId}) - Start`);

        const result = await this.fplCache.getPlayersByTeam(teamId);
        console.log(`✅ getPlayersByTeam(${teamId}) - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }

    /**
     * Search players by name
     */
    async searchPlayersByName(searchTerm: string): Promise<FplPlayerData[]> {
        const startTime = performance.now();
        console.log(`🔄 searchPlayersByName("${searchTerm}") - Start`);

        const result = await this.fplCache.searchPlayersByName(searchTerm);
        console.log(`✅ searchPlayersByName("${searchTerm}") - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }

    /**
     * Batch fetch multiple players' data
     */
    async batchFetchPlayersData(playerIds: number[]): Promise<FplPlayerData[]> {
        const startTime = performance.now();
        console.log(`🔄 batchFetchPlayersData([${playerIds.length} players]) - Start`);

        const result = await this.fplCache.getPlayersByIds(playerIds);
        console.log(`✅ batchFetchPlayersData() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }

    // === STATS-BASED METHODS ===

    /**
     * Get top performers
     */
    async getTopPerformers(limit = 10): Promise<FplPlayerData[]> {
        const startTime = performance.now();
        console.log(`🔄 getTopPerformers(${limit}) - Start`);

        const players = await this.getFplPlayers();
        const result = fplStats.getTopPerformers(players, limit);
        console.log(`✅ getTopPerformers(${limit}) - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }

    /**
     * Get player form
     */
    async getPlayerForm(playerId: number): Promise<number> {
        const startTime = performance.now();
        console.log(`🔄 getPlayerForm(${playerId}) - Start`);

        const player = await this.getFplPlayer(playerId);
        const result = player ? fplStats.getPlayerForm(player) : 0;
        console.log(`✅ getPlayerForm(${playerId}) - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }

    /**
     * Get enhanced player data (with draft calculations)
     */
    async getEnhancedPlayerData(): Promise<EnhancedPlayerData[]> {
        return this.withPromiseDeduplication('enhanced-players', async () => {
            const startTime = performance.now();
            console.log('🔄 getEnhancedPlayerData() - Start');

            // Check if we have cached draft data
            const hasDraft = await this.fplCache.hasDraftData();
            if (hasDraft) {
                console.log('✅ getEnhancedPlayerData() - Found cached draft data');
                const elementsWithDraft = await this.fplCache.getElements();
                const enhancedPlayers = this.convertElementsWithDraftToEnhanced(elementsWithDraft);
                console.log(`✅ getEnhancedPlayerData() - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
                return enhancedPlayers;
            }

            const sheetsPlayers = await readPlayers();
            console.log('🔄 getEnhancedPlayerData() - No draft data, generating...');
            const enhancedPlayers = await this.generateAndCacheEnhancedData(sheetsPlayers);
            console.log(`✅ getEnhancedPlayerData() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return enhancedPlayers;
        });
    }

    /**
     * Generate enhanced data and cache it in draft fields
     */
    private async generateAndCacheEnhancedData(sheetsPlayers): Promise<EnhancedPlayerData[]> {
        const [fplPlayers, fplTeams] = await Promise.all([
            this.getFplPlayers(),
            this.getFplTeams(),
        ]);

        const playerIds = fplPlayers.map(p => p.id);
        const fplPlayerGameweeksById = await this.getBatchPlayerDetailedStats(playerIds);
        const teams = fplTeams.reduce((acc: Record<number, string>, team) => {
            acc[team.id] = team.name;
            return acc;
        }, {});

        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, PlayerData>, player) => {
            acc[player.id] = player;
            return acc;
        }, {});

        console.log('🔄 generateAndCacheEnhancedData() - Running generateEnhancedData...');
        const enhancedPlayers = generateEnhancedData(fplPlayers, fplPlayerGameweeksById, sheetsPlayersById, teams);

        // Extract draft data for caching
        const draftDataById: Record<number, any> = {};
        enhancedPlayers.forEach(player => {
            const playerSheet = sheetsPlayersById[player.id.toString()];
            if (playerSheet) {
                draftDataById[player.id] = {
                    position: playerSheet.position,
                    pointsTotal: player.custom_points, // Assuming this comes from generateEnhancedData
                    pointsBreakdown: player.full_breakdown,
                };
            }
        });

        console.log('🔄 generateAndCacheEnhancedData() - Caching draft data...');
        await this.fplCache.updateElementsWithDraft(draftDataById);

        console.log('✅ generateAndCacheEnhancedData() - Complete');
        return enhancedPlayers;
    }

    /**
     * Convert elements with draft data back to enhanced format
     */
    private convertElementsWithDraftToEnhanced(elementsWithDraft: any[]): EnhancedPlayerData[] {
        return elementsWithDraft
          .filter(element => element.draft) // Only include elements with draft data
          .map(element => ({
              ...element,
              position: element.draft.position,
              pointsTotal: element.draft.pointsTotal,
              pointsBreakdown: element.draft.pointsBreakdown,
              fullBreakdown: element.draft.fullBreakdown,
          }));
    }

    /**
     * Force regeneration of enhanced data
     */
    async refreshEnhancedData(): Promise<EnhancedPlayerData[]> {
        console.log('🔄 refreshEnhancedData() - Clearing existing draft data...');
        await this.fplCache.clearDraftData();

        // Clear the promise deduplication cache for this key
        this.pendingPromises.delete('enhanced-players');

        return await this.getEnhancedPlayerData();
    }


    // === CACHE MANAGEMENT ===

    /**
     * Get cache status
     */
    async getCacheStatus(): Promise<{
        isUpdating: boolean;
        lastFullUpdate: string | null;
        activeOperationsCount: number;
    }> {
        const startTime = performance.now();
        console.log('🔄 getCacheStatus() - Start');

        // For now, return a simple status since we don't have complex cache state management
        const result = {
            isUpdating: false,
            lastFullUpdate: null,
            activeOperationsCount: this.pendingPromises.size
        };
        console.log(`✅ getCacheStatus() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }

    /**
     * Preload common data
     */
    async preloadCommonData(): Promise<void> {
        const startTime = performance.now();
        console.log('🔄 preloadCommonData() - Start');

        await this.getFplBootstrapData();
        const currentGameweek = await this.getCurrentGameweek();

        console.log(`✅ preloadCommonData() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
    }
}

// Export a singleton instance for easy use
export const fplApiCache = new FplApiCache();

// Export the class for testing or multiple instances
export default FplApiCache;
