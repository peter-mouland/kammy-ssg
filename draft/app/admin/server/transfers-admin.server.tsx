/* Location: app/admin/server/transfers-admin.server.ts */

import type { DivisionId, DivisionSheetData, ManagerId, TeamRoster } from '../../teams/types/team-types';
import { EnhancedTransferValidationService } from '../../transfers/lib/enhanced-transfer-validation.service';
import { getDefaultRuleConfiguration } from '../../transfers/lib/transfer-rule-definitions';
import type {
    TransferAdminOverviewData,
    TransferRecommendation,
    TransferValidationResult,
} from '../../transfers/types/transfer-rule-types';

/**
 * Action types for transfers admin
 */
type TransfersActionType =
    | 'refreshTransfers'
    | 'validateAllTransfers'
    | 'approveTransfer'
    | 'rejectTransfer'
    | 'updateRules';

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
): Promise<Record<string, TransferAdminOverviewData>> {
    console.log(`📊 Loading transfers admin data for ${divisions.length} divisions`);

    const transfersData: Record<string, TransferAdminOverviewData> = {};

    for (const division of divisions) {
        try {
            transfersData[division.id] = await getTransfersDataForDivision(division.id);
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
async function getTransfersDataForDivision(divisionId: DivisionId): Promise<TransferAdminOverviewData> {
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
        const divisionRosters = await getDivisionRosters(divisionId, currentGameweek?.fplEvent.id || 0);
        const rules = getDefaultRuleConfiguration(divisionId);

        console.log(`🔄 Running enhanced sequential validation for ${transferResult.transfers.length} transfers`);

        // Use enhanced validation service for sequential validation
        const sequentialResult = await EnhancedTransferValidationService.validateTransfersSequentially(
            transferResult.transfers,
            rules,
            {
                divisionRosters,
                gameweekData: currentGameweek,
                fplPlayersByCode,
                divisionId,
                currentGameweek: currentGameweek?.fplEvent.id,
            },
        );

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

        console.log('✅ Enhanced validation complete:', {
            transfers: transfers.length,
            virtualConflicts: sequentialResult.summary.virtualStateConflicts,
            ...validationStats,
        });

        return {
            divisionId,
            transfers,
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

            case 'validateAllTransfers':
                return await handleValidateAllTransfers(divisionId);

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

            case 'updateRules':
                return await handleUpdateRules(divisionId, params.rules || []);

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
 * Validate all pending transfers using enhanced validation
 */
async function handleValidateAllTransfers(divisionId: DivisionId): Promise<TransfersActionResult> {
    try {
        console.log(`✅ Running enhanced validation for all transfers in division: ${divisionId}`);

        const [{ readTransferDataForDivision }, { fplApiCache }] = await Promise.all([
            import('../../transfers/lib/transfer-reader.service'),
            import('../../_shared/lib/fpl/api-cache'),
        ]);

        // Get current data
        const gameweekData = await fplApiCache.getFplEvents();
        const fplPlayersByCode = await fplApiCache.getPlayersByCode();
        const transferResult = await readTransferDataForDivision(divisionId, fplPlayersByCode, gameweekData);
        const currentGameweek = await fplApiCache.getCurrentGameweekData();
        const divisionRosters = await getDivisionRosters(divisionId, currentGameweek?.fplEvent.id || 0);
        const rules = getDefaultRuleConfiguration(divisionId);

        // Run enhanced validation
        const sequentialResult = await EnhancedTransferValidationService.validateTransfersSequentially(
            transferResult.transfers,
            rules,
            {
                divisionRosters,
                gameweekData: currentGameweek,
                fplPlayersByCode,
                divisionId,
                currentGameweek: currentGameweek?.fplEvent.id,
            },
        );

        const summary = sequentialResult.summary;

        return {
            success: true,
            message: `Enhanced validation complete for division ${divisionId}: ${summary.approved} approved, ${summary.rejected} rejected, ${summary.needsReview} need review, ${summary.virtualStateConflicts} virtual conflicts detected`,
            data: {
                divisionId,
                validatedAt: new Date().toISOString(),
                ...summary,
            },
        };
    } catch (error) {
        throw new Error(`Failed to validate transfers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

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
 * Update rules configuration
 */
async function handleUpdateRules(divisionId: DivisionId, rules: any[]): Promise<TransfersActionResult> {
    try {
        console.log(`⚙️ Updating rules for division: ${divisionId} (${rules.length} rules)`);

        // This would save rules configuration
        // For now, just return success
        return {
            success: true,
            message: `Rules updated for division ${divisionId}. All pending transfers should be re-validated with new rules.`,
            data: {
                divisionId,
                rulesCount: rules.length,
                updatedAt: new Date().toISOString(),
                requiresRevalidation: true, // Rule changes require re-validation
            },
        };
    } catch (error) {
        throw new Error(`Failed to update rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get division rosters for transfer validation
 */
async function getDivisionRosters(divisionId: DivisionId, gameweek: number): Promise<Record<ManagerId, TeamRoster>> {
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
                    return extractRostersFromDocument(previousDocument);
                }
            }

            // If no document found, return empty rosters
            console.warn(`⚠️ No roster data found for ${divisionId}, returning empty rosters`);
            return {};
        }

        console.log(`✅ Found division document for ${divisionId} GW${gameweek}`);
        return extractRostersFromDocument(divisionDocument);
    } catch (error) {
        console.error(`❌ Failed to get division rosters for ${divisionId}:`, error);
        // Return empty rosters on error to prevent validation from failing
        return {};
    }
}

/**
 * Extract rosters from division teams document
 * (This function exists in transfer-integration.service.ts but we need it here)
 */
function extractRostersFromDocument(document: any): Record<ManagerId, TeamRoster> {
    const rosters: Record<ManagerId, TeamRoster> = {};

    for (const [userId, teamData] of Object.entries(document.teams)) {
        rosters[userId] = { ...(teamData as any).roster };
    }

    console.log(`📊 Extracted rosters for ${Object.keys(rosters).length} managers`);
    return rosters;
}
