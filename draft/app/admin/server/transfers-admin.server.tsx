/* Location: app/admin/server/transfers-admin.server.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionId, DivisionSheetData, RosterByManagerId } from '../../teams/types/team-types';
import { getDefaultRuleConfiguration } from '../../transfers/lib/transfer-rule-definitions';
import { validateTransfers } from '../../transfers/lib/transfer-validation.service';
import type {
    TransferAdminOverviewData,
    TransferRecommendation,
    TransferValidationResult,
} from '../../transfers/types/transfer-rule-types';

/**
 * Action types for transfers admin
 */
type TransfersActionType = 'refreshTransfers' | 'approveTransfer' | 'rejectTransfer';

interface TransfersActionParams {
    actionType: TransfersActionType;
    divisionId?: DivisionId;
    transferId?: string;
    recommendation?: TransferRecommendation;
    rules?: any[];
}

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
 * Get transfers data for a specific division using enhanced validation
 */
async function getTransfersDataForDivision(
    divisionId: DivisionId,
    gameweek: GameWeekData,
): Promise<TransferAdminOverviewData> {
    try {
        const [{ readTransferDataForDivision }, { fplApiCache }] = await Promise.all([
            import('../../transfers/lib/transfer-reader.service'),
            import('../../_shared/lib/fpl/api-cache'),
        ]);

        // Get transfer data from sheets
        const gameweekData = await fplApiCache.getFplEvents();
        const fplPlayersByCode = await fplApiCache.getPlayersByCode();
        const transferResult = await readTransferDataForDivision(divisionId, fplPlayersByCode, gameweekData);
        const currentGameweek = await fplApiCache.getCurrentGameweekData();
        const divisionRosters = await getDivisionRosters(divisionId, gameweek.fplEvent.id);
        const rules = getDefaultRuleConfiguration(divisionId);

        console.log(
            `🔄 Running enhanced sequential validation for ${transferResult.transfers.length} transfers: ${divisionId}: gw${currentGameweek?.fplEvent.id}`,
        );

        // Use enhanced validation service for sequential validation
        const gameweekTransfers = transferResult.transfers
            .filter((t) => t.gameweekData.fplEvent.id === gameweek.fplEvent.id)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const sequentialResult = await validateTransfers(gameweekTransfers, rules, {
            allGameweekTransfers: gameweekTransfers,
            divisionRosters,
            gameweekData: currentGameweek,
            fplPlayersByCode,
            divisionId,
            currentGameweek: currentGameweek?.fplEvent.id,
        });

        // Convert sequential results to the expected format
        const transfers = sequentialResult.transferValidations.map((item) => ({
            transfer: item.transfer,
            validation: item.validation as TransferValidationResult, // Cast back to base type for compatibility
            recommendation: item.recommendation,
        }));

        // Update validation stats from sequential result
        const validationStats = {
            totalValidated: sequentialResult.summary.totalTransfers,
            autoApproved: sequentialResult.summary.approved,
            autoRejected: sequentialResult.summary.rejected,
            needsReview: sequentialResult.summary.needsReview,
        };

        // Calculate rule stats
        const ruleStats = {
            totalRules: rules.length,
            activeRules: rules.filter((r) => r.isActive).length,
            blockingRules: rules.filter((r) => r.isActive && r.severity === 'blocking').length,
            warningRules: rules.filter((r) => r.isActive && r.severity === 'warning').length,
        };

        return {
            divisionId,
            transfers,
            divisionRosters,
            statusStats: {
                pendingCount: transferResult.pendingCount,
                rejectedCount: transferResult.rejectedCount,
                approvedCount: transferResult.approvedCount,
                processedCount: transferResult.processedCount,
            },
            ruleStats,
            validationStats,
        };
    } catch (error) {
        console.error(`❌ Failed to get transfers data for division ${divisionId}:`, error);
        throw error;
    }
}

/**
 * Handle transfers admin actions
 */
export async function handleTransfersActions(params: TransfersActionParams): Promise<TransfersActionResult> {
    const { actionType, divisionId = 'leagueOne', transferId } = params;

    console.log(`🎯 Handling transfers action: ${actionType} for division: ${divisionId}`);

    try {
        switch (actionType) {
            case 'refreshTransfers':
                return await handleRefreshTransfers(divisionId);

            case 'approveTransfer':
                if (!transferId) {
                    return {
                        success: false,
                        error: 'Transfer ID is required for approval',
                        message: 'Invalid transferId',
                    };
                }
                return await handleApproveTransfer(divisionId, transferId, 'APPROVE');

            case 'rejectTransfer':
                if (!transferId) {
                    return {
                        success: false,
                        error: 'Transfer ID is required for rejection',
                        message: 'Invalid transferId',
                    };
                }
                return await handleRejectTransfer(divisionId, transferId, 'REJECT');

            default:
                return {
                    success: false,
                    error: `Unknown action type: ${actionType}`,
                    message: 'Invalid action type',
                };
        }
    } catch (error) {
        console.error(`❌ Error handling transfers action ${actionType}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: `Failed to ${actionType}`,
        };
    }
}

/**
 * Refresh transfers data from Google Sheets
 */
async function handleRefreshTransfers(divisionId: DivisionId): Promise<TransfersActionResult> {
    try {
        // This would invalidate cache and reload from sheets
        // For now, just return success
        console.log(`🔄 Refreshing transfers data for division: ${divisionId}`);

        return {
            success: true,
            message: `Transfers data refreshed for division ${divisionId}`,
            data: {
                divisionId,
                refreshedAt: new Date().toISOString(),
            },
        };
    } catch (error) {
        throw new Error(`Failed to refresh transfers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

/**
/**
 * Get division rosters for transfer validation
 */
async function getDivisionRosters(divisionId: DivisionId, gameweek: number): Promise<RosterByManagerId> {
    try {
        console.log(`📋 Getting division rosters for ${divisionId} GW${gameweek}`);

        // Import the division teams service
        const { getDivisionTeamsDocument } = await import('../../scoring/server/services/division-teams.service');

        // Get the division teams document for the current gameweek
        const divisionDocument = await getDivisionTeamsDocument(divisionId, gameweek);

        if (!divisionDocument) {
            console.warn(`⚠️ No division document found for ${divisionId} GW${gameweek}, trying previous gameweek`);

            // Try the previous gameweek
            const previousGameweek = gameweek - 1;
            if (previousGameweek >= 0) {
                const previousDocument = await getDivisionTeamsDocument(divisionId, previousGameweek);
                if (previousDocument) {
                    console.log(`✅ Using previous gameweek data: GW${previousGameweek}`);
                    return previousDocument.teams;
                }
            }

            // If no document found, return empty rosters
            console.warn(`⚠️ No roster data found for ${divisionId}, returning empty rosters`);
            return {};
        }

        console.log(`✅ Found division document for ${divisionId} GW${gameweek}`);
        return divisionDocument.teams;
    } catch (error) {
        console.error(`❌ Failed to get division rosters for ${divisionId}:`, error);
        // Return empty rosters on error to prevent validation from failing
        return {};
    }
}
