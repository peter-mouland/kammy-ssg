// app/_shared/services/division-teams-points-population.service.ts

import { FirestoreClient } from '../../../_shared/lib/firestore-cache/firestore-client';
import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { readTransferDataForDivision } from '../../../_shared/lib/sheets/transfers';
import type { AdminDataContext } from '../../../admin/types/admin-orchestrator-types';
import type { PlayerGameweekStatsData } from '../../../players/types/player-types';
import type {
    DivisionId,
    DivisionTeamsDocument,
    PositionSlotKey, TeamGameweekData,
    TeamPositionSlot,
} from '../../../teams/types/team-types';
import { applyTransfersToGameweekDocument } from '../../../transfers/lib/transfer-integration.service';
import { generateGameweekData } from '../../lib/generators';
import type { EnhancedPlayerData, Points } from '../../types/scoring-types';
import { getDivisionTeamsDocument } from './division-teams.service';

export class DivisionGameweekPointsService {
    private contextData: AdminDataContext;
    private gameweek?: number;
    private playerIds: number[];
    private fplPlayers: EnhancedPlayerData[];

    constructor({
        contextData,
        gameweek,
    }: {
        contextData: AdminDataContext;
        gameweek?: number;
    }) {
        this.contextData = contextData;
        this.gameweek = gameweek;

        const fplPlayers = this.contextData.fplData.players;
        const sheetsPlayers = this.contextData.sheetData.players;

        // Get required players
        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, any>, player) => {
            acc[player.id] = player;
            return acc;
        }, {});

        this.fplPlayers = fplPlayers.filter((player) => sheetsPlayersById[player.id]);
        this.playerIds = this.fplPlayers.map((p) => p.id);
    }
}

type CalcProps = {
    gameweek: number;
    userId: string;
    teamData: TeamGameweekData;
    divisionDoc: DivisionTeamsDocument;
    previousDivisionDoc: DivisionTeamsDocument;
}
export async function calculateSingleTeamPoints({ gameweek, userId, teamData, divisionDoc, previousDivisionDoc }: CalcProps) {
    try {
        const rosterPlayers = Object.values(teamData.roster).map(({ player }) => player);
        const rosteredPlayerIds = Object.values(teamData.roster).map(({ player }) => player.playerId);
        const fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(rosteredPlayerIds);
        const playerGameweekPoints = generateGameweekData(rosterPlayers, fplPlayerGameweeksById, gameweek);

        // Update each position slot
        for (const [slotKey, positionSlot] of Object.entries<TeamPositionSlot>(teamData.roster)) {
            const slot = slotKey as PositionSlotKey;

            // Update gameweek points and stats
            const playerGameweek = playerGameweekPoints[positionSlot.player.playerId][gameweek];
            if (!playerGameweek) {
                console.error(
                    `🚨 no data for ${positionSlot.player.playerName} (${positionSlot.player.playerId}) gw${gameweek}`,
                );
            }
            const prevGameweek = previousDivisionDoc.teams[userId].roster[slot]
            if (!prevGameweek && slot === 'on_loan_0') {
                // not a concern, loans get deleted when finished
            } else if (!prevGameweek) {
                    console.error(`🚨 no data for prevGameweek: ${userId} ${slot}`);
            } else {
                const updatedPositionSlot = updatePositionSlotPoints(
                    positionSlot,
                    gameweek,
                    playerGameweek.stats || createEmptyStats(),
                    playerGameweek.points || createEmptyPoints(),
                    prevGameweek
                );

                divisionDoc.teams[userId].roster[slot] = updatedPositionSlot;
            }
        }
    } catch (e) {
        console.error(e)
        throw new Error(`calculateSingleTeamPoints: ` + e.message)
    }
}

export async function upsertDivisionTeamsDocument(divisionId: DivisionId, gameweek: number, options) {
    let divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);

    if (!divisionDoc || options.forceFullRegeneration) {
        console.log(`📄 Document ${divisionId}_gw${gameweek} doesn't exist - creating it...`);

        // Create the missing document by copying from previous gameweek
        const documentCreated = await createMissingGameweekDocument(divisionId, gameweek);

        if (!documentCreated) {
            console.warn(`⚠️ Could not create missing document for ${divisionId}_gw${gameweek}`);
            return null;
        }

        // Try to get the document again after creation
        divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);
        if (!divisionDoc) {
            console.error(`❌ Failed to retrieve newly created document ${divisionId}_gw${gameweek}`);
            return null;
        }

        console.log(`✅ Created and retrieved ${divisionId}_gw${gameweek}`);
    }
    return divisionDoc;
}

