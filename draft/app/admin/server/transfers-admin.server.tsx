/* Location: app/admin/server/transfers-admin.server.ts */

import { CACHE_KEYS } from '../../_shared/lib/cache/cache-config';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
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
 * Handle transfer action requests
 */
export async function handleTransferAction(
    actionType: string,
    params: {
        divisionId: DivisionId;
        transferId: string;
        recommendation: TransferRecommendation;
    },
): Promise<TransfersActionResult> {
    const { divisionId, transferId, recommendation } = params;

    try {
        switch (actionType) {
            case 'approveTransfer':
                return await handleApproveTransfer(divisionId, transferId, recommendation);

            case 'rejectTransfer':
                return await handleRejectTransfer(divisionId, transferId, recommendation);

            default:
                throw new Error(`Unknown transfer action: ${actionType}`);
        }
    } catch (error) {
        console.error(`❌ Transfer action ${actionType} failed:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: `Failed to ${actionType.replace('Transfer', ' transfer')}`,
        };
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

        // Update Google Sheets with approval
        await updateTransferRecommendationInSheet(divisionId, transferId, 'APPROVE');

        // Invalidate admin context to refresh data
        dataCache.invalidate(CACHE_KEYS.SHEETS.TRANSFERS(divisionId));

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

        // Update Google Sheets with rejection
        await updateTransferRecommendationInSheet(divisionId, transferId, 'REJECT');

        // Invalidate admin context to refresh data
        dataCache.invalidate(CACHE_KEYS.SHEETS.TRANSFERS(divisionId));

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
 * Refresh transfers data for a division
 */
export async function handleRefreshTransfers(divisionId: DivisionId): Promise<TransfersActionResult> {
    try {
        console.log(`🔄 Refreshing transfers data for division: ${divisionId}`);

        // Invalidate transfer caches
        dataCache.invalidate(CACHE_KEYS.SHEETS.TRANSFERS(divisionId));

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
 * Update transfer recommendation in Google Sheets using existing utilities
 */
async function updateTransferRecommendationInSheet(
    divisionId: DivisionId,
    transferId: string,
    recommendation: TransferRecommendation,
): Promise<void> {
    try {
        console.log(`📝 Updating transfer ${transferId} recommendation to ${recommendation} in sheets`);

        // Import your existing sheet utilities
        const { readSheetWithHeaders, writeSheetRange, SPREADSHEET_ID } = await import(
            '../../_shared/lib/sheets/utils/common'
        );

        const sheetName = `${divisionId}-transfers`;
        const range = `'${sheetName}'!A:Z`;

        // Read current data using your existing utility
        const { headers, data } = await readSheetWithHeaders({
            spreadsheetId: SPREADSHEET_ID,
            range,
        });

        if (data.length === 0) {
            throw new Error(`No transfer data found in sheet ${sheetName}`);
        }

        // Parse the transferId to extract components
        // transferId format: `${divisionId}_${timestampStr}_${rowIndex}`
        const idParts = transferId.split('_');
        if (idParts.length < 3) {
            throw new Error(`Invalid transfer ID format: ${transferId}`);
        }

        // Extract row index from the transfer ID (last part)
        const rowIndexFromId = Number.parseInt(idParts[idParts.length - 1], 10);

        // Find column indices
        const timestampColumnIndex = headers.findIndex(
            (h) => h.toLowerCase().includes('timestamp') || h.toLowerCase().includes('time'),
        );
        const statusColumnIndex = headers.findIndex((h) => h.toLowerCase().includes('status'));

        if (timestampColumnIndex === -1) {
            throw new Error(`Timestamp column not found in sheet ${sheetName}`);
        }

        // Find the matching row by reconstructing the ID for each row
        let matchingRowIndex = -1;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const timestamp = new Date(row[timestampColumnIndex]);
            const timestampStr = timestamp.toISOString().replace(/[:.]/g, '');
            const reconstructedId = `${divisionId}_${timestampStr}_${i}`;

            if (reconstructedId === transferId) {
                matchingRowIndex = i;
                break;
            }
        }

        if (matchingRowIndex === -1) {
            // Fallback: try to find by row index if timestamp matching fails
            if (rowIndexFromId < data.length) {
                console.warn(`Using fallback row matching for transfer ${transferId}`);
                matchingRowIndex = rowIndexFromId;
            } else {
                throw new Error(`Transfer ${transferId} not found in sheet ${sheetName}`);
            }
        }

        // Update the row data
        const updatedRow = [...data[matchingRowIndex]];

        // Map recommendation to your sheet's status format
        const sheetStatus = recommendation === 'APPROVE' ? 'Y' : recommendation === 'REJECT' ? 'N' : '';

        if (statusColumnIndex !== -1) {
            updatedRow[statusColumnIndex] = sheetStatus;
        } else {
            console.warn(`Status column not found, cannot update recommendation for ${transferId}`);
        }

        // Write the updated row back using your existing utility
        const updateRange = `'${sheetName}'!A${matchingRowIndex + 2}:${String.fromCharCode(64 + headers.length)}${matchingRowIndex + 2}`;
        await writeSheetRange(
            {
                spreadsheetId: SPREADSHEET_ID,
                range: updateRange,
            },
            [updatedRow],
        );

        console.log(
            `✅ Successfully updated transfer ${transferId} recommendation to ${recommendation} (status: ${sheetStatus})`,
        );
    } catch (error) {
        console.error('❌ Failed to update transfer recommendation in sheets:', error);
        throw error;
    }
}
