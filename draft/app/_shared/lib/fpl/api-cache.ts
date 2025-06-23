/* Location: app/_shared/lib/fpl/api-cache.ts */

import { generateSeasonData } from '../../../scoring/lib'; // todo: shared lib should not have a domain in it
import type { EnhancedPlayerData, PlayersByCode } from '../../../scoring/types/scoring-types';
import type { PlayersSheetData } from '../../types/sheets-types';
import { processBatched } from '../batch-processor';
import { readPlayers } from '../sheets/players';
import { fplApi } from './api';
import { FplFirestore } from './fpl-firestore';
import type { FplPlayerSeasonData } from './fpl-types';

/**
 * FPL Data Orchestrator - manages cache and API calls
 * Provides intelligent data fetching with Firestore caching
 */
export class FplApiCache {
    fplFirestore: FplFirestore;
    private pendingPromises: Map<string, Promise<any>> = new Map();

    constructor() {
        this.fplFirestore = new FplFirestore();
    }

    /**
     * Deduplicate promises to prevent multiple simultaneous calls to same method
     */
    private async withPromiseDeduplication<T>(
        key: string,
        promiseFactory: () => Promise<T>,
        timeoutMs: number = 30000,
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
     * Get all FPL players
     */
    async getFplPlayers(): Promise<EnhancedPlayerData[]> {
        return this.withPromiseDeduplication('players', async () => {
            console.log('🔄 getFplPlayers() - Start');

            try {
                const cached = await this.fplFirestore.getElements();
                return cached;
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
            console.log('🔄 getFplTeams()');
            const cached = await this.fplFirestore.getTeams();
            return cached;
        });
    }
    /**
     * Get FPL events
     */
    async getFplEvents() {
        return this.withPromiseDeduplication('events', async () => {
            console.log('🔄 getFplEvents()');
            const cached = await this.fplFirestore.getEvents();
            return cached;
        });
    }

    /**
     * Get current gameweek
     */
    async getCurrentGameweek() {
        return this.withPromiseDeduplication('current-gameweek', async () => {
            console.log('🔄 getCurrentGameweek() ');
            const cached = await this.fplFirestore.getCurrentGameweek();
            return cached;
        });
    }
    /**
     * Get current gameweek
     */
    async getCurrentGameweekData() {
        return this.withPromiseDeduplication('current-gameweek-data', async () => {
            console.log('🔄 getCurrentGameweek() ');
            return await this.fplFirestore.getCurrentGameweekData();
        });
    }

    // === PLAYER DATA ORCHESTRATION ===

    /**
     * Get FPL player by ID
     */
    async getFplPlayer(playerCode: number): Promise<EnhancedPlayerData | null> {
        return this.withPromiseDeduplication(`player-${playerCode}`, async () => {
            console.log(`🔄 getFplPlayer(${playerCode})`);
            const players = await this.fplFirestore.getPlayersByCodes([playerCode]);
            const result = players.length > 0 ? players[0] : null;
            return result;
        });
    }

    /**
     * Get player detailed stats (element summary)
     */
    async getPlayerDetailedStats(playerId: number): Promise<FplPlayerSeasonData | null> {
        return this.withPromiseDeduplication(`element-summary-${playerId}`, async () => {
            console.log(`🔄 getPlayerDetailedStats(${playerId})`);

            const cached = await this.fplFirestore.getElementGameweeks(playerId);
            return cached;
        });
    }

    /**
     * Batch get player detailed stats (with internal chunking)
     */
    async getBatchPlayerDetailedStats(playerIds: number[]): Promise<Record<number, FplPlayerSeasonData>> {
        return this.withPromiseDeduplication(
            `batch-element-summaries-${playerIds.join(',')}`,
            async () => {
                console.log(`🔄 getBatchPlayerDetailedStats([${playerIds.length} players])`);
                const cached = await this.fplFirestore.batchGetElementSummaries(playerIds);
                return cached;
            },
            600000,
        ); // 10 minutes timeout for large batches
    }

    async populatePlayerDetailedStats(playerIds: number[]): Promise<Record<number, FplPlayerSeasonData>> {
        console.log(`🔄 populatePlayerDetailedStats([${playerIds.length} players]) - Start`);

        // Fetch missing players from API in manageable chunks
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
            await this.fplFirestore.populateElementSummaries(freshData);
            return freshData;
        }
        return {};
    }

    /**
     * Search players by name
     */
    async searchPlayersByName(searchTerm: string): Promise<EnhancedPlayerData[]> {
        console.log(`🔄 searchPlayersByName("${searchTerm}") - Start`);
        const result = await this.fplFirestore.searchPlayersByName(searchTerm);
        return result;
    }

    /**
     * Get comprehensive cache status
     */
    async getCacheStatus() {
        const startTime = performance.now();
        console.log('🔄 getCacheStatus() - Start');

        try {
            const [teamsCount, eventsCount, elementsCount, hasDraftData, elementSummariesCount, currentGameweek] =
                await Promise.all([
                    this.fplFirestore.getTeamsCount(),
                    this.fplFirestore.getEventsCount(),
                    this.fplFirestore.getElementsCount(),
                    this.fplFirestore.hasDraftData(),
                    this.fplFirestore.getElementSummariesCount(),
                    this.fplFirestore.getCurrentGameweek().catch(() => null),
                ]);

            // Check what's missing
            const missingData = {
                teams: teamsCount === 0,
                events: eventsCount === 0,
                elements: elementsCount === 0,
                draftData: !hasDraftData,
                elementSummaries: elementSummariesCount === 0,
                gameweek: !currentGameweek,
            };

            const status = {
                timestamp: new Date().toISOString(),
                counts: {
                    teams: teamsCount,
                    events: eventsCount,
                    elements: elementsCount,
                    elementSummaries: elementSummariesCount,
                    currentGameweek,
                },
                missing: missingData,
                hasBootstrapData: !missingData.teams && !missingData.events && !missingData.elements,
                hasEnhancedData: !missingData.draftData && elementsCount > 0,
                completionPercentage: this.calculateCompletionPercentage(missingData),
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

        if (status.missing.elementSummaries && status.counts.elements > 0) {
            if (health.overall !== 'critical') health.overall = 'warning';
            health.issues.push('Missing detailed player statistics');
            health.recommendations.push('Run "Populate Element Summaries" for detailed stats');
        }

        return {
            ...status,
            health,
        };
    }

    /**
     * Preload common data based on what's missing
     */
    async preloadCommonData(
        options: {
            includeBootstrap?: boolean;
            includeEnhancedData?: boolean;
            includeElementSummaries?: boolean;
            forceRefresh?: boolean;
            skipDetailedStats?: boolean;
        } = {},
    ) {
        const startTime = performance.now();
        console.log('🔄 preloadCommonData() - Start', options);

        const {
            includeBootstrap = true,
            includeEnhancedData = false,
            includeElementSummaries = false,
            forceRefresh = false,
        } = options;

        const results: any = {};

        try {
            // If force refresh, clear existing data first
            if (forceRefresh) {
                console.log('🔄 preloadCommonData() - Force refresh, clearing existing data');
                if (includeBootstrap) {
                    await this.fplFirestore.clearBootstrapData();
                }
                if (includeEnhancedData) {
                    await this.fplFirestore.clearDraftData();
                }
                if (includeElementSummaries) {
                    await this.fplFirestore.clearElementSummaries();
                }
            }

            // Load bootstrap data
            if (includeBootstrap) {
                console.log('🔄 preloadCommonData() - Loading bootstrap data');
                const fresh = await this.fplFirestore.populateBootstrap();
                results.bootstrap = fresh;
                console.log(`✅ preloadCommonData() - Bootstrap loaded: ${results.bootstrap.elements.length} players`);
            }

            // Load enhanced data
            if (includeEnhancedData) {
                console.log('🔄 preloadCommonData() - Loading enhanced data (with detailed stats - slower)');
                const fresh = await this.generateAndCacheEnhancedData();
                results.enhanced = fresh;
                console.log(`✅ preloadCommonData() - Enhanced data loaded: ${results.enhanced.length} players`);
            }

            // Load element summaries
            if (includeElementSummaries) {
                console.log('🔄 preloadCommonData() - Loading element summaries');
                const sheetsPlayers = await readPlayers();
                const playerIds = sheetsPlayers.map((p: any) => p.id);
                const playerDetailedStats = await this.populatePlayerDetailedStats(playerIds);
                results.elementSummaries = playerDetailedStats;
                console.log(
                    `✅ preloadCommonData() - Element summaries loaded: ${Object.keys(results.elementSummaries).length} players`,
                );
            }

            console.log(`✅ preloadCommonData() - Complete in ${(performance.now() - startTime).toFixed(2)}ms`);
            return {
                success: true,
                results,
                duration: performance.now() - startTime,
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
        console.log('🔄 generateAndCacheEnhancedData() - Starting enhanced data generation...');

        try {
            // Step 1: Get basic data
            console.log('🔄 Step 1/6: Loading basic data...');
            const [sheetsPlayers, allFplPlayers] = await Promise.all([readPlayers(), this.getFplPlayers()]);

            console.log(
                `✅ Step 1/6: Loaded ${allFplPlayers.length} FPL players, ${sheetsPlayers.length} sheets players`,
            );

            // Step 2: Filter FPL players to only include those in sheets
            console.log('🔄 Step 2/6: Filtering players to match sheets...');
            const sheetsPlayerIds = new Set(sheetsPlayers.map((p) => p.id));
            const fplPlayers = allFplPlayers.filter((player) => sheetsPlayerIds.has(player.id));
            const playerIds = fplPlayers.map((p) => p.id);
            const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
                acc[player.id] = player;
                return acc;
            }, {});

            console.log(`✅ Step 2/6: Filtered to ${fplPlayers.length} players that exist in both FPL and sheets`);

            if (fplPlayers.length === 0) {
                throw new Error(
                    'No players found that exist in both FPL data and sheets. Check that player IDs match between your sheets and FPL data.',
                );
            }

            // Step 4: Get detailed stats (this is the slow part)
            console.log('🔄 Step 4/6: Fetching detailed player statistics (this may take several minutes)...');
            const fplPlayerGameweeksById = await this.getBatchPlayerDetailedStats(playerIds);
            console.log(
                `✅ Step 4/6: Fetched detailed stats for ${Object.keys(fplPlayerGameweeksById).length} players`,
            );

            // Step 5: Generate enhanced data
            console.log('🔄 Step 5/6: Generating enhanced player data...');
            const enhancedPlayers = generateSeasonData(fplPlayers, fplPlayerGameweeksById, sheetsPlayersById);
            console.log(`✅ Step 5/6: Generated enhanced data for ${enhancedPlayers.length} players`);

            // Step 6: Cache the results (only for players that have valid data)
            console.log('🔄 Step 6/6: Caching enhanced data...');
            const draftDataById: Record<number, any> = {};
            enhancedPlayers.forEach((player) => {
                const playerSheet = sheetsPlayersById[player.id.toString()];
                if (playerSheet) draftDataById[player.id] = player;
            });

            await this.fplFirestore.updateElementsWithDraft(draftDataById);

            console.log('✅ generateAndCacheEnhancedData() - Complete ');
            return enhancedPlayers;
        } catch (error) {
            console.error('❌ generateAndCacheEnhancedData() - Failed ', error);
            throw error;
        }
    }

    /**
     * Get enhanced player data (with draft calculations)
     */
    async getPlayersById() {
        return this.withPromiseDeduplication('enhanced-players-by-id', async () => {
            console.log('🔄 getPlayersById()');
            const elements = await this.fplFirestore.getElements();
            const byId = elements.reduce(
                (acc, e) => ({
                    ...acc,
                    [e.id]: e,
                }),
                {},
            );
            return byId;
        });
    }

    async getPlayersByCode(): Promise<PlayersByCode> {
        return this.withPromiseDeduplication('enhanced-players-by-code', async () => {
            console.log('🔄 getPlayersByCode()');
            const elements = await this.fplFirestore.getElements();
            const byCode = elements.reduce(
                (acc, e) => ({
                    ...acc,
                    [e.code]: e,
                }),
                {},
            );
            return byCode;
        });
    }

    async getTeamsByCode() {
        return this.withPromiseDeduplication('teams-by-id', async () => {
            console.log('🔄 getTeamsByCode()');
            const elements = await this.fplFirestore.getTeams();
            const byId = elements.reduce(
                (acc, e) => ({
                    ...acc,
                    [e.code]: e,
                }),
                {},
            );
            return byId;
        });
    }

    /**
     * Force regeneration of enhanced data
     */
    async refreshEnhancedData(): Promise<EnhancedPlayerData[]> {
        console.log('🔄 refreshEnhancedData() - Clearing existing draft data...');
        await this.fplFirestore.clearDraftData();

        // Clear the promise deduplication cache for this key
        this.pendingPromises.delete('enhanced-players');

        return this.withPromiseDeduplication(
            'refresh-enhanced-players',
            async () => {
                return await this.generateAndCacheEnhancedData();
            },
            1200000,
        ); // 20 minutes timeout
    }
}

// Export a singleton instance for easy use
export const fplApiCache = new FplApiCache();

// Export the class for testing or multiple instances
export default FplApiCache;
