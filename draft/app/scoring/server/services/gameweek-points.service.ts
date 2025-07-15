// app/scoring/server/services/gameweek-points.service.ts
import { FirestoreClient } from '../../../_shared/lib/firestore-cache/firestore-client';
import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';

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
    pointsPopulationResult?: {
        divisionsProcessed: number;
        documentsUpdated: number;
        playersUpdated: number;
        errors: string[];
    };
}

export class GameweekPointsService {
    private client: FirestoreClient;
    private readonly METADATA_DOC_ID = 'gameweek-points-metadata';

    constructor() {
        this.client = new FirestoreClient();
    }

    /**
     * Determine if points update is needed and which gameweeks to generate
     */
    private async shouldUpdatePoints(): Promise<{
        needed: boolean;
        reason: string;
        gameweeksToGenerate: GameWeekData['fplEvent']['id'][];
    }> {
        const currentGameweekId = (await fplApiCache.getCurrentGameweek()) || 0;
        const meta = await this.getPointsMetadata();
        const lastGeneratedGameweek = meta?.lastGeneratedGameweek || 0;

        // Case 1: Never generated before
        if (lastGeneratedGameweek === 0) {
            return {
                needed: true,
                reason: 'No previous generation found',
                gameweeksToGenerate: [currentGameweekId],
            };
        }

        // Case 2: Gameweek has moved forward
        if (currentGameweekId > lastGeneratedGameweek) {
            const gameweeksToGenerate = [];

            // Always regenerate the previous gameweek (final scores)
            if (lastGeneratedGameweek > 0) {
                gameweeksToGenerate.push(lastGeneratedGameweek);
            }

            // Always regenerate the current gameweek (live scores)
            gameweeksToGenerate.push(currentGameweekId);

            return {
                needed: true,
                reason: `Gameweek changed from ${lastGeneratedGameweek} to ${currentGameweekId}`,
                gameweeksToGenerate,
            };
        }

        // Case 3: Same gameweek - regenerate current for live updates
        if (currentGameweekId === lastGeneratedGameweek) {
            return {
                needed: true,
                reason: `Live update for current gameweek ${currentGameweekId}`,
                gameweeksToGenerate: [currentGameweekId],
            };
        }

        // Case 4: Current gameweek is somehow less than last generated (shouldn't happen)
        return {
            needed: false,
            reason: `Current gameweek (${currentGameweekId}) is less than last generated (${lastGeneratedGameweek})`,
            gameweeksToGenerate: [],
        };
    }

    /**
     * Get points metadata from cache
     */
    private async getPointsMetadata(): Promise<GameweekPointsMetadata | null> {
        try {
            const doc = await this.client.getDocument<GameweekPointsMetadata>(
                this.client.collections.CACHE_STATE,
                this.METADATA_DOC_ID,
            );

            return doc?.data || null;
        } catch (error) {
            console.error('Error getting points metadata:', error);
            return null;
        }
    }

    /**
     * Update points metadata in cache
     */
    async updatePointsMetadata(metadata: Partial<GameweekPointsMetadata>): Promise<void> {
        try {
            const existing = await this.getPointsMetadata();

            const updatedMetadata: GameweekPointsMetadata = {
                lastGeneratedGameweek: metadata.lastGeneratedGameweek ?? existing?.lastGeneratedGameweek ?? 0,
                lastGeneratedAt: metadata.lastGeneratedAt ?? existing?.lastGeneratedAt ?? new Date().toISOString(),
                currentGameweek: metadata.currentGameweek ?? existing?.currentGameweek ?? 0,
                generationHistory: metadata.generationHistory ?? existing?.generationHistory ?? [],
            };

            await this.client.setDocument(this.client.collections.CACHE_STATE, this.METADATA_DOC_ID, {
                source: 'enhanced',
                data: updatedMetadata,
            });
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
        currentGameweek: GameWeekData;
        needsUpdate: boolean;
        reason: string;
    }> {
        try {
            const currentGameweek = await fplApiCache.getCurrentGameweekData();
            const metadata = await this.getPointsMetadata();

            if (!metadata) {
                return {
                    lastGenerated: null,
                    lastGameweek: 0,
                    currentGameweek,
                    needsUpdate: true,
                    reason: 'No previous generation found',
                };
            }

            const updateCheck = await this.shouldUpdatePoints();

            return {
                lastGenerated: metadata.lastGeneratedAt,
                lastGameweek: metadata.lastGeneratedGameweek,
                currentGameweek,
                needsUpdate: updateCheck.needed,
                reason: updateCheck.reason,
            };
        } catch (error) {
            console.error('Error getting points status:', error);
            throw error;
        }
    }

    createGameweekIds(gw: number) {
        return Array.from({ length: gw }, (_, i) => i + 1);
    }
}
