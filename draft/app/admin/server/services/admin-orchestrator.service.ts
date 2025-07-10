// app/admin/server/services/admin-orchestrator.service.ts

import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { getDivisionUserTeams } from '../../../_shared/lib/sheets/user-teams';
import type { DraftAction } from '../../../draft/types/draft-types';
import type { DivisionId } from '../../../teams/types/team-types';
import type { AdminDataContext, GameweekStatusSummary } from '../../types/admin-orchestrator-types';
import { getSystemStatus } from './system-status.service';

interface SmartUpdateResult {
    success: boolean;
    message: string;
    actionsPerformed: string[];
    errors: string[];
}

interface DraftResult {
    success: boolean;
    message: string;
    data?: any;
}

interface GameweekResult {
    success: boolean;
    message: string;
    gameweek: number;
    transfersProcessed: number;
    pointsCalculated: number;
    standingsUpdated: boolean;
}

/**
 * Admin Orchestrator - Coordinates high-level admin operations
 * Uses system-status.service.ts directly (no more redundant wrapper)
 */
export class AdminOrchestrator {
    constructor() {
        console.log('🎭 AdminOrchestrator initialized - delegates to system-status service');
    }

    /**
     * Get shared context for orchestration operations
     * Uses DataCacheService for caching
     */
    async getSharedContext(): Promise<AdminDataContext> {
        console.log('🔄 AdminOrchestrator.getSharedContext() - Loading fresh context');
        const [fplData, sheetData, cacheStatus, gameweekStatus] = await Promise.all([
            this.loadFplData(),
            this.loadSheetData(),
            this.loadCacheStatus(),
            this.loadGameweekStatus(),
        ]);

        const context: AdminDataContext = {
            fplData,
            sheetData,
            cacheStatus,
            gameweekStatus,
            loadedAt: new Date().toISOString(),
        };

        console.log('✅ AdminOrchestrator.getSharedContext() - Context loaded');
        return context;
    }

