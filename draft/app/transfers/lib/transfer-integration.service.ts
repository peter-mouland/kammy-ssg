/* Location: app/transfers/lib/transfer-integration.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PositionSlotKey } from '../../_shared/types/league-types';
import type { TeamRoster } from '../../_shared/types/squad-types';
import type { DivisionTeamsDocument } from '../../teams';
import { createEmptyPoints, createEmptyStats, isSlotScoringActive } from '../../teams';
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

        if (relevantTransfers.length === 0) {
            return createNewGameweekDocument(sourceDocument, targetGameweekId);
        }

        // Apply transfers to the rosters
        const rosterUpdate = await applyTransfersToRosters(sourceDocument.teams, relevantTransfers, gameweekData);

        if (rosterUpdate.errors.length > 0) {
            console.warn('⚠️ Transfer application errors:', rosterUpdate.errors);
        }

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
            const season = isSlotScoringActive(slotKey as PositionSlotKey)
                ? positionSlot.season
                : {
                      stats: createEmptyStats(),
                      points: createEmptyPoints(),
                      seasonUpToGameweek: 0,
                      seasonGeneratedOn: '',
                  };
            newRoster[slotKey as keyof TeamRoster] = {
                player: { ...positionSlot.player },
                gameweek: {
                    stats: createEmptyStats(),
                    points: createEmptyPoints(),
                },
                season, // Keep season data unchanged
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
