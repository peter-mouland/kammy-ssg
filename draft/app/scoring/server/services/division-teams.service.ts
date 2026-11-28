// app/scoring/server/services/division-teams.service.ts

import { getFirestoreInstance } from '../../../_shared/lib/firestore-cache/firebase.admin';
import type { DivisionId, ManagerId } from '../../../_shared/types/league-types';
import type { DivisionTeamsDocument } from '../../../teams';
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
        throw new Error(`Failed to get division teams for ${divisionId} GW${gameweek}`, { cause: error });
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
        throw new Error(`Failed to get user team for ${userId} in ${divisionId} GW${gameweek}`, { cause: error });
    }
}

/**
 * The latest scored gameweek for a division at or before `fromGameweek`: the
 * newest gameweek whose division-teams document exists and has teams in it.
 *
 * Scoring owns this because scoring owns the documents. The leagues default
 * view and the cup squad picker both need it, and they must agree on what
 * "processed" means (a document with no teams is not processed). See
 * "Gameweeks, one vocabulary" in architecture.md.
 */
export async function getLatestScoredGameweek(divisionId: DivisionId, fromGameweek: number): Promise<number | null> {
    try {
        for (let candidate = fromGameweek; candidate >= 1; candidate--) {
            const divisionDoc = await getDivisionTeamsDocument(divisionId, candidate);
            if (divisionDoc && Object.keys(divisionDoc.teams ?? {}).length > 0) return candidate;
        }
    } catch (error) {
        console.error(`Failed to find scored gameweeks for ${divisionId} up to GW${fromGameweek}:`, error);
    }
    return null;
}

/**
 * A manager's most recent squad at or before a gameweek.
 *
 * Squads are picked before a deadline, but that gameweek's document is only
 * created once the gameweek is processed. Asking for the gameweek itself in
 * that window finds nothing, and a picker built on it has nobody to pick. This
 * starts from the division's latest scored gameweek and walks back only if
 * this manager is missing from it; the returned `gameweek` says which week
 * the squad actually came from.
 */
export async function getLatestTeamsForGameweek(divisionId: DivisionId, userId: ManagerId, gameweek: number) {
    const latestScored = await getLatestScoredGameweek(divisionId, gameweek);
    if (latestScored !== null) {
        const team = await getTeamsForGameweek(divisionId, userId, latestScored);
        if (team) return team;
    }
    const walkFrom = latestScored === null ? gameweek : latestScored - 1;
    for (let candidate = walkFrom; candidate >= 1; candidate--) {
        const team = await getTeamsForGameweek(divisionId, userId, candidate);
        if (team) return team;
    }
    return null;
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
        throw new Error('Failed to create division teams document', { cause: error });
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
        throw new Error('Failed to update division teams document', { cause: error });
    }
}
