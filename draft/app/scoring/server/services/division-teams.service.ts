// app/scoring/server/services/division-teams.service.ts

import { getFirestoreInstance } from '../../../_shared/lib/firestore-cache/firebase.admin';
import type { DivisionId, DivisionTeamsDocument, ManagerId } from '../../../teams/types/team-types';
import { GameweekPointsService } from './gameweek-points.service';

/**
 * Get division teams document for specific gameweek
 */
export async function getDivisionTeamsDocument(
    divisionId: DivisionId,
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
export async function getTeamsForGameweek(divisionId: DivisionId, userId: ManagerId, gameweek: number) {
    try {
        const divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);
        if (!divisionDoc || !divisionDoc.teams[userId]) {
            return null;
        }

        return {
            gameweek,
            roster: divisionDoc.teams[userId].roster,
            divisionDoc: divisionDoc,
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
 * Check if division teams document exists for gameweek
 */
export async function divisionDocumentExists(divisionId: DivisionId, gameweek: number): Promise<boolean> {
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
    divisionId: DivisionId,
    gameweek: number,
    updates: Partial<DivisionTeamsDocument>,
): Promise<void> {
    try {
        const db = getFirestoreInstance();
        const docId = `${divisionId}_gw${gameweek}`;
        const docRef = db.collection('division-teams').doc(docId);
        await docRef.update(updates);

        // Update metadata
        const ps = new GameweekPointsService();
        await ps.updatePointsMetadata({
            lastGeneratedGameweek: gameweek,
            lastGeneratedAt: new Date().toISOString(),
            currentGameweek: gameweek,
            generationHistory: [
                {
                    gameweek: gameweek,
                    generatedAt: new Date().toISOString(),
                    playerCount: 0,
                    type: 'selective',
                },
            ],
        });

        console.log(`✅ Updated division teams document: ${docId}`);
    } catch (error) {
        console.error('Update division teams document error:', error);
        throw new Error(
            `Failed to update division teams document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
