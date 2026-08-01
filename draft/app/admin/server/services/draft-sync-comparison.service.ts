// app/admin/server/services/draft-sync-comparison.service.ts
// Service to compare draft data between Firebase and Google Sheets

import { CACHE_KEYS, getCacheTTL } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import type { DivisionId } from '../../../_shared/types/league-types';
import type { DraftSyncComparison, DraftSyncDifference, FirebaseDraftPick, FirebaseDraftState } from '../../../draft';

/**
 * Get all draft sync comparisons for all divisions
 */
export async function getAllDraftSyncComparisons(): Promise<DraftSyncComparison[]> {
    return await dataCache.get(CACHE_KEYS.DRAFT_SYNC.ALL_COMPARISONS, generateAllDraftSyncComparisons, {
        ttlMs: getCacheTTL(CACHE_KEYS.DRAFT_SYNC.ALL_COMPARISONS),
    });
}

/**
 * Generate comparison data for a specific division
 */
async function generateDraftSyncComparison(divisionId: DivisionId): Promise<DraftSyncComparison> {
    try {
        console.log(`🔍 Generating draft sync comparison for division: ${divisionId}`);

        // Import functions dynamically to prevent server code in client bundle
        const { readDraftStateByDivision, getDraftPicksByDivision } = await import('../../../_shared/lib/sheets/draft');

        // Get data from both sources in parallel
        const [sheetsState, sheetsPicks, firebaseState, firebasePicks] = await Promise.all([
            readDraftStateByDivision(divisionId),
            getDraftPicksByDivision(divisionId),
            getFirebaseDraftState(divisionId),
            getFirebaseDraftPicks(divisionId),
        ]);

        // Compare the data and find differences
        // currentPick is derived, not stored -- compare the derived value.
        const { toDraftStateForDivision } = await import('../../../draft');
        const sheetsStateWithPick = sheetsState
            ? toDraftStateForDivision([sheetsState], sheetsPicks, divisionId)
            : null;

        const differences = compareData(sheetsStateWithPick, firebaseState, sheetsPicks, firebasePicks);

        const comparison: DraftSyncComparison = {
            divisionId,
            sheetsState: sheetsStateWithPick,
            firebaseState,
            sheetsPicks,
            firebasePicks,
            differences,
            lastSyncedAt: firebaseState?.lastUpdate,
        };

        console.log(`✅ Generated comparison for ${divisionId}: ${differences.length} differences found`);
        return comparison;
    } catch (error) {
        console.error(`❌ Failed to generate draft sync comparison for ${divisionId}:`, error);
        throw new Error('Failed to generate draft sync comparison', { cause: error });
    }
}

/**
 * Generate comparison data for all divisions
 */
async function generateAllDraftSyncComparisons(): Promise<DraftSyncComparison[]> {
    try {
        // Import functions dynamically
        const { readDivisions } = await import('../../../_shared/lib/sheets/divisions');

        const divisions = await readDivisions();

        // Generate comparisons for all divisions in parallel
        const comparisons = await Promise.all(divisions.map((division) => generateDraftSyncComparison(division.id)));

        return comparisons;
    } catch (error) {
        console.error('❌ Failed to generate all draft sync comparisons:', error);
        throw new Error('Failed to generate all comparisons', { cause: error });
    }
}

/**
 * Get Firebase draft state for a division
 */
async function getFirebaseDraftState(divisionId: DivisionId): Promise<FirebaseDraftState | null> {
    try {
        const { FirebaseDraftSync } = await import('../../../draft/index.server');
        return await FirebaseDraftSync.getDraftState(divisionId);
    } catch (error) {
        console.error(`❌ Failed to get Firebase draft state for ${divisionId}:`, error);
        return null;
    }
}

/**
 * Get Firebase draft picks for a division
 */
async function getFirebaseDraftPicks(divisionId: DivisionId): Promise<FirebaseDraftPick[]> {
    try {
        const { getRealtimeAdminDbInstance } = await import(
            '../../../_shared/lib/firestore-cache/firebase.realtime-admin'
        );

        const adminDatabase = getRealtimeAdminDbInstance();
        const picksRef = adminDatabase.ref(`drafts/${divisionId}/picks`);
        const snapshot = await picksRef.once('value');

        if (!snapshot.exists()) {
            return [];
        }

        const picksData = snapshot.val();
        return Object.values(picksData) as FirebaseDraftPick[];
    } catch (error) {
        console.error(`❌ Failed to get Firebase draft picks for ${divisionId}:`, error);
        return [];
    }
}

/**
 * Compare data between sheets and Firebase to find differences
 */
