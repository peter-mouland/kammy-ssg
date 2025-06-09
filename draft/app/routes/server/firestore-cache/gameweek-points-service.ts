// src/lib/firestore-cache/gameweek-points-service.ts
import { FirestoreClient } from './firestore-client';
import { fplApiCache } from '../fpl/api-cache';

export interface GameweekPointsMetadata {
    lastGeneratedGameweek: number;
    lastGeneratedAt: string;
    currentGameweek: number;
    generationHistory: Array<{
        gameweek: number;
        generatedAt: string;
        playerCount: number;
        type: 'full' | 'selective';
    }>;
}

export interface GameweekUpdateResult {
    updated: boolean;
    reason: string;
    gameweeksGenerated: number[];
    playerCount: number;
    previousGameweek?: number;
    currentGameweek: number;
}

export class GameweekPointsService {
    private client: FirestoreClient;
    private readonly METADATA_DOC_ID = 'gameweek-points-metadata';

    constructor() {
        this.client = new FirestoreClient();
    }

    /**
     * Check if gameweek points need updating and perform selective update
     */
    async updateGameweekPointsIfNeeded(): Promise<GameweekUpdateResult> {
        console.log('🔄 GameweekPointsService - Checking if points update needed...');

        try {
            // Get current gameweek from FPL data
            const currentGameweek = await fplApiCache.getCurrentGameweek();
            if (!currentGameweek) {
                throw new Error('Could not determine current gameweek from FPL data');
            }

            // Get metadata about last generation
            const metadata = await this.getPointsMetadata();
            const lastGeneratedGameweek = metadata?.lastGeneratedGameweek || 0;

            console.log(`📊 Current gameweek: ${currentGameweek}, Last generated: ${lastGeneratedGameweek}`);

            // Determine if update is needed
            const updateNeeded = this.shouldUpdatePoints(currentGameweek, lastGeneratedGameweek);

            if (!updateNeeded.needed) {
                console.log(`✅ No update needed: ${updateNeeded.reason}`);
                return {
                    updated: false,
                    reason: updateNeeded.reason,
                    gameweeksGenerated: [],
                    playerCount: 0,
                    currentGameweek,
                    previousGameweek: lastGeneratedGameweek
                };
            }

            console.log(`🔄 Update needed: ${updateNeeded.reason}`);
            console.log(`📝 Will generate gameweeks: ${updateNeeded.gameweeksToGenerate.join(', ')}`);

            // Perform selective points generation
            const generationResult = await this.generatePointsForGameweeks(
                updateNeeded.gameweeksToGenerate,
                currentGameweek
            );

            // Update metadata
            await this.updatePointsMetadata({
                lastGeneratedGameweek: currentGameweek,
                lastGeneratedAt: new Date().toISOString(),
                currentGameweek,
                generationHistory: [
                    ...(metadata?.generationHistory || []).slice(-9), // Keep last 10 entries
                    {
                        gameweek: currentGameweek,
                        generatedAt: new Date().toISOString(),
                        playerCount: generationResult.playerCount,
                        type: 'selective'
                    }
                ]
            });

            console.log(`✅ GameweekPointsService - Update complete`);
            return {
                updated: true,
                reason: updateNeeded.reason,
                gameweeksGenerated: updateNeeded.gameweeksToGenerate,
                playerCount: generationResult.playerCount,
                currentGameweek,
                previousGameweek: lastGeneratedGameweek
            };

        } catch (error) {
            console.error('❌ GameweekPointsService - Update failed:', error);
            throw error;
        }
    }

    /**
     * Determine if points update is needed and which gameweeks to generate
     */
    private shouldUpdatePoints(
        currentGameweek: number,
        lastGeneratedGameweek: number
    ): { needed: boolean; reason: string; gameweeksToGenerate: number[] } {

        // Case 1: Never generated before
        if (lastGeneratedGameweek === 0) {
            return {
                needed: true,
                reason: 'No previous generation found',
                gameweeksToGenerate: [currentGameweek]
            };
        }

        // Case 2: Gameweek has moved forward
        if (currentGameweek > lastGeneratedGameweek) {
            const gameweeksToGenerate = [];

            // Always regenerate the previous gameweek (final scores)
            if (lastGeneratedGameweek > 0) {
                gameweeksToGenerate.push(lastGeneratedGameweek);
            }

            // Always regenerate the current gameweek (live scores)
            gameweeksToGenerate.push(currentGameweek);

            return {
                needed: true,
                reason: `Gameweek changed from ${lastGeneratedGameweek} to ${currentGameweek}`,
                gameweeksToGenerate
            };
        }

        // Case 3: Same gameweek - regenerate current for live updates
        if (currentGameweek === lastGeneratedGameweek) {
            return {
                needed: true,
                reason: `Live update for current gameweek ${currentGameweek}`,
                gameweeksToGenerate: [currentGameweek]
            };
        }

        // Case 4: Current gameweek is somehow less than last generated (shouldn't happen)
        return {
            needed: false,
            reason: `Current gameweek (${currentGameweek}) is less than last generated (${lastGeneratedGameweek})`
        };
    }

