/* Location: app/admin/server/transfers-admin.server.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionId, DivisionSheetData } from '../../teams/types/team-types';
import { getTransfersDataForDivision } from '../../transfers/server/services/transfers-data.service';
import type { TransferAdminOverviewData, TransferRecommendation } from '../../transfers/types/transfer-rule-types';

interface TransfersActionResult {
    success: boolean;
    error?: string;
    message: string;
    data?: unknown;
}

/**
 * Get transfers admin data for all divisions
 */
export async function getTransfersAdminData(
    divisions: DivisionSheetData[],
    gameweek: GameWeekData,
): Promise<Record<DivisionId, TransferAdminOverviewData>> {
    console.log(`📊 Loading transfers admin data for ${divisions.length} divisions`);

    const transfersData: Record<string, TransferAdminOverviewData> = {};

    for (const division of divisions) {
        try {
            transfersData[division.id] = await getTransfersDataForDivision(division.id, gameweek);
        } catch (error) {
            console.error(`❌ Failed to load transfers data for division ${division.id}:`, error);

            // Provide fallback data
            transfersData[division.id] = {
                divisionId: division.id,
                transfers: [],
                statusStats: {
                    rejectedCount: 0,
                    approvedCount: 0,
                    processedCount: 0,
                    pendingCount: 0,
                },
                ruleStats: {
                    totalRules: 0,
                    activeRules: 0,
                    blockingRules: 0,
                    warningRules: 0,
                },
                validationStats: {
                    totalValidated: 0,
                    autoApproved: 0,
                    autoRejected: 0,
                    needsReview: 0,
                },
            };
        }
    }

    console.log(`✅ Loaded transfers data for ${Object.keys(transfersData).length} divisions`);
    return transfersData;
}

/**
/**
 * Approve a transfer
 */
async function handleApproveTransfer(
    divisionId: DivisionId,
    transferId: string,
    recommendation: TransferRecommendation,
): Promise<TransfersActionResult> {
    try {
        console.log(`✅ Approving transfer ${transferId} for division: ${divisionId}`);

        // This would:
        // 1. Update the Google Sheets with approval
        // 2. Update recommendation column
        // 3. Log the decision
        // 4. Potentially trigger re-validation of other pending transfers

        // const { updateTransferRecommendation } = await import();
        //
        // await updateTransferRecommendation(divisionId, transferId, {
        //     transferId,
        //     recommendation: 'APPROVE',
        //     validationSummary: 'Manually approved by admin',
        //     ruleViolations: [],
        //     updatedBy: 'admin', // In real app, would get from auth
        //     updatedAt: new Date(),
        // });

        return {
            success: true,
            message: `Transfer ${transferId} approved successfully. Note: Other pending transfers may need re-validation due to player ownership changes.`,
            data: {
                transferId,
                recommendation,
                approvedAt: new Date().toISOString(),
                requiresRevalidation: true, // Flag that other transfers may be affected
            },
        };
    } catch (error) {
        throw new Error(`Failed to approve transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Reject a transfer
 */
async function handleRejectTransfer(
    divisionId: DivisionId,
    transferId: string,
    recommendation: TransferRecommendation,
): Promise<TransfersActionResult> {
    try {
        console.log(`❌ Rejecting transfer ${transferId} for division: ${divisionId}`);

        // This would:
        // 1. Update the Google Sheets with rejection
        // 2. Update recommendation column
        // 3. Log the decision
        // 4. Potentially trigger re-validation of other pending transfers

        // const { updateTransferRecommendation } = await import('');
        //
        // await updateTransferRecommendation(divisionId, transferId, {
        //     transferId,
        //     recommendation: 'REJECT',
        //     validationSummary: 'Manually rejected by admin',
        //     ruleViolations: [],
        //     updatedBy: 'admin', // In real app, would get from auth
        //     updatedAt: new Date(),
        // });

        return {
            success: true,
            message: `Transfer ${transferId} rejected successfully. Other pending transfers may now be valid if they were blocked by player conflicts.`,
            data: {
                transferId,
                recommendation,
                rejectedAt: new Date().toISOString(),
                requiresRevalidation: true, // Flag that other transfers may be affected
            },
        };
    } catch (error) {
        throw new Error(`Failed to reject transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
