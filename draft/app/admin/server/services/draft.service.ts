// app/admin/server/services/draft.service.ts

import { getInvalidationKeys } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { FirebaseDraftSync } from '../../../_shared/lib/firestore-cache/firebase-draft-sync';
import { readDraftState, updateDraftState } from '../../../_shared/lib/sheets/draft';
import {
    clearDraftOrder,
    draftOrderExists,
    generateRandomDraftOrder,
    getDraftOrderByDivision,
} from '../../../_shared/lib/sheets/draft-order';
import type { DraftStateData } from '../../../draft/types/draft-types';
import type { DivisionId, UserTeamsSheetData } from '../../../teams/types/team-types';
import type { DraftResult } from '../../types/admin-orchestrator-types';
import type { AdminActionResult } from '../../types/admin-types';
import { handleCommitTeamsToFirestore } from '../actions/team-commit-actions';

/**
 * Draft service for managing draft operations
 * This integrates with existing draft functionality but provides
 * a unified interface for the orchestrator
 */
export class DraftService {
    /**
     * Start a new draft for a division
     */
    async startDraft(divisionId: DivisionId): Promise<DraftResult> {
        try {
            const orderExists = await draftOrderExists(divisionId);
            if (!orderExists) {
                throw new Error('Draft order must be generated before starting the draft');
            }

            const draftOrder = await getDraftOrderByDivision(divisionId);
            const firstUser = draftOrder.find((order) => order.position === 1);

            if (!firstUser) {
                throw new Error('No users found in draft order');
            }

            // Initialize draft state
            await updateDraftState({
                isActive: true,
                currentPick: 1,
                currentUserId: firstUser.userId,
                currentDivisionId: divisionId,
                picksPerTeam: 12,
                startedAt: new Date(),
                completedAt: null,
            });

            return {
                success: true,
                message: `Draft started for division ${divisionId}`,
                data: { divisionId, status: 'started' },
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to start draft',
            };
        }
    }

    async stopDraft(): Promise<AdminActionResult> {
        const currentDraftState = await readDraftState();
        if (!currentDraftState?.isActive) {
            throw new Error('No active draft to stop');
        }

        const stoppedDraftState: DraftStateData = {
            ...currentDraftState,
            isActive: false,
            completedAt: new Date(),
        };

        await updateDraftState(stoppedDraftState);
        return {
            success: true,
            message: 'Draft stopped successfully',
        };
    }

    /**
     * Sync draft state to Firebase for real-time updates
     */
    async syncDraft(divisionId: DivisionId): Promise<DraftResult> {
        try {
            const syncResult = await FirebaseDraftSync.syncDraftFromSheets(divisionId, false);

            return {
                success: true,
                message: `Draft synced for division ${divisionId}! ${syncResult.picksCount} picks, current pick: ${
                    syncResult.currentPick
                }${syncResult.isActive ? `, turn: ${syncResult.currentUserId}` : ' (completed)'}`,
                data: syncResult,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to sync draft',
            };
        }
    }

    /**
     * Commit completed draft (finalize and lock in results)
     */
    async commitDraft(divisionId: DivisionId): Promise<DraftResult> {
        return handleCommitTeamsToFirestore(divisionId);
    }

    async generateOrder(divisionId: DivisionId, managers: UserTeamsSheetData[]) {
        try {
            const teamData = managers.map((team) => ({
                userId: team.userId,
                userName: team.userName,
            }));
            await generateRandomDraftOrder(divisionId, teamData);
            const keysToInvalidate = getInvalidationKeys('DRAFT_ACTION', divisionId);
            dataCache.invalidateMultiple(keysToInvalidate);

            return {
                success: true,
                message: 'Draft order generated',
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to generateOrder',
            };
        }
    }

    /**
     * Reset draft (clear all picks and start over)
     */
    async resetDraft(divisionId: DivisionId): Promise<DraftResult> {
        try {
            // Clear all draft picks
            await clearDraftOrder(divisionId);
            // const syncResult = await FirebaseDraftSync.syncDraftFromSheets(divisionId, true);

            // Reset draft state
            await updateDraftState({
                isActive: true,
                currentPick: 0,
                currentUserId: '',
                currentDivisionId: divisionId,
                picksPerTeam: 12,
                startedAt: new Date(),
                completedAt: null,
            });

            // await FirebaseDraftSync.clearDraftFromFirebase(divisionId);

            return {
                success: true,
                message: `Draft reset for division ${divisionId} - all picks cleared`,
                data: { divisionId, status: 'reset' },
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to reset draft',
            };
        }
    }
}

// Mock implementations for services that don't exist yet
export async function processAllPendingTransfers() {
    // Mock implementation
    return {
        transfersProcessed: 5,
        transfersApproved: 3,
        transfersRejected: 2,
        errors: [],
    };
}

export async function validateAllTransferRules() {
    // Mock implementation
    return {
        validationCount: 10,
        rulesViolated: 0,
        warnings: [],
    };
}

export async function updateAllLeagueStandings() {
    // Mock implementation
    return {
        divisionsUpdated: 2,
        teamsProcessed: 16,
        errors: [],
    };
}

export async function finalizeCurrentGameweek() {
    // Mock implementation
    return {
        gameweek: 15,
        finalized: true,
        timestamp: new Date().toISOString(),
    };
}

export async function exportSystemData() {
    // Mock implementation
    return {
        fileSize: 15.2,
        recordsExported: 10000,
        exportPath: '/exports/system-data.json',
    };
}

export async function runComprehensiveDiagnostics() {
    // Mock implementation
    return {
        allTestsPassed: true,
        testsRun: 25,
        testsFailed: 0,
        results: [],
    };
}

export async function getRecentSystemLogs() {
    // Mock implementation
    return {
        logCount: 100,
        logs: [],
        timeframe: '24h',
    };
}

export async function forceRebuildAllData() {
    // Mock implementation
    return {
        rebuiltComponents: ['players', 'teams', 'points', 'standings'],
        totalRecords: 5000,
        duration: '2m 30s',
    };
}

export async function resetEntireDatabase() {
    // Mock implementation
    return {
        collectionsCleared: 10,
        recordsDeleted: 50000,
        reinitializationComplete: true,
    };
}
