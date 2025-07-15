// app/admin/server/services/draft.service.ts

import { getInvalidationKeys } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { FirebaseDraftSync } from '../../../_shared/lib/firestore-cache/firebase-draft-sync';
import { readDraftState, readDraftStateByDivision, updateDraftState } from '../../../_shared/lib/sheets/draft';
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

            // Initialize draft state - currentPick will be calculated when read back
            await updateDraftState({
                isActive: true,
                currentPick: 1, // This will be calculated correctly when sheets are read
                currentUserId: firstUser.userId,
                divisionId: divisionId, // Keep existing field name
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

    async stopDraft(divisionId: DivisionId): Promise<AdminActionResult> {
        const currentDraftState = await readDraftStateByDivision(divisionId);
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

            // Invalidate sync comparison cache
            const keysToInvalidate = getInvalidationKeys('DRAFT_SYNC_ACTION', divisionId);
            dataCache.invalidateMultiple(keysToInvalidate);

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
                message: `Failed to sync draft for division ${divisionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
                divisionId: divisionId,
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
