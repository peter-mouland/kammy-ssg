// app/admin/server/services/draft-status.service.ts

import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import { readDraftState } from '../../../_shared/lib/sheets/draft';
import { draftOrderExists } from '../../../_shared/lib/sheets/draft-order';
import type { DraftStateData } from '../../../draft/types/draft-types';
import type { DivisionId } from '../../../teams/types/team-types';

interface DraftStatusByDivision {
    [divisionId: string]: {
        hasOrder: boolean;
        isActive: boolean;
        isCurrentDivision: boolean;
        orderExists: boolean;
    };
}

interface DraftStatusSummary {
    isActive: boolean;
    currentDivisionId: string | null;
    currentUserId: string | null;
    currentPick: number | null;
    startedAt: Date | null;
    byDivision: DraftStatusByDivision;
    draftState: DraftStateData | null;
}

/**
 * Get real draft status across all divisions
 */
export async function getDraftStatus() {
    try {
        console.log('🔄 getDraftStatus() - Loading real draft data');

        // Read current draft state
        const draftState = await readDraftState();

        // Get all divisions
        const divisions = await readDivisions();

        // Initialize division status
        const byDivision: DraftStatusByDivision = {};

        // Check draft order status for each division
        for (const division of divisions) {
            const divisionId = division.id as DivisionId;

            try {
                const orderExists = await draftOrderExists(divisionId);

                byDivision[divisionId] = {
                    hasOrder: orderExists,
                    isActive: (draftState?.isActive && draftState?.currentDivisionId === divisionId) || false,
                    isCurrentDivision: draftState?.currentDivisionId === divisionId,
                    orderExists,
                };

                console.log(
                    `✅ Division ${divisionId}: order=${orderExists}, active=${byDivision[divisionId].isActive}`,
                );
            } catch (error) {
                console.warn(`⚠️ Failed to check draft order for division ${divisionId}:`, error);

                byDivision[divisionId] = {
                    hasOrder: false,
                    isActive: false,
                    isCurrentDivision: false,
                    orderExists: false,
                };
            }
        }

        const summary: DraftStatusSummary = {
            isActive: draftState?.isActive ?? false,
            // isCompleted: draftState?.isCompleted || false,
            currentDivisionId: draftState?.currentDivisionId ?? null,
            currentUserId: draftState?.currentUserId ?? null,
            currentPick: draftState?.currentPick ?? null,
            startedAt: draftState?.startedAt ?? null,
            // expectedPicks
            byDivision,
            draftState,
        };

        if (summary.isActive) {
            console.log(
                `✅ Draft Status: ACTIVE in division ${summary.currentDivisionId}, pick ${summary.currentPick}, user ${summary.currentUserId}`,
            );
        } else {
            console.log('✅ Draft Status: INACTIVE');
        }

        return summary;
    } catch (error) {
        console.error('❌ getDraftStatus() failed:', error);

        // Return empty status on error
        return {
            isActive: false,
            currentDivisionId: null,
            currentUserId: null,
            currentPick: null,
            startedAt: null,
            byDivision: {},
            draftState: null,
        } as DraftStatusSummary;
    }
}

/**
 * Get draft status for a specific division
 */
export async function getDraftStatusForDivision(divisionId: DivisionId): Promise<{
    hasOrder: boolean;
    isActive: boolean;
    isCurrentDivision: boolean;
    orderExists: boolean;
}> {
    try {
        console.log(`🔄 getDraftStatusForDivision(${divisionId})`);

        const [draftState, orderExists] = await Promise.all([readDraftState(), draftOrderExists(divisionId)]);

        const status = {
            hasOrder: orderExists,
            isActive: (draftState?.isActive && draftState?.currentDivisionId === divisionId) || false,
            isCurrentDivision: draftState?.currentDivisionId === divisionId,
            orderExists,
        };

        console.log(`✅ Division ${divisionId} draft status:`, status);
        return status;
    } catch (error) {
        console.error(`❌ getDraftStatusForDivision(${divisionId}) failed:`, error);

        return {
            hasOrder: false,
            isActive: false,
            isCurrentDivision: false,
            orderExists: false,
        };
    }
}

/**
 * Check if any draft is currently active
 */
export async function isDraftActive(): Promise<boolean> {
    try {
        const draftState = await readDraftState();
        return draftState?.isActive ?? false;
    } catch (error) {
        console.error('❌ isDraftActive() failed:', error);
        return false;
    }
}
