// app/admin/server/actions/team-commit-actions.ts
import { createDivisionTeamsDocument } from "../../../_shared/services/division-teams.service";
import { getDraftPicksByDivision } from "../../../_shared/lib/sheets/draft";
import { getUserTeamsByDivision } from "../../../_shared/lib/sheets/user-teams";
import { fplApi } from "../../../_shared/lib/fpl/api";
import { convertLegacyPlayersToRoster } from "../../../_shared/lib/roster-conversion-utils";
import type { DraftActionParams, ActionResult } from "../../types";
import type {
    DivisionTeamsDocument,
    TeamPositionSlot,
    PositionSlotKey
} from "../../../teams/types/team-types";

export async function handleCommitTeamsToFirestore(params: DraftActionParams): Promise<ActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error("Division ID is required");
    }

    try {
        console.log(`🔄 Committing teams to new structure for division: ${divisionId}`);

        // Get draft picks and user teams for the division
        const [draftPicks, userTeams, bootstrap] = await Promise.all([
            getDraftPicksByDivision(divisionId),
            getUserTeamsByDivision(divisionId),
            fplApi.getFplBootstrapData()
        ]);

        if (draftPicks.length === 0) {
            throw new Error(`No draft picks found for division ${divisionId}`);
        }
        const fplPlayers = bootstrap.elements;

        // Create FPL players lookup
        const fplPlayersMap = new Map(fplPlayers.map(p => [p.id.toString(), p]));

        // Group picks by user
        const teamsByUser = new Map<string, any[]>();
        for (const pick of draftPicks) {
            if (!teamsByUser.has(pick.userId)) {
                teamsByUser.set(pick.userId, []);
            }
            teamsByUser.get(pick.userId)!.push(pick);
        }

        // Convert each user's picks to new roster structure
        const teamsData: Record<string, { roster: Record<PositionSlotKey, TeamPositionSlot> }> = {};
        let totalPlayersProcessed = 0;

        for (const [userId, userPicks] of teamsByUser) {
            console.log(`Processing ${userPicks.length} picks for user ${userId}`);

            // Convert legacy format to new roster structure
            const legacyPlayers = userPicks.map(pick => {
                const fplPlayer = fplPlayersMap.get(pick.playerId);
                if (!fplPlayer) {
                    console.warn(`FPL player not found for ID ${pick.playerId}`);
                } else if (pick.playerId == fplPlayer?.code) {
                    console.warn(`🚨 FPL player ID id CODE ${pick.playerId}`);

                }

                return {
                    userId,
                    playerId: pick.playerId,
                    playerCode: fplPlayer?.code,
                    player: fplPlayer?.web_name || 'Unknown Player',
                    playerPosition: pick.position, // Draft position from sheets
                    teamPosition: pick.position, // Will be recalculated in conversion
                    isSub: false, // Will be determined by position availability
                    onLoanTo: null,
                    onLoanStart: null,
                    gameweek: 0 // Draft is gameweek 0
                };
            });

            // Convert to new roster structure
            const roster = convertLegacyPlayersToRoster(legacyPlayers, 0);

            teamsData[userId] = { roster };
            totalPlayersProcessed += Object.keys(roster).length;
        }

        // Create the new division document structure
        const now = new Date().toISOString();
        const divisionDocument: DivisionTeamsDocument = {
            divisionId,
            gameweek: 0, // Draft is gameweek 0
            lastUpdated: now,
            teams: teamsData,
            metadata: {
                createdAt: now,
                updatedAt: now,
                pointsLastUpdated: null,
                pointsLastGameweek: null
            }
        };

        // Save the document using the service
        await createDivisionTeamsDocument(divisionDocument);

        const message = `Teams committed to new structure! ${totalPlayersProcessed} position slots across ${teamsByUser.size} teams in division ${divisionId}`;

        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            data: {
                divisionId,
                teamsCount: teamsByUser.size,
                positionSlotsCount: totalPlayersProcessed,
                documentId: `${divisionId}_gw0`,
                gameweek: 0,
                timestamp: now,
                structure: 'new-roster-based'
            }
        };

    } catch (error) {
        console.error('Commit teams to new structure error:', error);
        throw new Error(`Failed to commit teams to new structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Create next gameweek document from current gameweek
 */
export async function createNextGameweekDocument(params: {
    divisionId: string;
    currentGameweek: number;
}): Promise<ActionResult> {
    const { divisionId, currentGameweek } = params;
    const nextGameweek = currentGameweek + 1;

    try {
        console.log(`🔄 Creating GW${nextGameweek} document for division: ${divisionId}`);

        // Get current gameweek document
        const { getDivisionTeamsDocument } = await import("../../../_shared/services/division-teams.service");
        const currentDoc = await getDivisionTeamsDocument(divisionId, currentGameweek);

        if (!currentDoc) {
            throw new Error(`Current gameweek document not found for ${divisionId} GW${currentGameweek}`);
        }

        // Create new document with same roster structure but reset gameweek points
        const newTeamsData: Record<string, { roster: Record<PositionSlotKey, TeamPositionSlot> }> = {};

        for (const [userId, teamData] of Object.entries(currentDoc.teams)) {
            const newRoster: Record<PositionSlotKey, TeamPositionSlot> = {} as Record<PositionSlotKey, TeamPositionSlot>;

            for (const [slot, positionSlot] of Object.entries(teamData.roster)) {
                newRoster[slot as PositionSlotKey] = {
                    ...positionSlot,
                    // Reset gameweek data, keep season data
                    gameweek: {
                        stats: {
                            appearance: 0,
                            goals: 0,
                            assists: 0,
                            cleanSheets: 0,
                            goalsConceded: 0,
                            penaltiesSaved: 0,
                            yellowCards: 0,
                            redCards: 0,
                            saves: 0,
                            bonus: 0
                        },
                        points: {
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
                            total: 0
                        }
                    }
                    // Season data remains unchanged
                };
            }

            newTeamsData[userId] = { roster: newRoster };
        }

        // Create new document
        const now = new Date().toISOString();
        const newDocument: DivisionTeamsDocument = {
            divisionId,
            gameweek: nextGameweek,
            lastUpdated: now,
            teams: newTeamsData,
            metadata: {
                createdAt: now,
                updatedAt: now,
                pointsLastUpdated: null,
                pointsLastGameweek: null
            }
        };

        await createDivisionTeamsDocument(newDocument);

        const message = `Created GW${nextGameweek} document for division ${divisionId}`;

        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            data: {
                divisionId,
                gameweek: nextGameweek,
                documentId: `${divisionId}_gw${nextGameweek}`,
                teamsCount: Object.keys(newTeamsData).length,
                timestamp: now
            }
        };

    } catch (error) {
        console.error('Create next gameweek document error:', error);
        throw new Error(`Failed to create GW${nextGameweek} document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
