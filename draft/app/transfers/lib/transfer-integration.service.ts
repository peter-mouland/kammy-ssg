/* Location: app/transfers/lib/transfer-integration.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionTeamsDocument, TeamRoster } from '../../teams/types/team-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import { applyTransfersToRosters, getGameweekTransfers } from './transfer-processor.service';

/**
 * Apply transfers when creating a new gameweek document from a previous gameweek
 */
export async function applyTransfersToGameweekDocument(
    sourceDocument: DivisionTeamsDocument,
    targetGameweekId: number,
    gameweeks: GameWeekData[],
    approvedTransfers: ProcessedTransfer[],
): Promise<DivisionTeamsDocument> {
    console.log(`🔄 Applying transfers for GW${targetGameweekId} for ${sourceDocument.divisionId}`);

    try {
        const gameweekData = gameweeks.find((gw) => gw.fplEvent.id === targetGameweekId);
        const relevantTransfers = getGameweekTransfers(approvedTransfers, gameweekData);

        console.log(
            `📋 Found ${relevantTransfers.length} approved GW transfers for ${sourceDocument.divisionId} GW${targetGameweekId}`,
        );

        if (approvedTransfers.length === 0) {
            console.log(`ℹ️ No transfers to apply between GW${sourceDocument.gameweek} and GW${targetGameweekId}`);
            return createNewGameweekDocument(sourceDocument, targetGameweekId);
        }

        // Apply transfers to the rosters
        const rosterUpdate = await applyTransfersToRosters(sourceDocument.teams, relevantTransfers, gameweekData);

        if (rosterUpdate.errors.length > 0) {
            console.warn('⚠️ Transfer application errors:', rosterUpdate.errors);
        }

        console.log(`✅ Applied ${rosterUpdate.appliedTransfers.length} transfers successfully`);
        rosterUpdate.appliedTransfers.forEach((t) => {
            console.log(`   ... applied ${t.positionSlot} ${t.playerBefore?.web_name} -> ${t.playerAfter.web_name}`);
        });

        // Create new document with updated rosters
        const newDocument = createNewGameweekDocument(sourceDocument, targetGameweekId);
        newDocument.teams = rosterUpdate.updatedRosters;

        // Add transfer metadata
        newDocument.metadata = {
            ...newDocument.metadata,
            transfersApplied: rosterUpdate.appliedTransfers.length,
            transfersFrom: targetGameweekId,
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
            if (slotKey === 'on_loan_0' && positionSlot) {
                newRoster[slotKey] = {
                    player: { ...positionSlot.player },
                    gameweek: null,
                    season: null,
                };
            } else if (positionSlot) {
                newRoster[slotKey as Exclude<keyof TeamRoster, 'on_loan_0'>] = {
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
