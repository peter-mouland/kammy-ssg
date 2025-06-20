// app/_shared/services/division-teams.service.ts

import type { DivisionTeamsDocument, TeamGameweekData, UserTeamRoster } from '../../teams/types/team-types';
import { getFirestoreInstance } from '../lib/firestore-cache/firebase.admin';

/**
 * Get division teams document for specific gameweek
 */
export async function getDivisionTeamsDocument(
    divisionId: string,
    gameweek: number,
): Promise<DivisionTeamsDocument | null> {
    try {
        const db = getFirestoreInstance();
        const docId = `${divisionId}_gw${gameweek}`;
        const docRef = db.collection('division-teams').doc(docId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return null;
        }

        return doc.data() as DivisionTeamsDocument;
    } catch (error) {
        console.error('Get division teams document error:', error);
        throw new Error(
            `Failed to get division teams for ${divisionId} GW${gameweek}: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

/**
 * Get user's team data for specific gameweek
 */
export async function getUserTeamForGameweek(
    divisionId: string,
    userId: string,
    gameweek: number,
): Promise<TeamGameweekData | null> {
    try {
        const divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);
        if (!divisionDoc || !divisionDoc.teams[userId]) {
            return null;
        }

        return {
            gameweek,
            roster: divisionDoc.teams[userId].roster,
            lastUpdated: divisionDoc.lastUpdated,
        };
    } catch (error) {
        console.error('Get user team for gameweek error:', error);
        throw new Error(
            `Failed to get user team for ${userId} in ${divisionId} GW${gameweek}: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

/**
 * Get user's team history across multiple gameweeks
 */
export async function getUserTeamHistory(
    divisionId: string,
    userId: string,
    startGameweek: number = 0,
    endGameweek?: number,
): Promise<TeamGameweekData[]> {
    try {
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');

        // If no end gameweek specified, get current gameweek
        const finalGameweek = endGameweek ?? (await fplApiCache.getCurrentGameweek());

        // Get documents for each gameweek
        const promises: Promise<TeamGameweekData | null>[] = [];
        for (let gw = startGameweek; gw <= finalGameweek; gw++) {
            promises.push(getUserTeamForGameweek(divisionId, userId, gw));
        }

        const results = await Promise.all(promises);

        // Filter out null results and sort by gameweek
        return results
            .filter((team): team is TeamGameweekData => team !== null)
            .sort((a, b) => a.gameweek - b.gameweek);
    } catch (error) {
        console.error('Get user team history error:', error);
        throw new Error(
            `Failed to get team history for ${userId} in ${divisionId}: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

/**
 * Get all teams in division for specific gameweek
 */
export async function getAllTeamsInDivision(divisionId: string, gameweek: number): Promise<UserTeamRoster[]> {
    try {
        const divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);
        if (!divisionDoc) {
            return [];
        }

        return Object.entries(divisionDoc.teams).map(([userId, teamData]) => ({
            userId,
            roster: teamData.roster,
        }));
    } catch (error) {
        console.error('Get all teams in division error:', error);
        throw new Error(
            `Failed to get all teams for ${divisionId} GW${gameweek}: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

/**
 * Check if division teams document exists for gameweek
 */
export async function divisionDocumentExists(divisionId: string, gameweek: number): Promise<boolean> {
    try {
        const db = getFirestoreInstance();
        const docId = `${divisionId}_gw${gameweek}`;
        const docRef = db.collection('division-teams').doc(docId);

        const doc = await docRef.get();
        return doc.exists;
    } catch (error) {
        console.error('Check division document exists error:', error);
        return false;
    }
}

/**
 * Get available gameweeks for division
 */
export async function getAvailableGameweeks(divisionId: string): Promise<number[]> {
    try {
        const db = getFirestoreInstance();
        const collectionRef = db.collection('division-teams');

        // Query for all documents that start with divisionId
        const query = collectionRef.where('divisionId', '==', divisionId).orderBy('gameweek', 'asc');

        const snapshot = await query.get();

        const gameweeks: number[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data() as DivisionTeamsDocument;
            gameweeks.push(data.gameweek);
        });

        return gameweeks;
    } catch (error) {
        console.error('Get available gameweeks error:', error);
        throw new Error(
            `Failed to get available gameweeks for ${divisionId}: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

/**
 * Create new division teams document
 */
export async function createDivisionTeamsDocument(document: DivisionTeamsDocument): Promise<void> {
    try {
        const db = getFirestoreInstance();
        const docId = `${document.divisionId}_gw${document.gameweek}`;
        const docRef = db.collection('division-teams').doc(docId);

        await docRef.set(document);

        console.log(`✅ Created division teams document: ${docId}`);
    } catch (error) {
        console.error('Create division teams document error:', error);
        throw new Error(
            `Failed to create division teams document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

/**
 * Update division teams document
 */
export async function updateDivisionTeamsDocument(
    divisionId: string,
    gameweek: number,
    updates: Partial<DivisionTeamsDocument>,
): Promise<void> {
    try {
        const db = getFirestoreInstance();
        const docId = `${divisionId}_gw${gameweek}`;
        const docRef = db.collection('division-teams').doc(docId);

        const updateData = {
            ...updates,
            'metadata.updatedAt': new Date().toISOString(),
        };

        await docRef.update(updateData);

        console.log(`✅ Updated division teams document: ${docId}`);
    } catch (error) {
        console.error('Update division teams document error:', error);
        throw new Error(
            `Failed to update division teams document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

/**
 * Delete division teams document
 */
export async function deleteDivisionTeamsDocument(divisionId: string, gameweek: number): Promise<void> {
    try {
        const db = getFirestoreInstance();
        const docId = `${divisionId}_gw${gameweek}`;
        const docRef = db.collection('division-teams').doc(docId);

        await docRef.delete();

        console.log(`✅ Deleted division teams document: ${docId}`);
    } catch (error) {
        console.error('Delete division teams document error:', error);
        throw new Error(
            `Failed to delete division teams document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
