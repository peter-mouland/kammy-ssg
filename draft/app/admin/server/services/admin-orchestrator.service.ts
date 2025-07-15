// app/admin/server/services/admin-orchestrator.service.ts

import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { FirestoreClearService } from '../../../_shared/lib/firestore-cache/clear-service';
import { FplFirestore } from '../../../_shared/lib/fpl/fpl-firestore';
import { readPlayers } from '../../../_shared/lib/sheets/players';
import { getDivisionUserTeams } from '../../../_shared/lib/sheets/user-teams';
import type { DraftAction } from '../../../draft/types/draft-types';
import type { DivisionId } from '../../../teams/types/team-types';
import type { AdminDataContext } from '../../types/admin-orchestrator-types';
import { getSystemStatus } from './system-status.service';

const firestore = new FplFirestore();
const clearService = new FirestoreClearService();
interface DraftResult {
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Admin Orchestrator - Coordinates high-level admin operations
 * Enhanced with draft sync comparison data
 */
export class AdminOrchestrator {
    constructor() {
        console.log('🎭 AdminOrchestrator initialized - delegates to system-status service');
    }

    /**
     * Get shared context for orchestration operations
     * Enhanced with draft sync comparison data
     */
    async getSharedContext(): Promise<AdminDataContext> {
        const [fplData, sheetData, cacheStatus] = await Promise.all([
            this.loadFplData(),
            this.loadSheetData(),
            this.loadCacheStatus(),
        ]);

        // Load draft sync comparisons for all divisions
        let draftSyncComparisons = null;
        try {
            const { getAllDraftSyncComparisons } = await import('./draft-sync-comparison.service');
            draftSyncComparisons = await getAllDraftSyncComparisons();
            console.log(`✅ Loaded draft sync comparisons for ${draftSyncComparisons.length} divisions`);
        } catch (error) {
            console.error('❌ Failed to load draft sync comparisons:', error);
            // Don't fail the whole context load if sync comparisons fail
            draftSyncComparisons = [];
        }

        const context: AdminDataContext = {
            fplData,
            sheetData,
            cacheStatus,
            draftSyncComparisons, // NEW: Add sync comparison data
            loadedAt: new Date().toISOString(),
        };
        return context;
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
                    this.invalidateCachesForAction('processDraft');
                    break;
                case 'stopDraft':
                    result = await draftService.stopDraft(params.divisionId);
                    this.invalidateCachesForAction('processDraft');
                    break;
                case 'syncDraft':
                    result = await draftService.syncDraft(params.divisionId);
                    // Invalidate sync comparison cache after sync
                    this.invalidateSyncComparisonCache(params.divisionId);
                    break;
                case 'commitTeamsToFirestore':
                    result = await draftService.commitDraft(params.divisionId);
                    break;
                case 'reset':
                    result = await draftService.resetDraft(params.divisionId);
                    this.invalidateCachesForAction('processDraft');
                    this.invalidateSyncComparisonCache(params.divisionId);
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

    /**
     * Invalidate sync comparison cache for a specific division
     */
    private invalidateSyncComparisonCache(divisionId?: DivisionId): void {
        try {
            // Invalidate the comparison cache for this division and all comparisons
            if (divisionId) {
                dataCache.invalidate(`${CACHE_KEYS.DRAFT_SYNC?.COMPARISON?.(divisionId)}`);
            }
            dataCache.invalidate(`${CACHE_KEYS.DRAFT_SYNC?.ALL_COMPARISONS}`);
            console.log(`🗑️ Draft sync comparison cache invalidated for division: ${divisionId || 'all'}`);
        } catch (error) {
            console.warn('Failed to invalidate sync comparison cache:', error);
        }
    }

    /**
     * Invalidate relevant caches after actions
     */
    private invalidateCachesForAction(action: string): void {
        const cacheKeysToInvalidate = [];

        switch (action) {
            case 'populateBootstrapData': {
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
                break;
            }
        }

        // Invalidate the cache keys
        for (const key of cacheKeysToInvalidate) {
            if (key.includes('*')) {
                console.log(`🗑️ Cache pattern invalidation needed: ${key}`);
                dataCache.invalidatePattern(key);
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
        const { readAllDraftStates } = await import('../../../_shared/lib/sheets/draft');
        const { readDraftOrders } = await import('../../../_shared/lib/sheets/draft-order');
        const { readTransfers } = await import('../../../_shared/lib/sheets/transfers');

        const [
            divisions,
            managers,
            draftStates,
            draftOrder,
            players,
            premierLeagueTransfers,
            championshipTransfers,
            leagueOneTransfers,
        ] = await Promise.all([
            readDivisions(),
            readUserTeams(),
            readAllDraftStates(),
            readDraftOrders(),
            readPlayers(),
            readTransfers('premierLeague'),
            readTransfers('championship'),
            readTransfers('leagueOne'),
        ]);

        return {
            divisions,
            managers,
            draftStates,
            draftOrder,
            players,
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
            return await fplApiCache.getCacheHealth();
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

    public getSystemStatus() {
        return getSystemStatus();
    }

    public async preloadCommonData() {
        const result = await firestore.preloadCommonData();
        this.invalidateCachesForAction('populateBootstrapData');
        return result;
    }

    public async clearAllData() {
        return await clearService.clearAllData();
    }
}
