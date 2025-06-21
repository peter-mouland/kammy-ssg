/* Location: app/transfers/lib/transfer-admin.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId } from '../../teams/types/team-types';
import { getTransferSummary, needsTransferProcessing } from './transfer-integration.service';
import { getReleventTransfers } from './transfer-processor.service';
import { readTransferDataForDivision } from './transfer-reader.service';

/**
 * Admin function: Get comprehensive transfer overview for a division
 */
export async function getTransferOverview(divisionId: DivisionId): Promise<{
    divisionId: DivisionId;
    totalTransfers: number;
    approvedTransfers: number;
    rejectedTransfers: number;
    pendingTransfers: number;
    errors: number;
    gameweekRange: { min: number; max: number } | null;
    managerSummary: Record<string, { transferCount: number; lastTransfer: Date | null }>;
    transfersByType: Record<string, number>;
}> {
    try {
        console.log(`📊 Getting transfer overview for division: ${divisionId}`);

        const transferResult = await readTransferDataForDivision(divisionId);

        // Calculate gameweek range
        let gameweekRange: { min: number; max: number } | null = null;
        if (transferResult.approvedTransfers.length > 0) {
            const gameweeks = transferResult.approvedTransfers.map((t) => t.gameweek);
            gameweekRange = {
                min: Math.min(...gameweeks),
                max: Math.max(...gameweeks),
            };
        }

        // Manager summary
        const managerSummary: Record<string, { transferCount: number; lastTransfer: Date | null }> = {};
        transferResult.approvedTransfers.forEach((transfer) => {
            if (!managerSummary[transfer.managerId]) {
                managerSummary[transfer.managerId] = { transferCount: 0, lastTransfer: null };
            }
            managerSummary[transfer.managerId].transferCount++;

            const currentLast = managerSummary[transfer.managerId].lastTransfer;
            if (!currentLast || transfer.timestamp > currentLast) {
                managerSummary[transfer.managerId].lastTransfer = transfer.timestamp;
            }
        });

        // Transfers by type
        const transfersByType: Record<string, number> = {};
        transferResult.approvedTransfers.forEach((transfer) => {
            transfersByType[transfer.transferType] = (transfersByType[transfer.transferType] || 0) + 1;
        });

        return {
            divisionId,
            totalTransfers: transferResult.processedCount,
            approvedTransfers: transferResult.approvedTransfers.length,
            rejectedTransfers: transferResult.rejectedTransfers.length,
            pendingTransfers: transferResult.pendingTransfers.length,
            errors: transferResult.errors.length,
            gameweekRange,
            managerSummary,
            transfersByType,
        };
    } catch (error) {
        console.error(`❌ Failed to get transfer overview for ${divisionId}:`, error);
        throw error;
    }
}

/**
 * Admin function: Check transfer processing needs across gameweek range
 */
export async function checkTransferProcessingNeeds(
    divisionId: DivisionId,
    gameweekData: GameWeekData,
    fplPlayersByCode: PlayersByCode,
): Promise<{
    needsProcessing: boolean;
    transferCount: number;
    affectedManagers: string[];
    gameweekBreakdown: Record<number, number>;
    summary: string;
}> {
    try {
        console.log(`🔍 Checking transfer processing needs for ${divisionId} GW${gameweekData.fplEvent.id}`);

        const [needsProcessing, transferSummary] = await Promise.all([
            needsTransferProcessing(divisionId, gameweekData, fplPlayersByCode),
            getTransferSummary(divisionId, gameweekData),
        ]);

        // Get gameweek breakdown
        const transferResult = await readTransferDataForDivision(divisionId, fplPlayersByCode);
        const gameweekBreakdown: Record<number, number> = {};

        transferResult.approvedTransfers
            .filter((t) => t.timestamp > gameweekData.start && t.timestamp <= gameweekData.end)
            .forEach((t) => {
                gameweekBreakdown[gameweekData.fplEvent.id] = (gameweekBreakdown[gameweekData.fplEvent.id] || 0) + 1;
            });

        let summary = '';
        if (needsProcessing) {
            summary = `${transferSummary.transferCount} transfers affecting ${transferSummary.affectedManagers.length} managers need processing`;
        } else {
            summary = 'No transfer processing needed';
        }

        return {
            needsProcessing,
            transferCount: transferSummary.transferCount,
            affectedManagers: transferSummary.affectedManagers,
            gameweekBreakdown,
            summary,
        };
    } catch (error) {
        console.error('❌ Error checking transfer processing needs:', error);
        throw error;
    }
}