function compareData(
    sheetsState: any,
    firebaseState: FirebaseDraftState | null,
    sheetsPicks: any[],
    firebasePicks: FirebaseDraftPick[],
): DraftSyncDifference[] {
    const differences: DraftSyncDifference[] = [];

    // Compare draft state
    if (sheetsState && firebaseState) {
        // Compare current pick (now calculated in sheets)
        if (sheetsState.currentPick !== firebaseState.currentPick) {
            differences.push({
                type: 'state',
                field: 'currentPick',
                sheetsValue: sheetsState.currentPick,
                firebaseValue: firebaseState.currentPick,
                severity: 'high',
                description: `Current pick mismatch: Calculated=${sheetsState.currentPick}, Firebase=${firebaseState.currentPick}`,
            });
        }

        // Compare current user
        if (sheetsState.currentUserId !== firebaseState.currentUserId) {
            differences.push({
                type: 'state',
                field: 'currentUserId',
                sheetsValue: sheetsState.currentUserId,
                firebaseValue: firebaseState.currentUserId,
                severity: 'high',
                description: `Current user mismatch: Sheets=${sheetsState.currentUserId}, Firebase=${firebaseState.currentUserId}`,
            });
        }

        // Compare active status
        if (sheetsState.isActive !== firebaseState.isActive) {
            differences.push({
                type: 'state',
                field: 'isActive',
                sheetsValue: sheetsState.isActive,
                firebaseValue: firebaseState.isActive,
                severity: 'medium',
                description: `Active status mismatch: Sheets=${sheetsState.isActive}, Firebase=${firebaseState.isActive}`,
            });
        }
    } else if (sheetsState && !firebaseState) {
        differences.push({
            type: 'state',
            severity: 'high',
            description: 'Draft state exists in Sheets but not in Firebase',
        });
    } else if (!sheetsState && firebaseState) {
        differences.push({
            type: 'state',
            severity: 'medium',
            description: 'Draft state exists in Firebase but not in Sheets',
        });
    }

    // Compare picks count
    if (sheetsPicks.length !== firebasePicks.length) {
        differences.push({
            type: 'pick',
            field: 'count',
            sheetsValue: sheetsPicks.length,
            firebaseValue: firebasePicks.length,
            severity: 'high',
            description: `Pick count mismatch: Sheets=${sheetsPicks.length}, Firebase=${firebasePicks.length}`,
        });
    }

    // Compare individual picks
    const maxPicks = Math.max(sheetsPicks.length, firebasePicks.length);
    for (let i = 0; i < maxPicks; i++) {
        const sheetsPick = sheetsPicks[i];
        if (!firebasePicks?.find) {
            throw new Error('draft sync comparison service "firebasePicks?.find" error');
        }
        const firebasePick = firebasePicks?.find((pick) => pick.pickNumber === i + 1);

        if (sheetsPick && !firebasePick) {
            differences.push({
                type: 'missing-pick',
                pickNumber: sheetsPick.pickNumber,
                sheetsValue: sheetsPick,
                severity: 'medium',
                description: `Pick ${sheetsPick.pickNumber} exists in Sheets but missing in Firebase`,
            });
        } else if (!sheetsPick && firebasePick) {
            differences.push({
                type: 'extra-pick',
                pickNumber: firebasePick.pickNumber,
                firebaseValue: firebasePick,
                severity: 'medium',
                description: `Pick ${firebasePick.pickNumber} exists in Firebase but missing in Sheets`,
            });
        } else if (sheetsPick && firebasePick) {
            // Compare pick details
            if (sheetsPick.playerId !== firebasePick.playerId) {
                differences.push({
                    type: 'pick',
                    field: 'playerId',
                    pickNumber: sheetsPick.pickNumber,
                    sheetsValue: sheetsPick.playerId,
                    firebaseValue: firebasePick.playerId,
                    severity: 'high',
                    description: `Pick ${sheetsPick.pickNumber} player mismatch: Sheets=${sheetsPick.playerId}, Firebase=${firebasePick.playerId}`,
                });
            }

            if (sheetsPick.userId !== firebasePick.userId) {
                differences.push({
                    type: 'pick',
                    field: 'userId',
                    pickNumber: sheetsPick.pickNumber,
                    sheetsValue: sheetsPick.userId,
                    firebaseValue: firebasePick.userId,
                    severity: 'high',
                    description: `Pick ${sheetsPick.pickNumber} user mismatch: Sheets=${sheetsPick.userId}, Firebase=${firebasePick.userId}`,
                });
            }
        }
    }

    return differences;
}