/**
 * Create missing gameweek document by copying from previous gameweek (recursive)
 */
async function createMissingGameweekDocument(divisionId: DivisionId, targetGameweek: number): Promise<boolean> {
    try {
        console.log(`🔄 Creating missing document: ${divisionId}_gw${targetGameweek}`);

        // Find source document to copy from
        const sourceGameweek = targetGameweek - 1;

        if (targetGameweek === 0) {
            // For GW0 (draft), we can't create it automatically - needs draft data
            console.warn(`⚠️ Cannot auto-create GW0 document for ${divisionId} - requires draft completion`);
            return false;
        }

        let sourceDoc = await getDivisionTeamsDocument(divisionId, sourceGameweek);

        if (!sourceDoc) {
            // Previous gameweek doesn't exist either - recursively create it first
            console.log(`📄 Source document ${divisionId}_gw${sourceGameweek} also missing - creating recursively...`);

            const sourceCreated = await createMissingGameweekDocument(divisionId, sourceGameweek);
            if (sourceCreated) {
                // Successfully created source, now get it
                sourceDoc = await getDivisionTeamsDocument(divisionId, sourceGameweek);
            } else {
                console.error(`❌ No source document available for ${divisionId} (no GW0 draft document)`);
                return false;
            }
        }

        console.log(`📋 Using ${divisionId}_gw${sourceGameweek} as source for GW${targetGameweek}`);

        // Create new document by copying source
        await createGameweekDocumentFromSource(sourceDoc, targetGameweek);

        return true;
    } catch (error) {
        console.error(`❌ Failed to create missing document ${divisionId}_gw${targetGameweek}:`, error);
        return false;
    }
}

/**
 * Create a new gameweek document by copying from source document
 */
async function createGameweekDocumentFromSource(
    sourceDocument: DivisionTeamsDocument,
    targetGameweek: number,
): Promise<void> {
    const now = new Date().toISOString();

    console.log(
        `🔄 Creating ${sourceDocument.divisionId}_gw${targetGameweek} from GW${sourceDocument.gameweek} with transfer integration`,
    );

    // Import the createDivisionTeamsDocument function
    const { createDivisionTeamsDocument } = await import('./division-teams.service');
    const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');

    const gameweekData = await fplApiCache.getFplEvents();
    const fplPlayersByCode = await fplApiCache.getPlayersByCode();
    // Read transfer data for this division
    const transferResult = await readTransferDataForDivision(sourceDocument.divisionId, fplPlayersByCode, gameweekData);
    if (transferResult.errors.length > 0) {
        console.warn(`⚠️ Transfer reading errors for ${sourceDocument.divisionId}:`, transferResult.errors);
    }
    const approvedTransfers = transferResult.transfers.filter((transfer) => transfer.status === 'APPROVED');

    // Filter for approved transfers only
    try {
        const newDocument = await applyTransfersToGameweekDocument(
            sourceDocument,
            targetGameweek,
            gameweekData,
            approvedTransfers,
        );
        await createDivisionTeamsDocument(newDocument);

        console.log(`✅ Created document with transfer integration: ${sourceDocument.divisionId}_gw${targetGameweek}`);
        console.log('📊 Transfer summary:', {
            transfersApplied: newDocument.metadata?.transfersApplied || 0,
            transferErrors: newDocument.metadata?.transferErrors || 0,
            copiedFrom: newDocument.metadata?.copiedFrom || sourceDocument.gameweek,
        });
    } catch (transferError) {
        console.warn('⚠️ Transfer integration failed, falling back to basic copy:', transferError);

        // FALLBACK: Create document without transfers (existing logic)
        const fallbackDocument = {
            divisionId: sourceDocument.divisionId,
            gameweek: targetGameweek,
            lastUpdated: now,
            teams: {},
            metadata: {
                createdAt: now,
                updatedAt: now,
                pointsLastUpdated: null,
                pointsLastGameweek: null,
                transferIntegrationFailed: true,
                transferError: transferError instanceof Error ? transferError.message : 'Unknown transfer error',
            },
        };

        // Copy team rosters with reset gameweek data (existing logic)
        for (const [userId, teamData] of Object.entries(sourceDocument.teams)) {
            fallbackDocument.teams[userId] = {
                roster: {},
            };

            // Copy each position slot but reset gameweek stats/points
            for (const [slot, positionSlot] of Object.entries(teamData.roster)) {
                fallbackDocument.teams[userId].roster[slot] = {
                    // Keep player info unchanged
                    player: { ...positionSlot.player },

                    // Reset gameweek data to zero
                    gameweek: {
                        stats: createEmptyStats(),
                        points: createEmptyPoints(),
                    },

                    // Keep season data unchanged from source, but ensure tracking fields exist
                    season: {
                        ...positionSlot.season,
                        seasonUpToGameweek: positionSlot.season.seasonUpToGameweek || 0,
                        seasonGeneratedOn: positionSlot.season.seasonGeneratedOn || now,
                    },
                };
            }
        }

        await createDivisionTeamsDocument(fallbackDocument);
        console.log(
            `✅ Created document with fallback (no transfers): ${sourceDocument.divisionId}_gw${targetGameweek}`,
        );
    }
}

