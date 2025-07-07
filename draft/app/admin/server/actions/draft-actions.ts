/* Location: app/admin/server/actions/draft-actions.ts */

import { getDraftPicksByDivision } from '../../../_shared/lib/sheets/draft';
import { clearDraftOrder, generateRandomDraftOrder } from '../../../_shared/lib/sheets/draft-order';
import { getDivisionUserTeams } from '../../../_shared/lib/sheets/user-teams';
import type { AdminActionResult, DraftActionParams } from '../../types/admin-types';
import { DraftService } from '../services/draft.service';

export async function handleGenerateOrder(params: DraftActionParams): Promise<AdminActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error('Division ID is required');
    }

    const userTeams = await getDivisionUserTeams(divisionId);
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
    if (!params.divisionId) throw new Error('Division ID is required');
    await clearDraftOrder(params.divisionId);
    return {
        success: true,
        message: `Draft order cleared for division ${params.divisionId}`,
    };
}

export async function handleStartDraft(params: DraftActionParams): Promise<AdminActionResult> {
    if (!params.divisionId) throw new Error('No divisionId found');
    const draftService = new DraftService();
    return draftService.startDraft(params.divisionId);
}

export async function handleStopDraft(): Promise<AdminActionResult> {
    const draftService = new DraftService();
    return draftService.stopDraft();
}

export async function handleSyncDraft(params: DraftActionParams): Promise<AdminActionResult> {
    if (!params.divisionId) throw new Error('No divisionId found');
    const draftService = new DraftService();
    return draftService.syncDraft(params.divisionId);
}

export async function handleResetDraft(params: DraftActionParams): Promise<AdminActionResult> {
    if (!params.divisionId) throw new Error('No divisionId found');
    const draftService = new DraftService();
    return draftService.resetDraft(params.divisionId);
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
