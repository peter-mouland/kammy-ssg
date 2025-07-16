/* Location: app/transfers/server/services/transfers-data.service.ts */

import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import type { DivisionId, PositionSlotKey, RosterByManagerId } from '../../../teams/types/team-types';
import { validateTransfers } from '../../lib/transfer-validation.service';
import type { TransferValidationResult } from '../../types/transfer-rule-types';
import type { OwnedPlayersByCode } from '../../types/transfer-form-types';

/**
 * Get transfers data for a specific division using enhanced validation
 */
/**
 * Get transfers data for a specific division using enhanced validation
 * Fixed version that properly handles gameweek data structure
 */
export async function getTransfersDataForDivision(divisionId: DivisionId, gameweek: GameWeekData) {
    try {
        const [{ readTransferDataForDivision }, { fplApiCache }] = await Promise.all([
            import('../../../_shared/lib/sheets/transfers'),
            import('../../../_shared/lib/fpl/api-cache'),
        ]);

        // Validate gameweek data structure and extract ID safely
        const gameweekId = gameweek?.fplEvent.id || 0;

        console.log(`🔄 Getting transfers data for ${divisionId} GW${gameweekId}`);

        // Get transfer data from sheets
        const gameweekData = await fplApiCache.getFplEvents();
        const fplPlayersByCode = await fplApiCache.getPlayersByCode();
        const transferResult = await readTransferDataForDivision(divisionId, fplPlayersByCode, gameweekData);
        const currentGameweek = await fplApiCache.getCurrentGameweekData();
        const divisionRosters = await getDivisionRosters(divisionId, gameweekId - 1);
        const ownedPlayersByCode = Object.entries(divisionRosters).reduce((acc: OwnedPlayersByCode, [managerId, team]) => {
            (Object.keys(team.roster) as PositionSlotKey[]).forEach((slotKey) => {
                const slot = team.roster[slotKey];
                acc[slot.player.playerCode] = { managerId, slotKey, slot };
            });

            return acc;
        }, {});

        console.log(
            `🔄 Running enhanced sequential validation for ${transferResult.transfers.length} transfers: ${divisionId}: gw${gameweekId}`,
        );

        // Use enhanced validation service for sequential validation
        const gameweekTransfers = transferResult.transfers
            .filter((t) => {
                // Handle both possible structures for gameweek data
                const transferGameweekId = t.gameweekData?.fplEvent?.id;
                return transferGameweekId === gameweekId;
            })
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const validationContext = {
            allGameweekTransfers: gameweekTransfers,
            divisionRosters,
            gameweekData: currentGameweek,
            fplPlayersByCode,
            divisionId,
            currentGameweek: gameweekId,
            ownedPlayersByCode,
        };
        const sequentialResult = await validateTransfers(gameweekTransfers, validationContext);

        // Convert sequential results to the expected format
        const transfers = sequentialResult.transferValidations.map((item) => ({
            transfer: item.transfer,
            validation: item.validation as TransferValidationResult,
            recommendation: item.validation.recommendation,
        }));

        // Calculate stats
        const statusStats = {
            pendingCount: transfers.filter((t) => t.transfer.status === 'PENDING').length,
            approvedCount: transfers.filter((t) => t.transfer.status === 'APPROVED').length,
            rejectedCount: transfers.filter((t) => t.transfer.status === 'REJECTED').length,
            processedCount: transfers.filter((t) => t.transfer.status !== 'PENDING').length,
        };

        const validationStats = {
            totalValidated: transfers.length,
            autoApproved: transfers.filter((t) => t.recommendation === 'APPROVE').length,
            autoRejected: transfers.filter((t) => t.recommendation === 'REJECT').length,
            needsReview: transfers.filter((t) => t.recommendation === 'REVIEW').length,
        };

        console.log(
            `✅ Transfers data loaded for ${divisionId}: ${transfers.length} transfers, ${statusStats.pendingCount} pending`,
        );

        return {
            divisionId,
            transfers,
            statusStats,
            validationStats,
            divisionRosters,
            validationContext,
        };
    } catch (error) {
        console.error(`❌ Failed to get transfers data for ${divisionId}:`, error);

        // Return safe fallback data
        return {
            divisionId,
            transfers: [],
            statusStats: {
                pendingCount: 0,
                approvedCount: 0,
                rejectedCount: 0,
                processedCount: 0,
            },
            validationStats: {
                totalValidated: 0,
                autoApproved: 0,
                autoRejected: 0,
                needsReview: 0,
            },
            divisionRosters: {},
            validationContext: {},
        };
    }
}

/**
 /**
 * Get division rosters for transfer validation
 */
async function getDivisionRosters(divisionId: DivisionId, gameweek: number): Promise<RosterByManagerId> {
    try {
        const { getDivisionTeamsDocument } = await import('../../../scoring/server/services/division-teams.service');

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

        return divisionDocument.teams;
    } catch (error) {
        console.error(`❌ Failed to get division rosters for ${divisionId}:`, error);
        // Return empty rosters on error to prevent validation from failing
        return {};
    }
}