/**
 * Update position slot with new gameweek points and smart season total accumulation
 */
function updatePositionSlotPoints(
    positionSlot: TeamPositionSlot,
    gameweek: number,
    gameweekStats: PlayerGameweekStatsData,
    gameweekPoints: Points,
    previousGameweekPositionSlot: TeamPositionSlot,
): TeamPositionSlot {
    try {
        const updatedSeasonStats = addStatsToSeason(previousGameweekPositionSlot.season.stats, gameweekStats);
        const updatedSeasonPoints = addPointsToSeason(previousGameweekPositionSlot.season.points, gameweekPoints);

        // Create updated position slot
        const updated: TeamPositionSlot = {
            ...positionSlot,
            gameweek: {
                stats: gameweekStats,
                points: gameweekPoints,
            },
            season: {
                stats: updatedSeasonStats,
                points: updatedSeasonPoints,
                seasonUpToGameweek: gameweek,
                seasonGeneratedOn: new Date().toISOString(),
            },
        };
        return updated;
    } catch (e) {
        console.log(`updatePositionSlotPoints + ${e.message}`)
        throw new Error(`updatePositionSlotPoints + ${e.message}`)
    }

}

/**
 * Add gameweek stats to season totals
 */
function addStatsToSeason(
    seasonStats: PlayerGameweekStatsData,
    gameweekStats: PlayerGameweekStatsData,
): PlayerGameweekStatsData {
    return {
        appearance: seasonStats.appearance + gameweekStats.appearance,
        goals: seasonStats.goals + gameweekStats.goals,
        assists: seasonStats.assists + gameweekStats.assists,
        cleanSheets: seasonStats.cleanSheets + gameweekStats.cleanSheets,
        goalsConceded: seasonStats.goalsConceded + gameweekStats.goalsConceded,
        penaltiesSaved: seasonStats.penaltiesSaved + gameweekStats.penaltiesSaved,
        yellowCards: seasonStats.yellowCards + gameweekStats.yellowCards,
        redCards: seasonStats.redCards + gameweekStats.redCards,
        saves: seasonStats.saves + gameweekStats.saves,
        bonus: seasonStats.bonus + gameweekStats.bonus,
    };
}

/**
 * Add gameweek points to season totals
 */
function addPointsToSeason(seasonPoints: Points, gameweekPoints: Points): Points {
    const updated = {
        appearance: seasonPoints.appearance + gameweekPoints.appearance,
        goals: seasonPoints.goals + gameweekPoints.goals,
        assists: seasonPoints.assists + gameweekPoints.assists,
        cleanSheets: seasonPoints.cleanSheets + gameweekPoints.cleanSheets,
        yellowCards: seasonPoints.yellowCards + gameweekPoints.yellowCards,
        redCards: seasonPoints.redCards + gameweekPoints.redCards,
        saves: seasonPoints.saves + gameweekPoints.saves,
        penaltiesSaved: seasonPoints.penaltiesSaved + gameweekPoints.penaltiesSaved,
        goalsConceded: seasonPoints.goalsConceded + gameweekPoints.goalsConceded,
        bonus: seasonPoints.bonus + gameweekPoints.bonus,
        total: 0,
    };

    // Calculate new total
    updated.total = Object.entries(updated)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0);

    return updated;
}

/**
 * Create empty stats structure
 */
function createEmptyStats(): PlayerGameweekStatsData {
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
function createEmptyPoints(): Points {
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
