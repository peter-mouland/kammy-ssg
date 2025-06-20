// app/_shared/services/division-teams-points-population.service.ts
import { getDivisionTeamsDocument, updateDivisionTeamsDocument } from './division-teams.service';
import { readDivisions } from '../lib/sheets/divisions';
import type { TeamPositionSlot, PositionSlotKey } from '../types/division-teams-types';
import type { PlayerGameweekStatsData, PointsBreakdown } from '../../scoring/types/scoring-types';

/**
 * Populate points data from scoring system into division-teams documents
 */
export async function populatePointsIntoDivisionDocuments(
    targetGameweeks: number[],
    currentGameweek: number,
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

    try {
        // Get calculated points data from FPL cache (after points generation)
        const { fplApiCache } = await import('../lib/fpl/api-cache');
        const enhancedPlayersData = await fplApiCache.getFplPlayers(); // Regular function

        if (!enhancedPlayersData || enhancedPlayersData.length === 0) {
            throw new Error('No enhanced player data found - points may not have been generated yet');
        }

        console.log(`📊 Found enhanced data for ${enhancedPlayersData.length} players`);

        // Get all divisions and process each one
        const divisions = await readDivisions();

        for (const division of divisions) {
            if (division.id === 'leagueOne') {
                try {
                    results.divisionsProcessed++;
                    console.log(`🔄 Processing division: ${division.id}`);

                    for (const gameweek of targetGameweeks) {
                        const playersUpdated = await populatePointsForDivisionGameweek(division.id, gameweek);

                        if (playersUpdated > 0) {
                            results.documentsUpdated++;
                            results.playersUpdated += playersUpdated;
                            console.log(`✅ Updated ${playersUpdated} players in ${division.id}_gw${gameweek}`);
                        }
                    }
                } catch (error) {
                    const errorMsg = `Failed to process division ${division.id}: ${
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
    } catch (error) {
        const errorMsg = `Failed to populate points into division documents: ${
            error instanceof Error ? error.message : 'Unknown error'
        }`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
    }

    return results;
}

/**
 * Populate points for a specific division and gameweek
 * AUTO-CREATES missing documents if needed
 */
async function populatePointsForDivisionGameweek(divisionId: string, gameweek: number): Promise<number> {
    try {
        const { fplApiCache } = await import('../lib/fpl/api-cache');
        // Get the division document - if it doesn't exist, create it
        let divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);

        if (!divisionDoc) {
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

            // Update each position slot
            for (const [slotKey, positionSlot] of Object.entries<TeamPositionSlot>(teamData.roster)) {
                const slot = slotKey as PositionSlotKey;
                const playerCode = positionSlot.player.playerCode;
                const playerId = positionSlot.player.playerId;
                const player = await fplApiCache['fplCache'].getElementGameweek(playerId);

                // Get points data for this player
                const playerGameweekPoints = player.draft.gameweekPoints;
                if (!playerGameweekPoints?.[gameweek]) {
                    console.log(`⚠️ No points data for player ${playerCode} (${typeof playerCode}) GW${gameweek}`);
                    continue;
                }

                const gameweekData = playerGameweekPoints[gameweek];

                // Update gameweek points and stats
                const updatedPositionSlot = updatePositionSlotPoints(
                    positionSlot,
                    gameweek,
                    gameweekData.stats || createEmptyStats(),
                    gameweekData.points || createEmptyPoints(),
                );

                // Update the roster
                divisionDoc.teams[userId].roster[slot] = updatedPositionSlot;
                playersUpdated++;
                hasUpdates = true;

                console.log(
                    `✓ Updated ${positionSlot.player.playerName} (${slot}) - ${gameweekData.points?.total || 0} points`,
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
 * Create missing gameweek document by copying from previous gameweek (recursive)
 */
async function createMissingGameweekDocument(divisionId: string, targetGameweek: number): Promise<boolean> {
    try {
        console.log(`🔄 Creating missing document: ${divisionId}_gw${targetGameweek}`);

        // Find source document to copy from
        let sourceGameweek: number;
        let sourceDoc: any = null;

        if (targetGameweek === 0) {
            // For GW0 (draft), we can't create it automatically - needs draft data
            console.warn(`⚠️ Cannot auto-create GW0 document for ${divisionId} - requires draft completion`);
            return false;
        }

        // Try previous gameweek first
        sourceGameweek = targetGameweek - 1;
        sourceDoc = await getDivisionTeamsDocument(divisionId, sourceGameweek);

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
 * This works with EITHER old or new document structure
 */
async function createGameweekDocumentFromSource(sourceDocument: any, targetGameweek: number): Promise<void> {
    const now = new Date().toISOString();

    console.log(`🔄 Creating ${sourceDocument.divisionId}_gw${targetGameweek} from GW${sourceDocument.gameweek}`);

    // Import the createDivisionTeamsDocument function
    const { createDivisionTeamsDocument } = await import('./division-teams.service');

    // Check if source document uses old structure (teams as arrays) or new structure (teams with rosters)
    const isOldStructure = Array.isArray(Object.values(sourceDocument.teams)[0]);

    if (isOldStructure) {
        // OLD STRUCTURE: Copy as-is but update gameweek
        const newDocument = {
            ...sourceDocument,
            gameweek: targetGameweek,
            lastUpdated: now,
            metadata: {
                ...sourceDocument.metadata,
                updatedAt: now,
            },
        };

        // Update gameweek field for all players
        for (const [userId, players] of Object.entries(newDocument.teams)) {
            newDocument.teams[userId] = (players as any[]).map((player: any) => ({
                ...player,
                gameweek: targetGameweek,
            }));
        }

        await createDivisionTeamsDocument(newDocument);
        console.log(`✅ Created document with OLD structure: ${sourceDocument.divisionId}_gw${targetGameweek}`);
    } else {
        // NEW STRUCTURE: Copy roster structure but reset gameweek data
        const newDocument = {
            divisionId: sourceDocument.divisionId,
            gameweek: targetGameweek,
            lastUpdated: now,
            teams: {},
            metadata: {
                createdAt: now,
                updatedAt: now,
                pointsLastUpdated: null,
                pointsLastGameweek: null,
            },
        };

        // Copy team rosters with reset gameweek data
        for (const [userId, teamData] of Object.entries(sourceDocument.teams)) {
            newDocument.teams[userId] = {
                roster: {},
            };

            // Copy each position slot but reset gameweek stats/points
            for (const [slot, positionSlot] of Object.entries((teamData as any).roster)) {
                newDocument.teams[userId].roster[slot] = {
                    // Keep player info unchanged
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

        await createDivisionTeamsDocument(newDocument);
        console.log(`✅ Created document with NEW structure: ${sourceDocument.divisionId}_gw${targetGameweek}`);
    }
}

/**
 * Update position slot with new gameweek points and recalculate season totals
 */
function updatePositionSlotPoints(
    positionSlot: TeamPositionSlot,
    gameweek: number,
    gameweekStats: PlayerGameweekStatsData,
    gameweekPoints: PointsBreakdown,
): TeamPositionSlot {
    // Create updated position slot
    const updated: TeamPositionSlot = {
        ...positionSlot,
        gameweek: {
            stats: gameweekStats,
            points: gameweekPoints,
        },
        season: {
            // Add this gameweek to season totals
            stats: addStatsToSeason(positionSlot.season.stats, gameweekStats),
            points: addPointsToSeason(positionSlot.season.points, gameweekPoints),
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
function addPointsToSeason(seasonPoints: PointsBreakdown, gameweekPoints: PointsBreakdown): PointsBreakdown {
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
function createEmptyPoints(): PointsBreakdown {
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