    /**
     * Generate points for specific gameweeks
     */
    private async generatePointsForGameweeks(
        targetGameweeks: number[],
        currentGameweek: number
    ): Promise<{ playerCount: number }> {
        console.log(`🔄 Generating points for gameweeks: ${targetGameweeks.join(', ')}`);

        // Import the gameweek points generation function
        const { generateGameweekData } = await import('../../../lib/scoring');
        const { readPlayers } = await import('../sheets/players');

        // Get required data
        const [sheetsPlayers, fplPlayers, fplTeams] = await Promise.all([
            readPlayers(),
            fplApiCache.getFplPlayers(),
            fplApiCache.getFplTeams(),
        ]);

        // Filter FPL players to only include those in sheets
        const sheetsPlayerIds = new Set(sheetsPlayers.map(p => p.id));
        const filteredFplPlayers = fplPlayers.filter(player => sheetsPlayerIds.has(player.id));

        if (filteredFplPlayers.length === 0) {
            throw new Error('No players found that exist in both FPL data and sheets');
        }

        // Get detailed stats for filtered players
        const playerIds = filteredFplPlayers.map(p => p.id);
        const fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(playerIds);

        // Prepare data structures
        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, any>, player) => {
            acc[player.id] = player;
            return acc;
        }, {});

        // Generate gameweek points data for specific gameweeks
        const gameweekPointsById = generateGameweekData(
            filteredFplPlayers,
            fplPlayerGameweeksById,
            sheetsPlayersById,
            targetGameweeks
        );

        // Update element summaries with gameweek points data using existing function
        await fplApiCache['fplCache'].updateElementSummariesWithDraft(gameweekPointsById);

        console.log(`✅ Generated gameweek points for ${Object.keys(gameweekPointsById).length} players`);
        return { playerCount: Object.keys(gameweekPointsById).length };
    }

    /**
     * Get current points generation metadata
     */
    async getPointsMetadata(): Promise<GameweekPointsMetadata | null> {
        try {
            const doc = await this.client.getDocument<GameweekPointsMetadata>(
                this.client.collections.CACHE_STATE,
                this.METADATA_DOC_ID
            );
            return doc ? doc.data : null;
        } catch (error) {
            console.error('Error getting points metadata:', error);
            return null;
        }
    }

    /**
     * Update points generation metadata
     */
    async updatePointsMetadata(metadata: Partial<GameweekPointsMetadata>): Promise<void> {
        try {
            const existing = await this.getPointsMetadata();
            const updatedMetadata: GameweekPointsMetadata = {
                lastGeneratedGameweek: metadata.lastGeneratedGameweek ?? existing?.lastGeneratedGameweek ?? 0,
                lastGeneratedAt: metadata.lastGeneratedAt ?? existing?.lastGeneratedAt ?? new Date().toISOString(),
                currentGameweek: metadata.currentGameweek ?? existing?.currentGameweek ?? 0,
                generationHistory: metadata.generationHistory ?? existing?.generationHistory ?? []
            };

            await this.client.setDocument(
                this.client.collections.CACHE_STATE,
                this.METADATA_DOC_ID,
                {
                    source: 'enhanced',
                    data: updatedMetadata
                }
            );

            console.log('📝 Points metadata updated:', updatedMetadata);
        } catch (error) {
            console.error('Error updating points metadata:', error);
            throw error;
        }
    }

    /**
     * Get points generation status for UI display
     */
    async getPointsStatus(): Promise<{
        lastGenerated: string | null;
        lastGameweek: number;
        currentGameweek: number;
        needsUpdate: boolean;
        reason: string;
    }> {
        try {
            const currentGameweek = await fplApiCache.getCurrentGameweek() || 0;
            const metadata = await this.getPointsMetadata();

            if (!metadata) {
                return {
                    lastGenerated: null,
                    lastGameweek: 0,
                    currentGameweek,
                    needsUpdate: true,
                    reason: 'No previous generation found'
                };
            }

            const updateCheck = this.shouldUpdatePoints(currentGameweek, metadata.lastGeneratedGameweek);

            return {
                lastGenerated: metadata.lastGeneratedAt,
                lastGameweek: metadata.lastGeneratedGameweek,
                currentGameweek,
                needsUpdate: updateCheck.needed,
                reason: updateCheck.reason
            };
        } catch (error) {
            console.error('Error getting points status:', error);
            throw error;
        }
    }

    getAvailableGameweeks(
        fplPlayerGameweeksById: Record<number, any>
    ): number[] {
        const gameweekSet = new Set<number>();

        Object.values(fplPlayerGameweeksById).forEach((playerData: any) => {
            if (playerData?.history) {
                playerData.history.forEach((gw: any) => {
                    gameweekSet.add(gw.round);
                });
            }
        });

        return Array.from(gameweekSet).sort((a, b) => a - b);
    }

    /**
     * Force regeneration of all points (for manual refresh)
     */
    async forceFullRegeneration(): Promise<GameweekUpdateResult> {
        console.log('🔄 GameweekPointsService - Force full regeneration...');

        try {
            const currentGameweek = await fplApiCache.getCurrentGameweek();
            if (!currentGameweek) {
                throw new Error('Could not determine current gameweek');
            }

            // Get sample player data to determine available gameweeks
            const fplPlayers = await fplApiCache.getFplPlayers();
            const playerIds = fplPlayers.map(p => p.id);
            const fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(playerIds);
            const availableGameweeks = this.getAvailableGameweeks(fplPlayerGameweeksById);

            // Regenerate ALL available gameweeks
            const result = await this.generatePointsForGameweeks(availableGameweeks, currentGameweek);

            // Update metadata
            await this.updatePointsMetadata({
                lastGeneratedGameweek: currentGameweek,
                lastGeneratedAt: new Date().toISOString(),
                currentGameweek,
                generationHistory: [
                    {
                        gameweek: currentGameweek,
                        generatedAt: new Date().toISOString(),
                        playerCount: result.playerCount,
                        type: 'full'
                    }
                ]
            });

            return {
                updated: true,
                reason: 'Full regeneration of all gameweeks requested',
                gameweeksGenerated: availableGameweeks,
                playerCount: result.playerCount,
                currentGameweek
            };

        } catch (error) {
            console.error('❌ GameweekPointsService - Force regeneration failed:', error);
            throw error;
        }
    }
}
