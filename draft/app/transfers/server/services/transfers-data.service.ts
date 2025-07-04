/* Location: app/transfers/server/services/transfers-data.service.ts */

import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import type { DivisionId, RosterByManagerId } from '../../../teams/types/team-types';
import { getDefaultRuleConfiguration } from '../../lib/transfer-rule-definitions';
import { validateTransfers } from '../../lib/transfer-validation.service';
import type { TransferValidationResult } from '../../types/transfer-rule-types';
/**
 * Get transfers for a specific division and gameweek
 */
export async function getTransfersForDivision(divisionId: DivisionId, gameweek: number) {
    console.log(`📋 Loading transfers for ${divisionId} GW${gameweek}`);

    // Get gameweek data for filtering
    const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');
    const gameweeks = await fplApiCache.getFplEvents();
    const gameweekData = gameweeks.find((gw) => gw.fplEvent.id === gameweek);

    const gameweekTransfers = await getTransfersDataForDivision(divisionId, gameweekData);

    console.log(`✅ Found ${gameweekTransfers.transfers.length} transfers for ${divisionId} GW${gameweek}`);
    return gameweekTransfers;
}

/**
 * Get transfers data for a specific division using enhanced validation
 */
export async function getTransfersDataForDivision(divisionId: DivisionId, gameweek: GameWeekData) {
    try {
        const [{ readTransferDataForDivision }, { fplApiCache }] = await Promise.all([
            import('../../../_shared/lib/sheets/transfers'),
            import('../../../_shared/lib/fpl/api-cache'),
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
 /**
 * Get division rosters for transfer validation
 */
async function getDivisionRosters(divisionId: DivisionId, gameweek: number): Promise<RosterByManagerId> {
    try {
        console.log(`📋 Getting division rosters for ${divisionId} GW${gameweek}`);

        // Import the division teams service
        const { getDivisionTeamsDocument } = await import('../../../scoring/server/services/division-teams.service');

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