/**
 * Admin function: Validate transfers for a division
 */
export async function validateDivisionTransfers(divisionId: DivisionId): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
}> {
    try {
        console.log(`🔎 Validating transfers for division: ${divisionId}`);

        const transferResult = await readTransferDataForDivision(divisionId);
        const errors: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for processing errors
        if (transferResult.errors.length > 0) {
            errors.push(`${transferResult.errors.length} transfer processing errors found`);
            transferResult.errors.forEach((error) => {
                errors.push(`Row ${error.rowIndex}: ${error.error}`);
            });
        }

        // Check for duplicate transfers
        const transferMap = new Map<string, number>();
        transferResult.approvedTransfers.forEach((transfer, index) => {
            const key = `${transfer.managerId}-${transfer.timestamp.toISOString()}-${transfer.playerOut.code}-${transfer.playerIn.code}`;
            if (transferMap.has(key)) {
                warnings.push(
                    `Potential duplicate transfer at index ${index}: ${transfer.managerId} transferring ${transfer.playerOut.webName} for ${transfer.playerIn.webName}`,
                );
            }
            transferMap.set(key, index);
        });

        // Check for conflicting transfers (same player transferred multiple times in same gameweek)
        const playerGameweekMap = new Map<string, Array<{ transfer: any; index: number }>>();
        transferResult.approvedTransfers.forEach((transfer, index) => {
            const outKey = `${transfer.playerOut.code}-${transfer.timestamp}`;
            const inKey = `${transfer.playerIn.code}-${transfer.timestamp}`;

            if (!playerGameweekMap.has(outKey)) playerGameweekMap.set(outKey, []);
            if (!playerGameweekMap.has(inKey)) playerGameweekMap.set(inKey, []);

            playerGameweekMap.get(outKey)!.push({ transfer, index });
            playerGameweekMap.get(inKey)!.push({ transfer, index });
        });

        for (const [key, transfers] of playerGameweekMap) {
            if (transfers.length > 1) {
                warnings.push(
                    `Player ${key} involved in multiple transfers: ${transfers.map((t) => `index ${t.index}`).join(', ')}`,
                );
            }
        }

        // Recommendations
        if (transferResult.pendingTransfers.length > 0) {
            recommendations.push(`${transferResult.pendingTransfers.length} pending transfers need approval`);
        }

        if (transferResult.rejectedTransfers.length > 0) {
            recommendations.push(`${transferResult.rejectedTransfers.length} rejected transfers may need review`);
        }

        if (transferResult.approvedTransfers.length > 100) {
            recommendations.push('Large number of transfers - consider archiving old data');
        }

        const isValid = errors.length === 0;

        return {
            isValid,
            errors,
            warnings,
            recommendations,
        };
    } catch (error) {
        console.error(`❌ Error validating transfers for ${divisionId}:`, error);
        return {
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Unknown validation error'],
            warnings: [],
            recommendations: [],
        };
    }
}

/**
 * Admin function: Force reprocess transfers for a gameweek range
 */
