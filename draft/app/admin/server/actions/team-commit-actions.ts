// /admin/server/actions/team-commit-actions.ts
import { getFirestoreInstance } from "../../../_shared/lib/firestore-cache/firebase.admin";
import { getDraftPicksByDivision } from "../../../_shared/lib/sheets/draft";
import { getUserTeamsByDivision } from "../../../_shared/lib/sheets/user-teams";
import type { DraftActionParams, ActionResult } from "../../types";

interface FirestoreTeamMember {
    userId: string;
    teamPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca' | 'sub';
    playerPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';
    player: string; // web_name
    playerCode: number;
    onLoanTo: string | null;
    isSub: boolean;
}

export async function handleCommitTeamsToFirestore(params: DraftActionParams): Promise<ActionResult> {
    const { divisionId } = params;

    if (!divisionId) {
        throw new Error("Division ID is required");
    }

    try {
        console.log(`🔄 Committing teams to Firestore for division: ${divisionId}`);

        // Get draft picks and user teams for the division
        const [draftPicks, userTeams] = await Promise.all([
            getDraftPicksByDivision(divisionId),
            getUserTeamsByDivision(divisionId)
        ]);

        if (draftPicks.length === 0) {
            throw new Error("No draft picks found for this division");
        }

        if (userTeams.length === 0) {
            throw new Error("No user teams found for this division");
        }

        // Get FPL player data to get web_name and playerCode
        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');
        const allPlayers = await fplApiCache.getBootstrapElements();

        // Create player lookup map
        const playerLookup = new Map(
            allPlayers.map(player => [player.id.toString(), player])
        );

        // Group picks by user
        const teamsByUser = new Map<string, any[]>();

        draftPicks.forEach(pick => {
            if (!teamsByUser.has(pick.userId)) {
                teamsByUser.set(pick.userId, []);
            }
            teamsByUser.get(pick.userId)!.push(pick);
        });

        // Get Firestore instance
        const db = getFirestoreInstance();
        const batch = db.batch();
        let totalMembersCommitted = 0;

        // Process each user's team
        for (const [userId, picks] of teamsByUser) {
            const userTeam = userTeams.find(team => team.userId === userId);

            if (!userTeam) {
                console.warn(`No user team found for userId: ${userId}`);
                continue;
            }

            // Sort picks by position priority for team formation
            const sortedPicks = [...picks].sort((a, b) => {
                const positionPriority = {
                    'gk': 1,
                    'cb': 2,
                    'fb': 3,
                    'mid': 4,
                    'wa': 5,
                    'ca': 6
                };

                const aPos = a.position?.toLowerCase() || 'unknown';
                const bPos = b.position?.toLowerCase() || 'unknown';

                return (positionPriority[aPos] || 99) - (positionPriority[bPos] || 99);
            });

            // Track positions filled for this user
            const positionCounts = {
                gk: 0,
                cb: 0,
                fb: 0,
                mid: 0,
                wa: 0,
                ca: 0
            };

            const maxPositions = {
                gk: 1,
                cb: 2,
                fb: 2,
                mid: 2,
                wa: 2,
                ca: 2
            };

            // Process each pick for this user
            for (let i = 0; i < sortedPicks.length; i++) {
                const pick = sortedPicks[i];
                const fplPlayer = playerLookup.get(pick.playerId);

                if (!fplPlayer) {
                    console.warn(`FPL player not found for ID: ${pick.playerId}`);
                    continue;
                }

                const playerPosition = (pick.position?.toLowerCase() || 'unknown') as 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';

                // Determine team position (main squad vs sub)
                let teamPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca' | 'sub';
                let isSub = false;

                if (playerPosition in positionCounts &&
                    positionCounts[playerPosition] < maxPositions[playerPosition]) {
                    // Main squad position available
                    teamPosition = playerPosition;
                    positionCounts[playerPosition]++;
                } else {
                    // Goes to bench
                    teamPosition = 'sub';
                    isSub = true;
                }

                const teamMember: FirestoreTeamMember = {
                    userId,
                    teamPosition,
                    playerPosition: playerPosition === 'unknown' ? 'mid' : playerPosition, // fallback for unknown positions
                    player: fplPlayer.web_name,
                    playerCode: fplPlayer.code,
                    onLoanTo: null,
                    isSub
                };

                // Create document ID: divisionId_userId_playerCode
                const docId = `${divisionId}_${userId}_${fplPlayer.code}`;
                const docRef = db.collection('teams').doc(docId);

                batch.set(docRef, teamMember);
                totalMembersCommitted++;
            }
        }

        // Commit the batch
        await batch.commit();

        const message = `Teams committed to Firestore! ${totalMembersCommitted} players across ${teamsByUser.size} teams in division ${divisionId}`;

        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            data: {
                divisionId,
                teamsCount: teamsByUser.size,
                playersCount: totalMembersCommitted,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Commit teams to Firestore error:', error);
        throw new Error(`Failed to commit teams to Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
