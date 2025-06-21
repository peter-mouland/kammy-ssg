/* Location: app/transfers/lib/transfer-integration.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId, DivisionTeamsDocument, TeamRoster } from '../../teams/types/team-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import { applyTransfersToRosters, getReleventTransfers } from './transfer-processor.service';
import { readTransferDataForDivision } from './transfer-reader.service';

/**
 * Apply transfers when creating a new gameweek document from a previous gameweek
 */
export async function applyTransfersToGameweekDocument(
    sourceDocument: DivisionTeamsDocument,
    targetGameweekId: number,
    gameweeks: GameWeekData[],
    approvedTransfers: ProcessedTransfer[],
): Promise<DivisionTeamsDocument> {
    console.log(
        `🔄 Applying transfers from GW${sourceDocument.gameweek} to GW${targetGameweekId} for ${sourceDocument.divisionId}`,
    );

    try {
        const gameweekData = gameweeks.find((gw) => gw.fplEvent.id === sourceDocument.gameweek + 1);

        console.log(`📋 Found ${approvedTransfers.length} approved transfers for ${sourceDocument.divisionId}`);

        if (approvedTransfers.length === 0) {
            console.log(`ℹ️ No transfers to apply between GW${sourceDocument.gameweek} and GW${targetGameweekId}`);
            return createNewGameweekDocument(sourceDocument, targetGameweekId);
        }

        // Apply transfers to the rosters
        const rosterUpdate = await applyTransfersToRosters(
            extractRostersFromDocument(sourceDocument),
            approvedTransfers,
            gameweekData,
        );

        if (rosterUpdate.errors.length > 0) {
            console.warn('⚠️ Transfer application errors:', rosterUpdate.errors);
        }

        console.log(`✅ Applied ${rosterUpdate.appliedTransfers.length} transfers successfully`);

        // Create new document with updated rosters
        const newDocument = createNewGameweekDocument(sourceDocument, targetGameweekId);
        newDocument.teams = createTeamsFromRosters(rosterUpdate.updatedRosters);

        // Add transfer metadata
        newDocument.metadata = {
            ...newDocument.metadata,
            transfersApplied: rosterUpdate.appliedTransfers.length,
            transfersFrom: sourceDocument.gameweek,
            transferErrors: rosterUpdate.errors.length,
        };

        return newDocument;
    } catch (error) {
        console.error('❌ Failed to apply transfers to gameweek document:', error);

        // Fallback: create document without transfers
        console.log('🔄 Falling back to creating document without transfers');
        return createNewGameweekDocument(sourceDocument, targetGameweekId);
    }
}

/**
 * Extract rosters from division teams document
 */
function extractRostersFromDocument(document: DivisionTeamsDocument): Record<string, TeamRoster> {
    const rosters: Record<string, TeamRoster> = {};

    for (const [userId, teamData] of Object.entries(document.teams)) {
        rosters[userId] = { ...teamData.roster };
    }

    return rosters;
}

/**
 * Create teams structure from rosters
 */
function createTeamsFromRosters(rosters: Record<string, TeamRoster>): DivisionTeamsDocument['teams'] {
    const teams: DivisionTeamsDocument['teams'] = {};

    for (const [userId, roster] of Object.entries(rosters)) {
        teams[userId] = { roster };
    }

    return teams;
}

/**
 * Create a new gameweek document based on source document
 */
function createNewGameweekDocument(
    sourceDocument: DivisionTeamsDocument,
    targetGameweek: number,
): DivisionTeamsDocument {
    const now = new Date().toISOString();

    // Deep copy teams data but reset gameweek-specific data
    const newTeams: DivisionTeamsDocument['teams'] = {};

    for (const [userId, teamData] of Object.entries(sourceDocument.teams)) {
        const newRoster: TeamRoster = {} as TeamRoster;

        for (const [slotKey, positionSlot] of Object.entries(teamData.roster)) {
            newRoster[slotKey as keyof TeamRoster] = {
                player: { ...positionSlot.player },

                // Reset gameweek data to zero
                gameweek: {
                    stats: createEmptyStats(),
                    points: createEmptyPoints(),
                },

                // Keep season data unchanged
                season: { ...positionSlot.season },
            };
        }

        newTeams[userId] = { roster: newRoster };
    }

    return {
        divisionId: sourceDocument.divisionId,
        gameweek: targetGameweek,
        lastUpdated: now,
        teams: newTeams,
        metadata: {
            createdAt: now,
            updatedAt: now,
            pointsLastUpdated: null,
            pointsLastGameweek: null,
            copiedFrom: sourceDocument.gameweek,
            copiedAt: now,
        },
    };
}

/**
 * Create empty stats structure
 */
function createEmptyStats() {
    return {
        appearance: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        goalsConceded: 0,
        penaltiesSaved: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        bonus: 0,
    };
}

/**
 * Create empty points structure
 */
function createEmptyPoints() {
    return {
        appearance: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        penaltiesSaved: 0,
        goalsConceded: 0,
        bonus: 0,
        total: 0,
    };
}

/**
 * Check if transfers need to be processed for a gameweek transition
 */
export async function needsTransferProcessing(
    divisionId: DivisionId,
    gameweekData: GameWeekData,
    fplPlayersByCode: PlayersByCode,
): Promise<boolean> {
    try {
        const transferResult = await readTransferDataForDivision(divisionId, fplPlayersByCode);
        const relevantTransfers = getReleventTransfers(transferResult.approvedTransfers, gameweekData);
        return relevantTransfers.length > 0;
    } catch (error) {
        console.error('❌ Error checking transfer processing needs:', error);
        return false; // Assume no transfers needed if check fails
    }
}

/**
 * Get transfer summary for a gameweek transition
 */
export async function getTransferSummary(
    divisionId: DivisionId,
    gameweekData: GameWeekData,
    fplPlayersByCode: PlayersByCode,
): Promise<{
    transferCount: number;
    affectedManagers: string[];
    transfersByType: Record<string, number>;
}> {
    try {
        const transferResult = await readTransferDataForDivision(divisionId, fplPlayersByCode);

        const relevantTransfers = getReleventTransfers(transferResult.approvedTransfers, gameweekData);

        const affectedManagers = [...new Set(relevantTransfers.map((t) => t.managerId))];

        const transfersByType: Record<string, number> = {};
        relevantTransfers.forEach((transfer) => {
            transfersByType[transfer.transferType] = (transfersByType[transfer.transferType] || 0) + 1;
        });

        return {
            transferCount: relevantTransfers.length,
            affectedManagers,
            transfersByType,
        };
    } catch (error) {
        console.error('❌ Error getting transfer summary:', error);
        return {
            transferCount: 0,
            affectedManagers: [],
            transfersByType: {},
        };
    }
}