export async function forceReprocessTransfers(
    divisionId: DivisionId,
    gameweekData: GameWeekData,
    dryRun: boolean = true,
): Promise<{
    success: boolean;
    transfersFound: number;
    gameweeksAffected: number[];
    changes: string[];
    errors: string[];
}> {
    try {
        console.log(
            `🔄 ${dryRun ? 'DRY RUN: ' : ''}Force reprocessing transfers for ${divisionId} GW${gameweekData.fplEvent.id}`,
        );

        const changes: string[] = [];
        const errors: string[] = [];
        const gameweeksAffected: number[] = [];

        // Get transfer data
        const transferResult = await readTransferDataForDivision(divisionId);
        const relevantTransfers = getReleventTransfers(transferResult.approvedTransfers, gameweekData);

        if (relevantTransfers.length === 0) {
            return {
                success: true,
                transfersFound: 0,
                gameweeksAffected: [],
                changes: ['No transfers found in specified range'],
                errors: [],
            };
        }

        // Group transfers by target gameweek
        const transfersByGameweek = new Map<number, typeof relevantTransfers>();
        relevantTransfers.forEach((transfer) => {
            if (!transfersByGameweek.has(transfer.gameweek)) {
                transfersByGameweek.set(transfer.gameweek, []);
            }
            transfersByGameweek.get(transfer.gameweek)!.push(transfer);
        });

        // Process each gameweek
        for (const [gameweek, transfers] of transfersByGameweek) {
            try {
                gameweeksAffected.push(gameweek);
                changes.push(`GW${gameweek}: ${transfers.length} transfers to process`);

                if (dryRun) {
                    changes.push(`GW${gameweek}: DRY RUN - would process ${transfers.length} transfers`);
                } else {
                    // In a real implementation, you would:
                    // 1. Backup current gameweek document
                    // 2. Recreate from previous gameweek + transfers
                    // 3. Repopulate points
                    changes.push(`GW${gameweek}: Would recreate document with ${transfers.length} transfers`);
                }
            } catch (error) {
                const errorMsg = `Failed to process GW${gameweek}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
            }
        }

        return {
            success: errors.length === 0,
            transfersFound: relevantTransfers.length,
            gameweeksAffected,
            changes,
            errors,
        };
    } catch (error) {
        console.error('❌ Error force reprocessing transfers:', error);
        return {
            success: false,
            transfersFound: 0,
            gameweeksAffected: [],
            changes: [],
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
}

/**
 * Admin function: Get detailed transfer timeline for debugging
 */
export async function getTransferTimeline(
    divisionId: DivisionId,
    managerId?: string,
    playerCode?: number,
): Promise<{
    timeline: Array<{
        timestamp: Date;
        gameweek: number;
        managerId: string;
        transferType: string;
        playerOut: { webName: string; code: number };
        playerIn: { webName: string; code: number };
        status: string;
        comment: string;
    }>;
    summary: {
        totalTransfers: number;
        managerCount: number;
        gameweekRange: { min: number; max: number } | null;
        playerInvolvements: number;
    };
}> {
    try {
        console.log(
            `📋 Getting transfer timeline for ${divisionId}${managerId ? ` (manager: ${managerId})` : ''}${playerCode ? ` (player: ${playerCode})` : ''}`,
        );

        const transferResult = await readTransferDataForDivision(divisionId);
        let allTransfers = [
            ...transferResult.approvedTransfers,
            ...transferResult.rejectedTransfers,
            ...transferResult.pendingTransfers,
        ];

        // Apply filters
        if (managerId) {
            allTransfers = allTransfers.filter((t) => t.managerId === managerId);
        }

        if (playerCode) {
            allTransfers = allTransfers.filter(
                (t) => t.playerOut.code === playerCode || t.playerIn.code === playerCode,
            );
        }

        // Sort by timestamp
        allTransfers.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Create timeline
        const timeline = allTransfers.map((transfer) => ({
            timestamp: transfer.timestamp,
            gameweek: transfer.gameweek,
            managerId: transfer.managerId,
            transferType: transfer.transferType,
            playerOut: transfer.playerOut,
            playerIn: transfer.playerIn,
            status: transfer.status,
            comment: transfer.comment,
        }));

        // Calculate summary
        const managerSet = new Set(allTransfers.map((t) => t.managerId));
        let gameweekRange: { min: number; max: number } | null = null;

        if (allTransfers.length > 0) {
            const gameweeks = allTransfers.map((t) => t.gameweek);
            gameweekRange = {
                min: Math.min(...gameweeks),
                max: Math.max(...gameweeks),
            };
        }

        let playerInvolvements = 0;
        if (playerCode) {
            playerInvolvements = allTransfers.filter(
                (t) => t.playerOut.code === playerCode || t.playerIn.code === playerCode,
            ).length;
        }

        return {
            timeline,
            summary: {
                totalTransfers: allTransfers.length,
                managerCount: managerSet.size,
                gameweekRange,
                playerInvolvements,
            },
        };
    } catch (error) {
        console.error('❌ Error getting transfer timeline:', error);
        throw error;
    }
}
