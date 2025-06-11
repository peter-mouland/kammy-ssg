// src/lib/fpl/api-cache.ts
import type {
    FplBootstrapData,
    FplPlayerData,
} from '../../types';
import type { FplPlayerSeasonData } from './api';
import { FplCache } from '../firestore-cache/fpl-cache';
import { fplApi } from './api';
import { processBatched } from '../batch-processor';
import { generateSeasonData } from '../../../scoring/lib'; // todo: shared lib should not have a domain in it
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
        this.fplCache = new FplCache();
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
            const result = bootstrap.teams;
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
            const result = this.getCurrentGameweekFromBootstrap(bootstrap);
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

            const cached = await this.fplCache.getElementGameweek(playerId);
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
     * Get top performers
     */
    async getTopPerformers(limit = 10): Promise<FplPlayerData[]> {
        const startTime = performance.now();
        console.log(`🔄 getTopPerformers(${limit}) - Start`);

        const players = await this.getFplPlayers();

        const result = players
                .filter(player => player.minutes > 0)
                .sort((a, b) => b.total_points - a.total_points)
                .slice(0, 10);

        console.log(`✅ getTopPerformers(${limit}) - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
    }


    /**
     * Get comprehensive cache status
     */
    async getCacheStatus() {
        const startTime = performance.now();
        console.log('🔄 getCacheStatus() - Start');

        try {
            const [
                teamsCount,
                eventsCount,
                elementsCount,
                hasDraftData,
                elementSummariesCount,
                currentGameweek
            ] = await Promise.all([
                this.fplCache.getTeamsCount(),
                this.fplCache.getEventsCount(),
                this.fplCache.getElementsCount(),
                this.fplCache.hasDraftData(),
                this.fplCache.getElementSummariesCount(),
                this.fplCache.getCurrentGameweek().catch(() => null)
            ]);

            // Check what's missing
            const missingData = {
                teams: teamsCount === 0,
                events: eventsCount === 0,
                elements: elementsCount === 0,
                draftData: !hasDraftData,
                elementSummaries: elementSummariesCount === 0,
                gameweek: !currentGameweek
            };

            const status = {
                timestamp: new Date().toISOString(),
                counts: {
                    teams: teamsCount,
                    events: eventsCount,
                    elements: elementsCount,
                    elementSummaries: elementSummariesCount,
                    currentGameweek
                },
                missing: missingData,
                hasBootstrapData: !missingData.teams && !missingData.events && !missingData.elements,
                hasEnhancedData: !missingData.draftData && elementsCount > 0,
                completionPercentage: this.calculateCompletionPercentage(missingData)
            };

            console.log(`✅ getCacheStatus() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return status;
        } catch (error) {
            console.error('❌ getCacheStatus() - Error:', error);
            throw error;
        }
    }

    /**
     * Calculate cache completion percentage
     */
    private calculateCompletionPercentage(missingData: Record<string, boolean>): number {
        const totalComponents = Object.keys(missingData).length;
        const missingComponents = Object.values(missingData).filter(Boolean).length;
        return Math.round(((totalComponents - missingComponents) / totalComponents) * 100);
    }

    /**
     * Get cache health summary
     */
    async getCacheHealth() {
        const status = await this.getCacheStatus();

        const health = {
            overall: 'healthy' as 'healthy' | 'warning' | 'critical',
            issues: [] as string[],
            recommendations: [] as string[]
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

        if (status.missing.elementSummaries && status.counts.elements > 0) {
            if (health.overall !== 'critical') health.overall = 'warning';
            health.issues.push('Missing detailed player statistics');
            health.recommendations.push('Run "Populate Element Summaries" for detailed stats');
        }

        return {
            ...status,
            health
        };
    }

    /**
     * Preload common data based on what's missing
     */
    async preloadCommonData(options: {
        includeBootstrap?: boolean;
        includeEnhancedData?: boolean;
        includeElementSummaries?: boolean;
        forceRefresh?: boolean;
        skipDetailedStats?: boolean;
    } = {}) {
        const startTime = performance.now();
        console.log('🔄 preloadCommonData() - Start', options);

        const {
            includeBootstrap = true,
            includeEnhancedData = false,
            includeElementSummaries = false,
            forceRefresh = false,
            skipDetailedStats = false
        } = options;

        const results: any = {};

        try {
            // If force refresh, clear existing data first
            if (forceRefresh) {
                console.log('🔄 preloadCommonData() - Force refresh, clearing existing data');
                if (includeBootstrap) {
                    await this.fplCache.clearBootstrapData();
                }
                if (includeEnhancedData) {
                    await this.fplCache.clearDraftData();
                }
                if (includeElementSummaries) {
                    await this.fplCache.clearElementSummaries();
                }
            }

            // Load bootstrap data
            if (includeBootstrap) {
                console.log('🔄 preloadCommonData() - Loading bootstrap data');
                results.bootstrap = await this.getFplBootstrapData();
                console.log(`✅ preloadCommonData() - Bootstrap loaded: ${results.bootstrap.elements.length} players`);
            }

            // Load enhanced data
            if (includeEnhancedData) {
                if (skipDetailedStats) {
                    console.log('🔄 preloadCommonData() - Loading enhanced data (WITHOUT detailed stats - faster)');
                    results.enhanced = await this.generateEnhancedDataFast();
                } else {
                    console.log('🔄 preloadCommonData() - Loading enhanced data (with detailed stats - slower)');
                    results.enhanced = await this.getEnhancedPlayerData();
                }
                console.log(`✅ preloadCommonData() - Enhanced data loaded: ${results.enhanced.length} players`);
            }

            // Load element summaries
            if (includeElementSummaries) {
                console.log('🔄 preloadCommonData() - Loading element summaries');
                const players = results.bootstrap?.elements || await this.getFplPlayers();
                const playerIds = players.map((p: any) => p.id);
                results.elementSummaries = await this.getBatchPlayerDetailedStats(playerIds);
                console.log(`✅ preloadCommonData() - Element summaries loaded: ${Object.keys(results.elementSummaries).length} players`);
            }

            console.log(`✅ preloadCommonData() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return {
                success: true,
                results,
                duration: performance.now() - startTime
            };
        } catch (error) {
            console.error('❌ preloadCommonData() - Error:', error);
            throw error;
        }
    }

    /**
     * Generate enhanced data and cache it in draft fields with progress tracking
     */
    private async generateAndCacheEnhancedData(): Promise<EnhancedPlayerData[]> {
        const startTime = performance.now();
        console.log('🔄 generateAndCacheEnhancedData() - Starting enhanced data generation...');

        try {
            // Step 1: Get basic data
            console.log('🔄 Step 1/6: Loading basic data...');
            const [sheetsPlayers, allFplPlayers, fplTeams] = await Promise.all([
                readPlayers(),
                this.getFplPlayers(),
                this.getFplTeams(),
            ]);
            console.log(`✅ Step 1/6: Loaded ${allFplPlayers.length} FPL players, ${sheetsPlayers.length} sheets players`);

            // Step 2: Filter FPL players to only include those in sheets
            console.log('🔄 Step 2/6: Filtering players to match sheets...');
            const sheetsPlayerIds = new Set(sheetsPlayers.map(p => p.id));
            const fplPlayers = allFplPlayers.filter(player => sheetsPlayerIds.has(player.id));

            console.log(`✅ Step 2/6: Filtered to ${fplPlayers.length} players that exist in both FPL and sheets`);

            if (fplPlayers.length === 0) {
                throw new Error('No players found that exist in both FPL data and sheets. Check that player IDs match between your sheets and FPL data.');
            }

            // Step 3: Prepare data structures
            console.log('🔄 Step 3/6: Preparing data structures...');
            const playerIds = fplPlayers.map(p => p.id);
            const teams = fplTeams.reduce((acc: Record<number, string>, team) => {
                acc[team.code] = team.name;
                return acc;
            }, {});

            const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, PlayerData>, player) => {
                acc[player.id] = player;
                return acc;
            }, {});
            console.log(`✅ Step 3/6: Prepared data structures for ${playerIds.length} players`);

            // Step 4: Get detailed stats (this is the slow part)
            console.log('🔄 Step 4/6: Fetching detailed player statistics (this may take several minutes)...');
            const fplPlayerGameweeksById = await this.getBatchPlayerDetailedStats(playerIds);
            console.log(`✅ Step 4/6: Fetched detailed stats for ${Object.keys(fplPlayerGameweeksById).length} players`);

            // Step 5: Generate enhanced data
            console.log('🔄 Step 5/6: Generating enhanced player data...');
            const enhancedPlayers = generateSeasonData(fplPlayers, fplPlayerGameweeksById, sheetsPlayersById);
            console.log(`✅ Step 5/6: Generated enhanced data for ${enhancedPlayers.length} players`);

            // Step 6: Cache the results (only for players that have valid data)
            console.log('🔄 Step 6/6: Caching enhanced data...');
            const draftDataById: Record<number, any> = {};
            enhancedPlayers.forEach(player => {
                const playerSheet = sheetsPlayersById[player.id.toString()];
                if (playerSheet) draftDataById[player.id] = player;
            });

            await this.fplCache.updateElementsWithDraft(draftDataById);
            console.log(`✅ Step 6/6: Cached draft data for ${Object.keys(draftDataById).length} players`);

            const totalTime = performance.now() - startTime;
            console.log(`✅ generateAndCacheEnhancedData() - Complete in ${(totalTime / 1000).toFixed(1)}s`);
            return enhancedPlayers;

        } catch (error) {
            const totalTime = performance.now() - startTime;
            console.error(`❌ generateAndCacheEnhancedData() - Failed after ${(totalTime / 1000).toFixed(1)}s:`, error);
            throw error;
        }
    }

    /**
     * Generate enhanced data without detailed stats (faster alternative)
     */
    private async generateEnhancedDataFast(): Promise<EnhancedPlayerData[]> {
        console.log('🔄 generateEnhancedDataFast() - Starting fast enhanced data generation...');

        const [sheetsPlayers, allFplPlayers, fplTeams] = await Promise.all([
            readPlayers(),
            this.getFplPlayers(),
            this.getFplTeams(),
        ]);

        // Filter FPL players to only include those in sheets
        const sheetsPlayerIds = sheetsPlayers.map(p => p.id);
        const fplPlayers = allFplPlayers.filter(player => sheetsPlayerIds[player.id]);

        console.log(`🔄 generateEnhancedDataFast() - Filtered to ${fplPlayers.length} players that exist in both FPL and sheets`);

        if (fplPlayers.length === 0) {
            throw new Error('No players found that exist in both FPL data and sheets. Check that player IDs match between your sheets and FPL data.');
        }

        // Use empty detailed stats for faster generation
        const emptyDetailedStats: Record<number, FplPlayerSeasonData> = {};

        const teams = fplTeams.reduce((acc: Record<number, string>, team) => {
            acc[team.code] = team.name;
            return acc;
        }, {});

        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, PlayerData>, player) => {
            acc[player.id] = player;
            return acc;
        }, {});

        console.log('🔄 generateEnhancedDataFast() - Generating enhanced data (without detailed stats)...');
        const enhancedPlayers = generateSeasonData(fplPlayers, emptyDetailedStats, sheetsPlayersById);

        // Cache the results (only for players that have valid data)
        const draftDataById: Record<number, any> = {};
        enhancedPlayers.forEach(player => {
            const playerSheet = sheetsPlayersById[player.id.toString()];
            if (playerSheet) draftDataById[player.id] = player;
        });

        await this.fplCache.updateElementsWithDraft(draftDataById);
        console.log(`✅ generateEnhancedDataFast() - Complete with ${Object.keys(draftDataById).length} players cached`);

        return enhancedPlayers;
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

            console.log('🔄 getEnhancedPlayerData() - No draft data, generating...');
            const enhancedPlayers = await this.generateAndCacheEnhancedData();
            console.log(`✅ getEnhancedPlayerData() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return enhancedPlayers;
        }, 1200000); // 20 minutes timeout for enhanced data generation
    }
    getCurrentGameweekFromBootstrap = (bootstrap: FplBootstrapData): number => {
        const currentEvent = bootstrap.events.find(event => event.is_current);
        return currentEvent?.id || 1;
    }

    /**
     * Get enhanced player data (with draft calculations)
     */
    async getPlayersById() {
        return this.withPromiseDeduplication('enhanced-players-by-id', async () => {
            const startTime = performance.now();
            console.log('🔄 getPlayersById() - Start');
            const elements = await this.fplCache.getElements();
            const byId = elements.reduce((acc, e) => ({
                ...acc,
                [e.id]: e,
            }), {})
            console.log(`✅ getEnhancedPlayerData() - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
            return byId;
        });
    }

    async getTeamsByCode() {
        return this.withPromiseDeduplication('teams-by-id', async () => {
            const startTime = performance.now();
            console.log('🔄 getTeamsByCode() - Start');
            const elements = await this.fplCache.getTeams();
            const byId = elements.reduce((acc, e) => ({
                ...acc,
                [e.code]: e,
            }), {})
            console.log(`✅ getTeamsByCode() - Cache hit in ${(performance.now() - startTime).toFixed(2)}ms`);
            return byId;
        });
    }

    /**
     * Force regeneration of enhanced data
     */
    async refreshEnhancedData(): Promise<EnhancedPlayerData[]> {
        console.log('🔄 refreshEnhancedData() - Clearing existing draft data...');
        await this.fplCache.clearDraftData();

        // Clear the promise deduplication cache for this key
        this.pendingPromises.delete('enhanced-players');

        return this.withPromiseDeduplication('refresh-enhanced-players', async () => {
            return await this.generateAndCacheEnhancedData();
        }, 1200000); // 20 minutes timeout
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
          }));
    }
}

// Export a singleton instance for easy use
export const fplApiCache = new FplApiCache();

// Export the class for testing or multiple instances
export default FplApiCache;
