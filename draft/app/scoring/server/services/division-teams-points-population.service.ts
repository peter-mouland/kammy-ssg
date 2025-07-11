// app/_shared/services/division-teams-points-population.service.ts

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import { readTransferDataForDivision } from '../../../_shared/lib/sheets/transfers';
import type { PlayerGameweekStatsData } from '../../../players/types/player-types';
import type {
    DivisionId,
    DivisionTeamsDocument,
    PositionSlotKey,
    TeamPositionSlot,
} from '../../../teams/types/team-types';
import { applyTransfersToGameweekDocument } from '../../../transfers/lib/transfer-integration.service';
import { generateGameweekData } from '../../lib/generators';
import type { Points } from '../../types/scoring-types';
import { getDivisionTeamsDocument, updateDivisionTeamsDocument } from './division-teams.service';

/**
 * Populate points data from scoring system into division-teams documents
 */
export async function populatePointsIntoDivisionDocuments(
    targetGameweeks: number[],
    options: { forceFullRegeneration?: boolean } = {},
): Promise<{
    divisionsProcessed: number;
    documentsUpdated: number;
    playersUpdated: number;
    errors: string[];
}> {
    console.log(`🔄 Populating points into division documents for gameweeks: ${targetGameweeks.join(', ')}`);

    const results = {
        divisionsProcessed: 0,
        documentsUpdated: 0,
        playersUpdated: 0,
        errors: [] as string[],
    };

    // Get all divisions and process each one
    const divisions = await readDivisions();
    const sortedGameweeks = [...targetGameweeks].sort((a, b) => a - b);
    // const sortedGameweeks = [32, 33, 34, 35, 36, 37, 38].sort((a, b) => a - b);

    for (const division of divisions) {
        if (division.id === 'premierLeague') {
            try {
                results.divisionsProcessed++;
                console.log(`🔄 Processing division: ${division.id}`);

                for (const gameweekId of sortedGameweeks) {
                    const playersUpdated = await populatePointsForDivisionGameweek(division.id, gameweekId, {
                        ...options,
                        isFirstGameweekInRegeneration: gameweekId === sortedGameweeks[0],
                    });

                    if (playersUpdated > 0) {
                        results.documentsUpdated++;
                        results.playersUpdated += playersUpdated;
                        console.log(`✅ Updated ${playersUpdated} players in ${division.id}_gw${gameweekId}`);
                    }
                }
            } catch (error) {
                const errorMsg = `Failed to process division ${division.id}, probably an error in populatePointsForDivisionGameweek: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`;
                console.error(`❌ ${errorMsg}`);
                results.errors.push(errorMsg);
            }
        }
    }

    console.log(
        `✅ Points population complete: ${results.documentsUpdated} documents updated, ${results.playersUpdated} players updated`,
    );
    return results;
}

/**
 * Populate points for a specific division and gameweek
 * AUTO-CREATES missing documents if needed
 */
type Options = {
    forceTransfers?: boolean;
    forceFullRegeneration?: boolean;
    isFirstGameweekInRegeneration?: boolean;
};
async function populatePointsForDivisionGameweek(
    divisionId: DivisionId,
    gameweek: number,
    options: Options = {},
): Promise<number> {
    try {
        const { readPlayers } = await import('../../../_shared/lib/sheets/players');

        // Get required players
        const [sheetsPlayers, fplPlayers] = await Promise.all([readPlayers(), fplApiCache.getFplPlayers()]);
        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, any>, player) => {
            acc[player.id] = player;
            return acc;
        }, {});
        const filteredFplPlayers = fplPlayers.filter((player) => sheetsPlayersById[player.id]);
        const playerIds = filteredFplPlayers.map((p) => p.id);
        if (playerIds.length === 0) {
            throw new Error('No players found that exist in both FPL data and sheets');
        }

        // Get the division document - if it doesn't exist, create it
        let divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);

        if (!divisionDoc || options.forceTransfers || options.forceFullRegeneration) {
            console.log(`📄 Document ${divisionId}_gw${gameweek} doesn't exist - creating it...`);

            // Create the missing document by copying from previous gameweek
            const documentCreated = await createMissingGameweekDocument(divisionId, gameweek);

            if (!documentCreated) {
                console.warn(`⚠️ Could not create missing document for ${divisionId}_gw${gameweek}`);
                return 0;
            }

            // Try to get the document again after creation
            divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);
            if (!divisionDoc) {
                console.error(`❌ Failed to retrieve newly created document ${divisionId}_gw${gameweek}`);
                return 0;
            }

            console.log(`✅ Created and retrieved ${divisionId}_gw${gameweek}`);
        }

        console.log(`🔄 Populating points for ${divisionId}_gw${gameweek}`);

        let playersUpdated = 0;
        let hasUpdates = false;

        // Update each team's roster
        for (const [userId, teamData] of Object.entries(divisionDoc.teams)) {
            if (!teamData.roster) {
                console.warn(`⚠️ No roster found for user ${userId} in ${divisionId}_gw${gameweek}`);
                continue;
            }
            const rosteredPlayers = Object.values(teamData.roster).map(({ player }) => player);
            const playerGameweekPoints = await calculatePointsForGameweeks([gameweek], rosteredPlayers);

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
                const updatedPositionSlot = updatePositionSlotPoints(
                    positionSlot,
                    gameweek,
                    playerGameweek.stats || createEmptyStats(),
                    playerGameweek.points || createEmptyPoints(),
                    options.forceFullRegeneration && options.isFirstGameweekInRegeneration,
                );

                // Update the roster
                divisionDoc.teams[userId].roster[slot] = updatedPositionSlot;
                playersUpdated++;
                hasUpdates = true;

                console.log(
                    `✓ Updated ${positionSlot.player.playerName} (${slot}) - ${playerGameweek.points.total || 0} points`,
                );
            }
        }

        // Save the updated document if there were changes
        if (hasUpdates) {
            await updateDivisionTeamsDocument(divisionId, gameweek, {
                teams: divisionDoc.teams,
                'metadata.pointsLastUpdated': new Date().toISOString(),
                'metadata.pointsLastGameweek': gameweek,
            });

            console.log(`✅ Saved updates to ${divisionId}_gw${gameweek}`);
        }

        return playersUpdated;
    } catch (error) {
        console.error(`❌ Failed to populate points for ${divisionId} GW${gameweek}:`, error);
        throw error;
    }
}

