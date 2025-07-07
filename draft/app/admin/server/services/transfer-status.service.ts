// app/admin/server/services/transfer-status.service.ts

import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import { readTransfers } from '../../../_shared/lib/sheets/transfers';
import type { DivisionId } from '../../../teams/types/team-types';

interface TransferStatusByDivision {
    [divisionId: string]: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    };
}

interface TransferStatusSummary {
    byDivision: TransferStatusByDivision;
    overall: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    };
}

/**
 * Get real transfer status across all divisions
 */
export async function getTransferStatus(): Promise<TransferStatusSummary> {
    try {
        console.log('🔄 getTransferStatus() - Loading real transfer data');

        // Get all divisions
        const divisions = await readDivisions();

        // Initialize status object
        const byDivision: TransferStatusByDivision = {};
        const overall = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
        };

        // Process each division
        for (const division of divisions) {
            const divisionId = division.id as DivisionId;

            try {
                // Read transfers for this division
                const transfers = await readTransfers(divisionId);

                // Count by status
                const divisionStats = {
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    total: transfers.length,
                };

                // Count each transfer by status
                for (const transfer of transfers) {
                    const status = transfer.status?.toLowerCase();

                    if (status === 'pending' || status === 'submitted' || !status) {
                        divisionStats.pending++;
                        overall.pending++;
                    } else if (status === 'approved' || status === 'accepted') {
                        divisionStats.approved++;
                        overall.approved++;
                    } else if (status === 'rejected' || status === 'declined') {
                        divisionStats.rejected++;
                        overall.rejected++;
                    }

                    overall.total++;
                }

                byDivision[divisionId] = divisionStats;

                console.log(
                    `✅ Division ${divisionId}: ${divisionStats.total} transfers (${divisionStats.pending} pending, ${divisionStats.approved} approved, ${divisionStats.rejected} rejected)`,
                );
            } catch (error) {
                console.warn(`⚠️ Failed to read transfers for division ${divisionId}:`, error);

                // Set empty stats for this division
                byDivision[divisionId] = {
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    total: 0,
                };
            }
        }

        console.log(
            `✅ Transfer Status Summary: ${overall.total} total (${overall.pending} pending, ${overall.approved} approved, ${overall.rejected} rejected)`,
        );

        return {
            byDivision,
            overall,
        };
    } catch (error) {
        console.error('❌ getTransferStatus() failed:', error);

        // Return empty status on error
        return {
            byDivision: {},
            overall: {
                pending: 0,
                approved: 0,
                rejected: 0,
                total: 0,
            },
        };
    }
}

/**
 * Get transfer status for a specific division
 */
export async function getTransferStatusForDivision(divisionId: DivisionId): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}> {
    try {
        console.log(`🔄 getTransferStatusForDivision(${divisionId})`);

        const transfers = await readTransfers(divisionId);

        const stats = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: transfers.length,
        };

        for (const transfer of transfers) {
            const status = transfer.status?.toLowerCase();

            if (status === 'pending' || status === 'submitted' || !status) {
                stats.pending++;
            } else if (status === 'approved' || status === 'accepted') {
                stats.approved++;
            } else if (status === 'rejected' || status === 'declined') {
                stats.rejected++;
            }
        }

        console.log(`✅ Division ${divisionId} transfer status:`, stats);
        return stats;
    } catch (error) {
        console.error(`❌ getTransferStatusForDivision(${divisionId}) failed:`, error);

        return {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
        };
    }
}
