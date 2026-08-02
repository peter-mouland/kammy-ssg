// app/admin/server/services/admin-orchestrator.service.ts

import { getInvalidationKeys } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { FirestoreClearService } from '../../../_shared/lib/firestore-cache/clear-service';
import { FplFirestore } from '../../../_shared/lib/fpl/fpl-firestore';
import { readPlayers } from '../../../_shared/lib/sheets/players';
import { getDivisionUserTeams } from '../../../_shared/lib/sheets/user-teams';
import type { DivisionId } from '../../../_shared/types/league-types';
import type { DraftAction } from '../../../draft';
import { generateAndCacheEnhancedData } from '../../../scoring/index.server';
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

        // Load draft sync comparisons for all divisions (bounded — Firebase Admin
        // OAuth can hang on node-fetch "Premature close" and stall the whole admin page)
        let draftSyncComparisons: Awaited<
            ReturnType<typeof import('./draft-sync-comparison.service').getAllDraftSyncComparisons>
        > = [];
        try {
            const { getAllDraftSyncComparisons } = await import('./draft-sync-comparison.service');
            draftSyncComparisons = await Promise.race([
                getAllDraftSyncComparisons(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Draft sync comparisons timed out')), 12_000),
                ),
            ]);
            console.log(`✅ Loaded draft sync comparisons for ${draftSyncComparisons.length} divisions`);
        } catch (error) {
            console.error('❌ Failed to load draft sync comparisons:', error);
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
                    break;
                case 'stopDraft':
                    result = await draftService.stopDraft(params.divisionId);
                    break;
                case 'syncDraft':
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

            // Every draft action invalidates the same set, including the sync comparison
            // caches, so one call after the switch covers all of them
            dataCache.invalidateMultiple(getInvalidationKeys('DRAFT_ACTION', params.divisionId));

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

        const [divisions, managers, draftStates, draftOrder, players] = await Promise.all([
            readDivisions(),
            readUserTeams(),
            readAllDraftStates(),
            readDraftOrders(),
            readPlayers(),
        ]);

        // Read every division the sheet lists, rather than three named ones. A fourth
        // division used to be invisible here: its transfers were simply never fetched.
        const transferLists = await Promise.all(divisions.map((division) => readTransfers(division.id)));
        const transfers = Object.fromEntries(
            divisions.map((division, index) => [division.id, transferLists[index]]),
        ) as Record<DivisionId, Awaited<ReturnType<typeof readTransfers>>>;

        return {
            divisions,
            managers,
            draftStates,
            draftOrder,
            players,
            transfers,
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
        // Order matters and is unchanged: clear, populate the bootstrap, then generate the
        // enhanced data from it. The last step moved out of FplFirestore in P2.1b -- it is
        // scoring's job -- so admin sequences the two, which is what admin is for.
        const result = await firestore.preloadCommonData();
        result.results.enhanced = await generateAndCacheEnhancedData(firestore);
        dataCache.invalidateMultiple(getInvalidationKeys('FPL_DATA_UPDATED'));
        return result;
    }

    /** One bounded pass of the reset. Repeat until the result says `done`. */
    public async clearAllData() {
        return await clearService.clearEverything();
    }
}
