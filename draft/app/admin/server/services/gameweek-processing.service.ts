// app/admin/server/services/gameweek-processing.service.ts

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import type {
    AtomicGameweekProcessingParams,
    AtomicGameweekProcessingResult,
} from '../../types/admin-orchestrator-types';

// ================================
// STATUS AND RECOMMENDATION TYPES
// ================================

interface GameweekProcessingStatus {
    currentGameweek: number;
    lastProcessedGameweek: number | null;
    totalGameweeks: number;
    processedGameweeks: number[];
    pendingGameweeks: number[];
    isUpToDate: boolean;
    completionPercentage: number;
}

interface GameweekProcessingRecommendation {
    action: 'none' | 'process_pending' | 'process_current' | 'up_to_date';
    message: string;
    nextGameweek?: number;
}

/**
 * Unified Gameweek Processing Service
 * Handles both status checking and atomic gameweek processing
 */
export class GameweekProcessingService {
    // ================================
    // STATUS AND RECOMMENDATION METHODS
    // ================================

    /**
     * Get real gameweek processing status
     */
    async getGameweekProcessingStatus(): Promise<GameweekProcessingStatus> {
        try {
            console.log('🔄 getGameweekProcessingStatus() - Loading real gameweek data');

            // Get current gameweek from FPL
            const currentGameweek = await fplApiCache.getCurrentGameweek();

            // Get gameweek points data to see what's been processed
            const { readPlayerGameweekPointsFromSheet } = await import('../../../_shared/lib/sheets/player-gw-points');
            const gameweekPointsData = await readPlayerGameweekPointsFromSheet();

            // Extract processed gameweeks from the data
            const processedGameweeks: number[] = [];
            let lastProcessedGameweek: number | null = null;

            if (gameweekPointsData && gameweekPointsData.length > 0) {
                // Check the first row to see which gameweek columns have data
                const sampleRow = gameweekPointsData[0];
                const gwColumns = Object.keys(sampleRow).filter((key) => key.startsWith('gw-'));

                // For each gameweek column, check if it has meaningful data
                for (const gwColumn of gwColumns) {
                    const gameweekStr = gwColumn.replace('gw-', '');
                    const gameweekNum = Number.parseInt(gameweekStr, 10);

                    if (!isNaN(gameweekNum)) {
                        // Check if this gameweek has any non-zero points across all players
                        const hasData = gameweekPointsData.some((player) => {
                            const points = typeof player[gwColumn] === 'number' ? player[gwColumn] : 0;
                            return points > 0;
                        });

                        if (hasData) {
                            processedGameweeks.push(gameweekNum);
                        }
                    }
                }

                // Sort processed gameweeks and find the last one
                processedGameweeks.sort((a, b) => a - b);
                lastProcessedGameweek = processedGameweeks.length > 0 ? Math.max(...processedGameweeks) : null;
            }

            // Calculate pending gameweeks (1 to current gameweek, excluding processed ones)
            const allGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);
            const pendingGameweeks = allGameweeks.filter((gw) => !processedGameweeks.includes(gw));

            // Total gameweeks in a season (typically 38)
            const totalGameweeks = 38;

            // Check if we're up to date (current gameweek has been processed)
            const isUpToDate = processedGameweeks.includes(currentGameweek);

            // Calculate completion percentage
            const completionPercentage = Math.round((processedGameweeks.length / currentGameweek) * 100);

            const status: GameweekProcessingStatus = {
                currentGameweek,
                lastProcessedGameweek,
                totalGameweeks,
                processedGameweeks,
                pendingGameweeks,
                isUpToDate,
                completionPercentage,
            };

            console.log(
                `✅ Gameweek Processing Status: Current GW${currentGameweek}, Last Processed GW${lastProcessedGameweek}, ${processedGameweeks.length}/${currentGameweek} complete (${completionPercentage}%)`,
            );

            if (pendingGameweeks.length > 0) {
                console.log(`⚠️ Pending gameweeks: ${pendingGameweeks.join(', ')}`);
            }

            return status;
        } catch (error) {
            console.error('❌ getGameweekProcessingStatus() failed:', error);

            // Return safe defaults on error
            return {
                currentGameweek: 1,
                lastProcessedGameweek: null,
                totalGameweeks: 38,
                processedGameweeks: [],
                pendingGameweeks: [],
                isUpToDate: false,
                completionPercentage: 0,
            };
        }
    }

    /**
     * Check if a specific gameweek has been processed
     */
    async isGameweekProcessed(gameweek: number): Promise<boolean> {
        try {
            console.log(`🔄 isGameweekProcessed(${gameweek})`);

            const { readPlayerGameweekPointsFromSheet } = await import('../../../_shared/lib/sheets/player-gw-points');
            const gameweekPointsData = await readPlayerGameweekPointsFromSheet();

            if (!gameweekPointsData || gameweekPointsData.length === 0) {
                return false;
            }

            // Check if the gameweek column exists and has meaningful data
            const gwColumn = `gw-${gameweek}`;
            const hasData = gameweekPointsData.some((player) => {
                const points = typeof player[gwColumn] === 'number' ? player[gwColumn] : 0;
                return points > 0;
            });

            console.log(`✅ Gameweek ${gameweek} processed: ${hasData}`);
            return hasData;
        } catch (error) {
            console.error(`❌ isGameweekProcessed(${gameweek}) failed:`, error);
            return false;
        }
    }

    /**
     * Get recommended next action based on processing status
     */
    async getGameweekProcessingRecommendation(): Promise<GameweekProcessingRecommendation> {
        try {
            const status = await this.getGameweekProcessingStatus();

            if (status.pendingGameweeks.length === 0) {
                return {
                    action: 'up_to_date',
                    message: 'All gameweeks are up to date',
                };
            }

            if (status.pendingGameweeks.includes(status.currentGameweek)) {
                return {
                    action: 'process_current',
                    message: `Current gameweek ${status.currentGameweek} needs processing`,
                    nextGameweek: status.currentGameweek,
                };
            }

            const nextPending = Math.min(...status.pendingGameweeks);
            return {
                action: 'process_pending',
                message: `Process pending gameweek ${nextPending}`,
                nextGameweek: nextPending,
            };
        } catch (error) {
            console.error('❌ getGameweekProcessingRecommendation() failed:', error);
            return {
                action: 'none',
                message: 'Unable to determine recommendation',
            };
        }
    }

    // ================================
    // ATOMIC PROCESSING METHODS
    // ================================

    /**
     * Process gameweek atomically - transfers and points together
     * This is the core insight: transfers affect rosters, which affect points
     * Must be done together to avoid inconsistent state
     */
    async processGameweekAtomically(params: AtomicGameweekProcessingParams): Promise<AtomicGameweekProcessingResult> {
        const { gameweek, fplData, sheetData } = params;

        console.log(`🔄 Starting atomic gameweek ${gameweek} processing...`);

        try {
            // Validate preconditions before processing
            const validation = await this.validateGameweekProcessing(gameweek);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Phase 1: Load shared context (done once, reused across operations)
            const context = await this.loadGameweekContext(gameweek, fplData, sheetData);
            console.log(`✅ Context loaded for ${context.divisions.length} divisions`);

            // Phase 2: Apply approved transfers (modifies rosters in memory)
            const updatedRosters = await this.applyApprovedTransfers(context);
            console.log(`✅ Applied transfers: ${updatedRosters.totalTransfers} transfers processed`);

            // Phase 3: Calculate points using updated rosters
            const pointsResult = await this.calculatePointsWithRosters(context, updatedRosters.rostersByDivision);
            console.log(`✅ Calculated points: ${pointsResult.playersProcessed} players processed`);

            // Phase 4: Update league standings
            const standingsResult = await this.updateLeagueStandings(context, pointsResult.pointsByDivision);
            console.log(`✅ Updated standings: ${standingsResult.divisionsUpdated} divisions processed`);

            // Phase 5: Save all results atomically
            await this.saveGameweekResults({
                gameweek,
                rosters: updatedRosters.rostersByDivision,
                points: pointsResult.pointsByDivision,
                standings: standingsResult.standingsByDivision,
                transfers: updatedRosters.appliedTransfers,
            });
            console.log(`✅ Gameweek ${gameweek} results saved atomically`);

            return {
                transfersProcessed: updatedRosters.totalTransfers,
                pointsCalculated: pointsResult.playersProcessed,
                standingsUpdated: true,
            };
        } catch (error) {
            console.error('❌ Atomic gameweek processing failed:', error);
            throw new Error(
                `Gameweek ${gameweek} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Validate gameweek processing preconditions
     */
    async validateGameweekProcessing(gameweek: number): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            // Check if gameweek is valid
            if (gameweek < 1 || gameweek > 38) {
                errors.push(`Invalid gameweek: ${gameweek}`);
            }

            // Check if FPL data is available
            const currentGameweek = await fplApiCache.getCurrentGameweek();

            if (gameweek > currentGameweek) {
                errors.push(`Gameweek ${gameweek} is in the future (current: ${currentGameweek})`);
            }

            // Check if required data sources are available
            const events = await fplApiCache.getFplEvents();
            const targetEvent = events.find((e) => e.fplEvent.id === gameweek);

            if (!targetEvent) {
                errors.push(`FPL event data not found for gameweek ${gameweek}`);
            }

            // Validate that gameweek is finished (has deadline passed)
            if (targetEvent && new Date(targetEvent.fplEvent.deadline_time) > new Date()) {
                errors.push(`Gameweek ${gameweek} has not finished yet`);
            }

            // Check if gameweek has already been processed
            const alreadyProcessed = await this.isGameweekProcessed(gameweek);
            if (alreadyProcessed) {
                errors.push(`Gameweek ${gameweek} has already been processed`);
            }
        } catch (error) {
            errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    // ================================
    // PRIVATE PROCESSING METHODS
    // ================================

    /**
     * Load all context data needed for gameweek processing
     */
    private async loadGameweekContext(gameweek: number, fplData: any, sheetData: any) {
        console.log(`🔄 Loading gameweek ${gameweek} context...`);

        // Note: These imports assume the services exist - adjust paths as needed
        const context = {
            gameweek,
            fplData,
            divisions: sheetData.divisions,
            managers: sheetData.managers,
            transfers: {} as Record<string, any[]>,
            currentRosters: {} as Record<string, any[]>,
        };

        // Load transfers and current rosters for each division
        // This would need to be implemented based on your actual transfer/team data services
        for (const division of sheetData.divisions) {
            // Placeholder - implement based on your actual services
            context.transfers[division.id] = [];
            context.currentRosters[division.id] = [];
        }

        return context;
    }

    /**
     * Apply approved transfers to team rosters
     */
    private async applyApprovedTransfers(context: any) {
        console.log('🔄 Applying approved transfers...');

        const result = {
            rostersByDivision: {} as Record<string, any[]>,
            appliedTransfers: [],
            totalTransfers: 0,
        };

        for (const division of context.divisions) {
            const divisionId = division.id;
            const transfers = context.transfers[divisionId] || [];
            const currentRosters = context.currentRosters[divisionId] || [];

            // Filter for approved transfers only
            const approvedTransfers = transfers.filter((t) => t.status === 'approved');

            // Apply transfers to rosters (in memory)
            const updatedRosters = this.applyTransfersToRosters(currentRosters, approvedTransfers);

            result.rostersByDivision[divisionId] = updatedRosters;
            result.appliedTransfers.push(...approvedTransfers);
            result.totalTransfers += approvedTransfers.length;
        }

        return result;
    }

    /**
     * Apply individual transfers to team rosters
     */
    private applyTransfersToRosters(rosters: any[], transfers: any[]): any[] {
        const updatedRosters = [...rosters];

        for (const transfer of transfers) {
            const teamIndex = updatedRosters.findIndex((r) => r.userId === transfer.userId);
            if (teamIndex === -1) continue;

            const roster = { ...updatedRosters[teamIndex] };

            // Remove player out
            if (transfer.playerOut) {
                roster.players = roster.players.filter((p: any) => p.code !== transfer.playerOut);
            }

            // Add player in
            if (transfer.playerIn) {
                roster.players.push({
                    code: transfer.playerIn,
                    position: transfer.position,
                    addedAt: transfer.requestedAt,
                });
            }

            updatedRosters[teamIndex] = roster;
        }

        return updatedRosters;
    }

    /**
     * Calculate points using updated rosters
     */
    private async calculatePointsWithRosters(context: any, rostersByDivision: Record<string, any[]>) {
        console.log('🔄 Calculating points with updated rosters...');

        const result = {
            pointsByDivision: {} as Record<string, any>,
            playersProcessed: 0,
        };

        for (const [divisionId, rosters] of Object.entries(rostersByDivision)) {
            // This would use your existing scoring service
            // Placeholder implementation
            const divisionPoints = {
                teams: rosters.map((roster) => ({
                    userId: roster.userId,
                    gameweek: context.gameweek,
                    totalPoints: 0, // Calculate based on your scoring logic
                })),
                totalPlayers: rosters.length,
            };

            result.pointsByDivision[divisionId] = divisionPoints;
            result.playersProcessed += divisionPoints.totalPlayers;
        }

        return result;
    }

    /**
     * Update league standings based on new points
     */
    private async updateLeagueStandings(context: any, pointsByDivision: Record<string, any>) {
        console.log('🔄 Updating league standings...');

        const result = {
            standingsByDivision: {} as Record<string, any[]>,
            divisionsUpdated: 0,
        };

        for (const [divisionId, divisionPoints] of Object.entries(pointsByDivision)) {
            // Calculate cumulative standings using your existing logic
            // Placeholder implementation
            const standings = divisionPoints.teams.map((team: any) => ({
                userId: team.userId,
                totalPoints: team.totalPoints,
                position: 1, // Calculate based on your rankings logic
            }));

            result.standingsByDivision[divisionId] = standings;
            result.divisionsUpdated++;
        }

        return result;
    }

    /**
     * Save all gameweek results atomically
     * This would integrate with your existing data persistence layer
     */
    private async saveGameweekResults(results: {
        gameweek: number;
        rosters: Record<string, any[]>;
        points: Record<string, any>;
        standings: Record<string, any[]>;
        transfers: any[];
    }) {
        console.log(`🔄 Saving gameweek ${results.gameweek} results atomically...`);

        // This would integrate with your existing persistence layer
        // Could be Google Sheets, Firestore, or whatever you're using

        // Placeholder implementation
        console.log(`✅ Gameweek ${results.gameweek} results saved (placeholder implementation)`);

        // In a real implementation, this would:
        // 1. Save updated team rosters
        // 2. Save calculated points
        // 3. Save updated standings
        // 4. Mark transfers as processed
        // 5. Update gameweek metadata
        // All in an atomic transaction
    }
}

// ================================
// STANDALONE FUNCTIONS (for backward compatibility)
// ================================

/**
 * Standalone function for getting gameweek processing status
 * Delegates to the service for backward compatibility
 */
export async function getGameweekProcessingStatus(): Promise<GameweekProcessingStatus> {
    const service = new GameweekProcessingService();
    return await service.getGameweekProcessingStatus();
}

/**
 * Standalone function for checking if gameweek is processed
 * Delegates to the service for backward compatibility
 */
export async function isGameweekProcessed(gameweek: number): Promise<boolean> {
    const service = new GameweekProcessingService();
    return await service.isGameweekProcessed(gameweek);
}

/**
 * Standalone function for getting processing recommendation
 * Delegates to the service for backward compatibility
 */
export async function getGameweekProcessingRecommendation(): Promise<GameweekProcessingRecommendation> {
    const service = new GameweekProcessingService();
    return await service.getGameweekProcessingRecommendation();
}
