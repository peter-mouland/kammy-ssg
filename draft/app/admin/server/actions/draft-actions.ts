/* Location: app/admin/server/actions/draft-actions.ts */

// /admin/server/actions/draft-actions.ts
import { getUserTeamsByDivision } from '../../../_shared/lib/sheets/user-teams';
import {
    generateRandomDraftOrder,
    getDraftOrderByDivision,
    clearDraftOrder,
    draftOrderExists,
} from '../../../_shared/lib/sheets/draft-order';
import { updateDraftState, readDraftState, getDraftPicksByDivision } from '../../../_shared/lib/sheets/draft';
import type { DraftActionParams, AdminActionResult } from '../../types/admin-types';
import type { DraftStateData } from '../../../draft/types/draft-types';

export async function handleGenerateOrder(params: DraftActionParams): Promise<AdminActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error('Division ID is required');
    }

    const userTeams = await getUserTeamsByDivision(divisionId);
    if (userTeams.length === 0) {
        throw new Error('No teams found in this division');
    }

    const teamData = userTeams.map((team) => ({
        userId: team.userId,
        userName: team.userName,
    }));

    await generateRandomDraftOrder(divisionId, teamData);
    return {
        success: true,
        message: `Draft order generated for division ${divisionId}`,
    };
}

export async function handleClearOrder(params: DraftActionParams): Promise<AdminActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error('Division ID is required');
    }

    await clearDraftOrder(divisionId);
    return {
        success: true,
        message: `Draft order cleared for division ${divisionId}`,
    };
}

export async function handleStartDraft(params: DraftActionParams): Promise<AdminActionResult> {
    console.log('Processing startDraft action');

    const { divisionId } = params;

    if (!divisionId) {
        throw new Error('Please select a division to start the draft');
    }

    const orderExists = await draftOrderExists(divisionId);
    if (!orderExists) {
        throw new Error('Draft order must be generated before starting the draft');
    }

    const draftOrder = await getDraftOrderByDivision(divisionId);
    const firstUser = draftOrder.find((order) => order.position === 1);

    if (!firstUser) {
        throw new Error('No users found in draft order');
    }

    const newDraftState: DraftStateData = {
        isActive: true,
        currentPick: 1,
        currentUserId: firstUser.userId,
        currentDivisionId: divisionId,
        picksPerTeam: 12,
        startedAt: new Date(),
        completedAt: null,
    };

    await updateDraftState(newDraftState);
    return {
        success: true,
        message: `Draft started for division ${divisionId}!`,
    };
}

export async function handleStopDraft(): Promise<AdminActionResult> {
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

export async function handleSyncDraft(params: DraftActionParams): Promise<AdminActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error('Division ID is required');
    }

    try {
        console.log(`🔄 Syncing draft for division: ${divisionId}`);

        // Import Firebase sync
        const { FirebaseDraftSync } = await import('../../../_shared/lib/firestore-cache/firebase-draft-sync');

        // Sync the draft state from sheets to Firebase (normal sync)
        const syncResult = await FirebaseDraftSync.syncDraftFromSheets(divisionId, false);

        return {
            success: true,
            message: `Draft synced for division ${divisionId}! ${syncResult.picksCount} picks, current pick: ${
                syncResult.currentPick
            }${syncResult.isActive ? `, turn: ${syncResult.currentUserId}` : ' (completed)'}`,
            data: syncResult,
        };
    } catch (error) {
        console.error('Sync draft error:', error);
        throw new Error(`Failed to sync draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function handleResetDraft(params: DraftActionParams): Promise<AdminActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error('Division ID is required');
    }

    try {
        console.log(`🔄 RESETTING draft for division: ${divisionId}`);

        // Import Firebase sync
        const { FirebaseDraftSync } = await import('../../../_shared/lib/firestore-cache/firebase-draft-sync');

        // Force reset and sync the draft state from sheets to Firebase
        const syncResult = await FirebaseDraftSync.syncDraftFromSheets(divisionId, true);

        return {
            success: true,
            message: `Draft RESET and synced for division ${divisionId}! All Firebase data cleared and rebuilt from Google Sheets. ${
                syncResult.picksCount
            } picks, current pick: ${syncResult.currentPick}${
                syncResult.isActive ? `, turn: ${syncResult.currentUserId}` : ' (completed)'
            }`,
            data: { ...syncResult, resetPerformed: true },
        };
    } catch (error) {
        console.error('Reset draft error:', error);
        throw new Error(`Failed to reset draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function handleGetDraftPicksCount(params: DraftActionParams): Promise<AdminActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error('Division ID is required');
    }

    try {
        console.log(`🔄 Getting draft picks count for division: ${divisionId}`);

        // Get actual draft picks from the Google Sheets
        const draftPicks = await getDraftPicksByDivision(divisionId);
        const pickCount = draftPicks.length;

        return {
            success: true,
            message: `Found ${pickCount} draft picks for division ${divisionId}`,
            data: {
                divisionId,
                pickCount,
                timestamp: new Date().toISOString(),
            },
        };
    } catch (error) {
        console.error('Get draft picks count error:', error);
        throw new Error(`Failed to get draft picks count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