/**
 * Generate points for specific gameweeks
 */
async function calculatePointsForGameweeks(targetGameweeks: number[], fplPlayers: TeamPositionSlot['player'][]) {
    console.log(`🔄 Generating points for gameweeks: ${targetGameweeks.join(', ')}`);

    // Get detailed stats for filtered players
    const playerIds = fplPlayers.map(({ playerId }) => playerId);
    const fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(playerIds);
    const gameweekPointsData = generateGameweekData(fplPlayers, fplPlayerGameweeksById, targetGameweeks);

    console.log(`✅ Generated points for ${Object.keys(gameweekPointsData).length} players`);
    return gameweekPointsData;
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
 * FIXED: Only adds gameweek points to season if this gameweek hasn't been included yet
 * FOR FULL REGENERATION: Can reset season totals to start fresh
 */
function updatePositionSlotPoints(
    positionSlot: TeamPositionSlot,
    gameweek: number,
    gameweekStats: PlayerGameweekStatsData,
    gameweekPoints: Points,
    isGameweekOneReset: boolean = false,
): TeamPositionSlot {
    const now = new Date().toISOString();

    // For full regeneration, reset season totals on the first gameweek
    if (isGameweekOneReset) {
        console.log(
            `🔄 FULL REGENERATION: Resetting season totals for ${positionSlot.player.playerName} and starting fresh from GW${gameweek}`,
        );

        const updated: TeamPositionSlot = {
            ...positionSlot,
            gameweek: {
                stats: gameweekStats,
                points: gameweekPoints,
            },
            season: {
                // Start fresh with just this gameweek's data
                stats: { ...gameweekStats },
                points: { ...gameweekPoints },
                seasonUpToGameweek: gameweek,
                seasonGeneratedOn: now,
            },
        };

        return updated;
    }

    // Normal incremental logic (existing logic)
    // Ensure season tracking fields exist (for backward compatibility)
    const currentSeasonUpToGameweek = positionSlot.season.seasonUpToGameweek || 0;
    const currentSeasonGeneratedOn = positionSlot.season.seasonGeneratedOn || now;

    // Determine if we need to add this gameweek to season totals
    const shouldAddToSeason = gameweek > currentSeasonUpToGameweek;

    let updatedSeasonStats = positionSlot.season.stats;
    let updatedSeasonPoints = positionSlot.season.points;
    let updatedSeasonUpToGameweek = currentSeasonUpToGameweek;
    let updatedSeasonGeneratedOn = currentSeasonGeneratedOn;

    if (shouldAddToSeason) {
        // Only add to season totals if this gameweek hasn't been included yet
        updatedSeasonStats = addStatsToSeason(positionSlot.season.stats, gameweekStats);
        updatedSeasonPoints = addPointsToSeason(positionSlot.season.points, gameweekPoints);
        updatedSeasonUpToGameweek = gameweek;
        updatedSeasonGeneratedOn = now;

        console.log(
            `📈 Adding GW${gameweek} to season totals for player ${positionSlot.player.playerName} (was up to GW${currentSeasonUpToGameweek})`,
        );
    } else {
        console.log(
            `⏭️ Skipping season addition for GW${gameweek} - already included (season up to GW${currentSeasonUpToGameweek})`,
        );
    }

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
            seasonUpToGameweek: updatedSeasonUpToGameweek,
            seasonGeneratedOn: updatedSeasonGeneratedOn,
        },
    };

    return updated;
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
