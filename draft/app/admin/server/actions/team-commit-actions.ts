// app/admin/server/actions/team-commit-actions.ts

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { getDraftPicksByDivision } from '../../../_shared/lib/sheets/draft';
import type { PositionSlotKey } from '../../../_shared/types/league-types';
import { createDivisionTeamsDocument } from '../../../scoring/index.server';
import { convertLegacyPlayersToRoster } from '../../../teams/lib/roster-conversion-utils';
import type { DivisionTeamsDocument, TeamPositionSlot } from '../../../teams/types/team-types';
import type { AdminActionResult, DraftActionParams } from '../../types/admin-types';

export async function handleCommitTeamsToFirestore(
    divisionId: DraftActionParams['divisionId'],
): Promise<AdminActionResult> {
    if (!divisionId) throw new Error('Division ID is required');

    try {
        console.log(`🔄 Committing teams to new structure for division: ${divisionId}`);

        // Get draft picks and user teams for the division
        const [draftPicks, fplPlayers] = await Promise.all([
            getDraftPicksByDivision(divisionId),
            fplApiCache.getFplPlayers(),
        ]);

        if (draftPicks.length === 0) {
            throw new Error(`No draft picks found for division ${divisionId}`);
        }

        // Create FPL players lookup
        const fplPlayersMap = new Map(fplPlayers.map((p) => [p.code, p]));

        // Group picks by user
        const teamsByUser = new Map<string, any[]>();
        for (const pick of draftPicks) {
            if (!teamsByUser.has(pick.userId)) {
                teamsByUser.set(pick.userId, []);
            }
            teamsByUser.get(pick.userId)?.push(pick);
        }

        // Convert each user's picks to new roster structure
        const teamsData: Record<string, { roster: Record<PositionSlotKey, TeamPositionSlot> }> = {};
        let totalPlayersProcessed = 0;

        for (const [userId, userPicks] of teamsByUser) {
            // console.log(`Processing ${userPicks.length} picks for user ${userId}`);

            // Convert legacy format to new roster structure
            const legacyPlayers = userPicks.map((pick) => {
                const fplPlayer = fplPlayersMap.get(pick.playerCode);
                if (!fplPlayer) {
                    throw new Error(
                        `FPL player not found for user '${userId}' code ${pick.playerCode} — cannot create roster`,
                    );
                }

                return {
                    userId,
                    playerId: fplPlayer?.id,
                    playerCode: pick.playerCode,
                    player: fplPlayer?.web_name || 'Unknown Player',
                    playerPosition: pick.position, // Draft position from sheets
                    teamPosition: pick.position, // Will be recalculated in conversion
                    isSub: false, // Will be determined by position availability
                    onLoanTo: null,
                    onLoanFrom: null,
                    onLoanStart: null,
                    gameweek: 0, // Draft is gameweek 0
                };
            });

            // Convert to new roster structure
            const roster = convertLegacyPlayersToRoster(legacyPlayers);

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
                pointsLastGameweek: null,
            },
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
                documentId: `${divisionId}_gw1`,
                gameweek: 0,
                timestamp: now,
                structure: 'new-roster-based',
            },
        };
    } catch (error) {
        console.error('Commit teams to new structure error:', error);
        throw new Error(
            `Failed to commit teams to new structure: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