    /**
     * Execute smart update - analyzes system and performs needed actions
     */
    async executeSmartUpdate(): Promise<SmartUpdateResult> {
        try {
            console.log('🔄 AdminOrchestrator.executeSmartUpdate() - Starting smart update');

            // Use system-status service to determine what actions are needed
            const systemStatus = await getSystemStatus();
            const actions = this.determineSmartActions(systemStatus);

            if (actions.length === 0) {
                return {
                    success: true,
                    message: 'System is healthy - no actions needed',
                    actionsPerformed: [],
                    errors: [],
                };
            }

            // Execute the recommended actions
            const executedActions = [];
            const errors = [];

            for (const action of actions) {
                try {
                    console.log(`🔄 Executing smart action: ${action}`);

                    // Execute action based on type
                    const result = await this.executeSmartAction(action);

                    if (result.success) {
                        executedActions.push(action);
                    } else {
                        errors.push(`${action}: ${result.message}`);
                    }

                    // Invalidate relevant caches after each action
                    this.invalidateCachesForAction(action);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`${action}: ${errorMessage}`);
                    console.error(`❌ Smart action ${action} failed:`, error);
                }
            }

            return {
                success: errors.length === 0,
                message: `Smart update completed - ${executedActions.length} actions executed, ${errors.length} errors`,
                actionsPerformed: executedActions,
                errors,
            };
        } catch (error) {
            console.error('❌ AdminOrchestrator.executeSmartUpdate() failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Smart update failed',
                actionsPerformed: [],
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }

    /**
     * Process gameweek
     */
    async processGameweek(params: { gameweek: number; fplData: any; sheetData: any }): Promise<GameweekResult> {
        try {
            console.log(`🔄 AdminOrchestrator.processGameweek(${params.gameweek})`);

            const { GameweekProcessingService } = await import('./gameweek-processing.service');
            const processingService = new GameweekProcessingService();
            const systemStatus = await getSystemStatus();

            const result = await processingService.processGameweekAtomically({
                gameweek: params.gameweek,
                fplData: params.fplData,
                sheetData: params.sheetData,
                transferStatus: systemStatus.transfers,
            });

            // Invalidate caches after gameweek processing
            this.invalidateCachesForAction('processGameweek');

            return {
                success: true,
                message: `Gameweek ${params.gameweek} processed successfully`,
                gameweek: params.gameweek,
                transfersProcessed: result.transfersProcessed,
                pointsCalculated: result.pointsCalculated,
                standingsUpdated: result.standingsUpdated,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Gameweek processing failed',
                gameweek: params.gameweek,
                transfersProcessed: 0,
                pointsCalculated: 0,
                standingsUpdated: false,
            };
        }
    }

    /**
     * Process draft operations
     */
    async processDraft(params: { type: DraftAction; divisionId: DivisionId }): Promise<DraftResult> {
        try {
            console.log(`🔄 AdminOrchestrator.processDraft(${params.type}, ${params.divisionId})`);

            const managers = await getDivisionUserTeams(params.divisionId);
            const { DraftService } = await import('./draft.service');
            const draftService = new DraftService();

            let result: DraftResult;
            switch (params.type) {
                case 'generateOrder':
                    result = await draftService.generateOrder(params.divisionId, managers);
                    break;
                case 'startDraft':
                    result = await draftService.startDraft(params.divisionId);
                    break;
                case 'stopDraft':
                    result = await draftService.stopDraft();
                    break;
                case 'sync':
                    result = await draftService.syncDraft(params.divisionId);
                    break;
                case 'commitTeamsToFirestore':
                    result = await draftService.commitDraft(params.divisionId);
                    break;
                case 'reset':
                    result = await draftService.resetDraft(params.divisionId);
                    break;
                default:
                    throw new Error(`Unknown draft action: ${params.type}`);
            }

            // Invalidate caches after draft processing
            this.invalidateCachesForAction('processDraft');

            return {
                success: result.success,
                message: result.message,
                data: result.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Draft processing failed',
            };
        }
    }

    // ================================
    // PRIVATE HELPER METHODS
    // ================================

    /**
     * Determine what smart actions are needed based on system status
     */
    private determineSmartActions(systemStatus: any): string[] {
        const actions = [];

        // FPL Cache actions
        if (systemStatus.systemHealth.fplCache.status === 'critical') {
            actions.push('populateBootstrapData');
        } else if (systemStatus.systemHealth.fplCache.status === 'warning') {
            actions.push('generateEnhancedData');
        }

        // Transfer actions
        if (systemStatus.transfers.pending > 0) {
            actions.push('processTransfers');
        }

        // Gameweek actions
        if (!systemStatus.gameweekProcessing.isUpToDate) {
            actions.push('updateGameweekPoints');
        }

        return actions;
    }

    /**
     * Execute a specific smart action
     */
    private async executeSmartAction(action: string): Promise<{ success: boolean; message: string }> {
        try {
            switch (action) {
                case 'populateBootstrapData': {
                    const { handlePopulateBootstrapData } = await import('../actions/data-actions');
                    return await handlePopulateBootstrapData();
                }

                case 'generateEnhancedData': {
                    const { handleGenerateEnhancedData } = await import('../actions/data-actions');
                    return await handleGenerateEnhancedData();
                }

                // case 'processTransfers': {
                //     const { handleProcessTransfers } = await import('../actions/transfer-actions');
                //     return await handleProcessTransfers();
                // }

                case 'updateGameweekPoints': {
                    const { handleGenerateGameweekPoints } = await import('../actions/points-actions');
                    return await handleGenerateGameweekPoints();
                }

                default: {
                    return {
                        success: false,
                        message: `Unknown smart action: ${action}`,
                    };
                }
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Action execution failed',
            };
        }
    }

    /**
     * Invalidate relevant caches after actions
     */
    private invalidateCachesForAction(action: string): void {
        const cacheKeysToInvalidate = [];

        switch (action) {
            case 'populateBootstrapData':
            case 'generateEnhancedData': {
                cacheKeysToInvalidate.push(CACHE_KEYS.FPL.PLAYERS, CACHE_KEYS.FPL.TEAMS, CACHE_KEYS.FPL.EVENTS);
                break;
            }

            case 'processTransfers':
            case 'processDraft': {
                cacheKeysToInvalidate.push(
                    'transfers:*', // Pattern to invalidate all transfer caches
                    'draft:*', // Pattern to invalidate all draft caches
                );
                break;
            }

            case 'updateGameweekPoints':
            case 'processGameweek': {
                cacheKeysToInvalidate.push(
                    'gameweek:*', // Pattern to invalidate all gameweek caches
                    'scoring:*', // Pattern to invalidate all scoring caches
                );
                break;
            }

            default: {
                // Invalidate admin context for any action
                // cacheKeysToInvalidate.push(CACHE_KEYS.ADMIN.CONTEXT);
                break;
            }
        }

        // Invalidate the cache keys
        for (const key of cacheKeysToInvalidate) {
            if (key.includes('*')) {
                // Handle pattern invalidation if needed
                console.log(`🗑️ Cache pattern invalidation needed: ${key}`);
                // TODO: Implement pattern invalidation in DataCacheService if needed
            } else {
                dataCache.invalidate(key);
                console.log(`🗑️ Cache invalidated: ${key}`);
            }
        }
    }

    // ================================
    // DATA LOADING METHODS
    // ================================

    /**
     * Load FPL data
     */
    private async loadFplData() {
        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');

        const [players, teams, events, currentGameweek] = await Promise.all([
            fplApiCache.getFplPlayers(),
            fplApiCache.getFplTeams(),
            fplApiCache.getFplEvents(),
            fplApiCache.getCurrentGameweek(),
        ]);

        return {
            players,
            teams,
            events,
            currentGameweek,
        };
    }

    /**
     * Load Sheet data
     */
    private async loadSheetData() {
        const { readDivisions } = await import('../../../_shared/lib/sheets/divisions');
        const { readUserTeams } = await import('../../../_shared/lib/sheets/user-teams');
        const { readDraftState } = await import('../../../_shared/lib/sheets/draft');
        const { readDraftOrders } = await import('../../../_shared/lib/sheets/draft-order');
        const { readTransfers } = await import('../../../_shared/lib/sheets/transfers');

        const [
            divisions,
            managers,
            draftState,
            draftOrder,
            premierLeagueTransfers,
            championshipTransfers,
            leagueOneTransfers,
        ] = await Promise.all([
            readDivisions(),
            readUserTeams(),
            readDraftState(),
            readDraftOrders(),
            readTransfers('premierLeague'),
            readTransfers('championship'),
            readTransfers('leagueOne'),
        ]);

        return {
            divisions,
            managers,
            draftState,
            draftOrder,
            transfers: {
                premierLeague: premierLeagueTransfers,
                championship: championshipTransfers,
                leagueOne: leagueOneTransfers,
            },
        };
    }

    /**
     * Load cache status
     */
    private async loadCacheStatus() {
        try {
            const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');
            const cacheHealth = await fplApiCache.getCacheHealth();

            // Map FPL cache health status to AdminDataContext expected types
            let healthStatus: 'healthy' | 'warning' | 'unknown' | 'unhealthy';
            const overallHealth = cacheHealth.health?.overall;

            if (overallHealth === 'healthy') {
                healthStatus = 'healthy';
            } else if (overallHealth === 'warning') {
                healthStatus = 'warning';
            } else if (overallHealth === 'critical') {
                healthStatus = 'unhealthy'; // Map 'critical' to 'unhealthy'
            } else {
                healthStatus = 'unknown';
            }

            return {
                health: healthStatus,
                completionPercentage: cacheHealth.completionPercentage || 0,
                lastUpdated: cacheHealth.lastUpdated || null,
            };
        } catch (_error) {
            return {
                health: 'unhealthy' as const, // Use 'unhealthy' instead of 'critical'
                completionPercentage: 0,
                lastUpdated: null,
            };
        }
    }

    /**
     * Load gameweek status
     */
    private async loadGameweekStatus(): Promise<GameweekStatusSummary> {
        try {
            const { GameweekPointsService } = await import('../../../scoring/server/services/gameweek-points.service');
            const pointsService = new GameweekPointsService();
            const pointsStatus = await pointsService.getPointsStatus();
            const currentGameweek = await fplApiCache.getCurrentGameweekData();

            return {
                currentGameweek: currentGameweek,
                lastProcessedGameweek: pointsStatus.lastGameweek,
                needsProcessing: pointsStatus.currentGameweek > pointsStatus.lastGameweek,
                pendingGameweeks:
                    pointsStatus.currentGameweek > pointsStatus.lastGameweek
                        ? Array.from(
                              { length: pointsStatus.currentGameweek - pointsStatus.lastGameweek },
                              (_, i) => pointsStatus.lastGameweek + i + 1,
                          )
                        : [],
                isProcessing: false,
                lastProcessedAt: null, // todo
            };
        } catch (error) {
            console.error('Failed to load gameweek status:', error);
            return {
                currentGameweek: null,
                lastProcessedGameweek: null,
                needsProcessing: false,
                pendingGameweeks: [],
                lastProcessedAt: null,
                isProcessing: false,
            };
        }
    }

    public getSystemStatus() {
        return getSystemStatus();
    }
}
