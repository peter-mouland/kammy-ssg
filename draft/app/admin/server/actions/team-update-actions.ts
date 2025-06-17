/* Location: app/admin/server/actions/team-update-actions.ts */

// /admin/server/actions/team-update-actions.ts
import { getFirestoreInstance } from "../../../_shared/lib/firestore-cache/firebase.admin";
import type { DraftActionParams, ActionResult } from "../../types";

interface UpdateTeamsParams extends DraftActionParams {
    gameweek: number;
    userId?: string; // Optional: update specific user only
}

interface PlayerLoanUpdate {
    userId: string;
    playerCode: number;
    onLoanTo: string | null;
    onLoanStart: string | null; // ISO date string
}

/**
 * Update teams for a new gameweek (preserves all data, just updates gameweek)
 */
export async function handleUpdateTeamsGameweek(params: UpdateTeamsParams): Promise<ActionResult> {
    const { divisionId, gameweek } = params;

    if (!divisionId || gameweek === undefined) {
        throw new Error("Division ID and gameweek are required");
    }

    try {
        console.log(`🔄 Updating teams to gameweek ${gameweek} for division: ${divisionId}`);

        const db = getFirestoreInstance();
        const docRef = db.collection('division-teams').doc(divisionId);

        // Get current document
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error(`No teams found for division ${divisionId}`);
        }

        const currentData = doc.data();
        const now = new Date().toISOString();

        // Update gameweek for all players
        const updatedTeams: Record<string, any[]> = {};
        let totalPlayersUpdated = 0;

        for (const [userId, players] of Object.entries(currentData.teams)) {
            updatedTeams[userId] = (players as any[]).map(player => ({
                ...player,
                gameweek
            }));
            totalPlayersUpdated += updatedTeams[userId].length;
        }

        // Update the document
        await docRef.update({
            gameweek,
            lastUpdated: now,
            teams: updatedTeams,
            'metadata.updatedAt': now
        });

        const message = `Teams updated to gameweek ${gameweek}! ${totalPlayersUpdated} players across ${Object.keys(updatedTeams).length} teams in division ${divisionId}`;

        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            data: {
                divisionId,
                gameweek,
                teamsCount: Object.keys(updatedTeams).length,
                playersCount: totalPlayersUpdated,
                timestamp: now
            }
        };

    } catch (error) {
        console.error('Update teams gameweek error:', error);
        throw new Error(`Failed to update teams gameweek: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Handle player loans (set onLoanTo and onLoanStart)
 */
export async function handlePlayerLoans(
    divisionId: string,
    loanUpdates: PlayerLoanUpdate[]
): Promise<ActionResult> {
    if (!divisionId || !loanUpdates.length) {
        throw new Error("Division ID and loan updates are required");
    }

    try {
        console.log(`🔄 Processing ${loanUpdates.length} loan updates for division: ${divisionId}`);

        const db = getFirestoreInstance();
        const docRef = db.collection('division-teams').doc(divisionId);

        // Get current document
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error(`No teams found for division ${divisionId}`);
        }

        const currentData = doc.data();
        const now = new Date().toISOString();

        // Apply loan updates
        const updatedTeams: Record<string, any[]> = {};
        let loansProcessed = 0;

        for (const [userId, players] of Object.entries(currentData.teams)) {
            updatedTeams[userId] = (players as any[]).map(player => {
                // Find if this player has a loan update
                const loanUpdate = loanUpdates.find(
                    update => update.userId === userId && update.playerCode === player.playerCode
                );

                if (loanUpdate) {
                    loansProcessed++;
                    return {
                        ...player,
                        onLoanTo: loanUpdate.onLoanTo,
                        onLoanStart: loanUpdate.onLoanStart
                    };
                }

                return player;
            });
        }

        // Update the document
        await docRef.update({
            lastUpdated: now,
            teams: updatedTeams,
            'metadata.updatedAt': now
        });

        const message = `Loan updates processed! ${loansProcessed} players updated in division ${divisionId}`;

        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            data: {
                divisionId,
                loansProcessed,
                timestamp: now
            }
        };

    } catch (error) {
        console.error('Process player loans error:', error);
        throw new Error(`Failed to process player loans: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get teams for a division (utility function)
 */
export async function getTeamsForDivision(divisionId: string) {
    try {
        const db = getFirestoreInstance();
        const docRef = db.collection('division-teams').doc(divisionId);

        const doc = await docRef.get();
        if (!doc.exists) {
            return null;
        }

        return doc.data();
    } catch (error) {
        console.error('Get teams for division error:', error);
        throw new Error(`Failed to get teams for division: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
