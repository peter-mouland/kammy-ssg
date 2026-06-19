/* Location: app/_shared/lib/firestore-cache/firebase-draft-sync.ts */
// biome-ignore-all lint/complexity/noStaticOnlyClass: class pattern used for Firebase service grouping

import type { DivisionId } from '../../../teams/types/team-types';
// /_shared/lib/firestore-cache/firebase-draft-sync.ts - ENHANCED WITH RESET CAPABILITY
import { getRealtimeAdminDbInstance } from './firebase.realtime-admin';

interface DraftEvent {
    type: 'pick-made' | 'turn-change' | 'draft-started' | 'draft-ended' | 'draft-synced' | 'draft-reset';
    data: any;
    timestamp: number;
    divisionId: string;
    userId?: string;
}

interface DraftState {
    currentPick: number;
    currentUserId: string;
    isActive: boolean;
    lastUpdate: number;
    totalPicks?: number;
    syncedFromSheets?: boolean;
}

const adminDatabase = getRealtimeAdminDbInstance();

export class FirebaseDraftSync {
    // Cache to prevent redundant writes
    private static stateCache = new Map<string, string>();

    // Update draft state (with deduplication)
    static async updateDraftState(divisionId: string, state: Partial<DraftState>) {
        try {
            const path = `drafts/${divisionId}/state`;

            // Create the update data (without lastUpdate for comparison)
            const updateDataWithoutTimestamp = { ...state };
            const cacheKey = `${divisionId}_state`;
            const currentDataHash = JSON.stringify(updateDataWithoutTimestamp);

            // Check if this is the same data we just wrote
            const cachedHash = FirebaseDraftSync.stateCache.get(cacheKey);
            if (cachedHash === currentDataHash) {
                console.log('🔥 SERVER: ⏭️ Skipping redundant write - data unchanged');
                return true;
            }

            // Get current state to compare
            const currentState = await FirebaseDraftSync.getDraftState(divisionId);
            if (currentState) {
                // Compare relevant fields (excluding lastUpdate)
                const currentStateForComparison = {
                    currentPick: currentState.currentPick,
                    currentUserId: currentState.currentUserId,
                    isActive: currentState.isActive,
                    totalPicks: currentState.totalPicks,
                };

                const newStateForComparison = {
                    currentPick: state.currentPick ?? currentState.currentPick,
                    currentUserId: state.currentUserId ?? currentState.currentUserId,
                    isActive: state.isActive ?? currentState.isActive,
                    totalPicks: state.totalPicks ?? currentState.totalPicks,
                };

                if (JSON.stringify(currentStateForComparison) === JSON.stringify(newStateForComparison)) {
                    console.log('🔥 SERVER: ⏭️ Skipping redundant write - state unchanged in Firebase');
                    return true;
                }
            }

            // Add timestamp and update
            const updateData = {
                ...state,
                lastUpdate: Date.now(),
            };

            const stateRef = adminDatabase.ref(path);
            await stateRef.update(updateData);

            // Cache this data to prevent future redundant writes
            FirebaseDraftSync.stateCache.set(cacheKey, currentDataHash);

            console.log('🔥 SERVER: ✅ Draft state updated:', updateData);
            return true;
        } catch (error) {
            console.error('🔥 SERVER: ❌ Failed to update draft state:', error);
            return false;
        }
    }

    // Get current draft state
    static async getDraftState(divisionId: string): Promise<DraftState | null> {
        try {
            const stateRef = adminDatabase.ref(`drafts/${divisionId}/state`);
            const snapshot = await stateRef.once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('🔥 SERVER: ❌ Failed to get draft state:', error);
            return null;
        }
    }

    // Update a specific draft pick
    static async updateDraftPick(divisionId: string, pickNumber: number, pickData: any) {
        try {
            const pickRef = adminDatabase.ref(`drafts/${divisionId}/picks/${pickNumber}`);
            await pickRef.set(pickData);
            console.log(`🔥 SERVER: ✅ Pick ${pickNumber} updated`);
            return true;
        } catch (error) {
            console.error('🔥 SERVER: ❌ Failed to update pick:', error);
            return false;
        }
    }

    // Remove picks that no longer exist in sheets
    static async removeOrphanedPicks(divisionId: string, validPickNumbers: number[]) {
        try {
            const picksRef = adminDatabase.ref(`drafts/${divisionId}/picks`);
            const snapshot = await picksRef.once('value');

            if (!snapshot.exists()) {
                return true;
            }

            const existingPicks = snapshot.val();
            const existingPickNumbers = Object.keys(existingPicks).map(Number);
            const orphanedPickNumbers = existingPickNumbers.filter((pickNum) => !validPickNumbers.includes(pickNum));

            if (orphanedPickNumbers.length > 0) {
                console.log(
                    `🔥 SERVER: 🧹 Removing ${orphanedPickNumbers.length} orphaned picks:`,
                    orphanedPickNumbers,
                );

                // Remove each orphaned pick
                for (const pickNum of orphanedPickNumbers) {
                    const pickRef = adminDatabase.ref(`drafts/${divisionId}/picks/${pickNum}`);
                    await pickRef.remove();
                }

                console.log('🔥 SERVER: ✅ Orphaned picks removed');
            }

            return true;
        } catch (error) {
            console.error('🔥 SERVER: ❌ Failed to remove orphaned picks:', error);
            return false;
        }
    }

    // Clear all events (fresh start for sync)
    static async clearAllEvents(divisionId: string) {
        try {
            const eventsRef = adminDatabase.ref(`drafts/${divisionId}/events`);
            await eventsRef.remove();
            console.log(`🔥 SERVER: ✅ All events cleared for division ${divisionId}`);
            return true;
        } catch (error) {
            console.error('🔥 SERVER: ❌ Failed to clear events:', error);
            return false;
        }
    }

    // Add draft event (with deduplication)
    static async addDraftEvent(divisionId: string, event: Omit<DraftEvent, 'timestamp' | 'divisionId'>) {
        try {
            const now = Date.now();
            const cacheKey = `${divisionId}_${event.type}_${JSON.stringify(event.data).slice(0, 50)}`;

            // Prevent duplicate events within 1 second
            const lastEventTime = FirebaseDraftSync.stateCache.get(cacheKey);
            if (lastEventTime && now - Number.parseInt(lastEventTime) < 1000) {
                console.log('🔥 SERVER: ⏭️ Skipping duplicate event within 1s window');
                return null;
            }

            const eventsRef = adminDatabase.ref(`drafts/${divisionId}/events`);
            const eventData: DraftEvent = {
                ...event,
                divisionId,
                timestamp: now,
            };

            const newEventRef = eventsRef.push();
            await newEventRef.set(eventData);

            // Cache this event to prevent duplicates
            FirebaseDraftSync.stateCache.set(cacheKey, now.toString());

            console.log('🔥 SERVER: ✅ Event added:', event.type);
            return newEventRef.key;
        } catch (error) {
            console.error('🔥 SERVER: ❌ Failed to add event:', error);
            return null;
        }
    }

    // Broadcast draft event - EXISTING METHOD
    static async broadcastDraftEvent(divisionId: string, event: Omit<DraftEvent, 'timestamp' | 'divisionId'>) {
        try {
            console.log(`🔥 Broadcasting draft event: ${event.type} for division ${divisionId}`);

            const eventKey = await FirebaseDraftSync.addDraftEvent(divisionId, event);

            if (eventKey) {
                console.log(`🔥 ✅ Draft event broadcast successful: ${event.type}`);
                return eventKey;
            } else {
                console.log(`🔥 ⏭️ Draft event skipped (duplicate): ${event.type}`);
                return null;
            }
        } catch (error) {
            console.error('🔥 ❌ Error broadcasting draft event:', error);
            return null;
        }
    }

    // Broadcast pick made - EXISTING METHOD
    static async broadcastPickMade(divisionId: string, pick: any, nextState: Partial<DraftState>) {
        try {
            console.log(`🔥 Broadcasting pick made: ${pick.playerName} by ${pick.userId}`);

            // Update the pick in Firebase
            await FirebaseDraftSync.updateDraftPick(divisionId, pick.pickNumber, {
                pickNumber: pick.pickNumber,
                round: pick.round,
                userId: pick.userId,
                playerId: pick.playerId,
                playerCode: pick.playerCode,
                playerName: pick.playerName,
                teamCode: pick.teamCode,
                teamName: pick.teamName,
                position: pick.position,
                pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt,
                divisionId: pick.divisionId,
                timestamp: Date.now(),
            });

            // Update draft state (will be deduplicated if unchanged)
            await FirebaseDraftSync.updateDraftState(divisionId, nextState);

            // Add pick-made event (will be deduplicated if duplicate)
            await FirebaseDraftSync.addDraftEvent(divisionId, {
                type: 'pick-made',
                data: {
                    pick: {
                        ...pick,
                        pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt,
                    },
                    nextTurn: {
                        currentPick: nextState.currentPick,
                        currentUserId: nextState.currentUserId,
                        isActive: nextState.isActive,
                    },
                },
                userId: pick.userId,
            });

            // Clean up old events periodically (every 10 picks)
            if (pick.pickNumber % 10 === 0) {
                await FirebaseDraftSync.cleanupOldEvents(divisionId);
            }

            console.log(`🔥 ✅ Pick broadcast successful: ${pick.playerName}`);
            return true;
        } catch (error) {
            console.error('🔥 ❌ Error broadcasting pick:', error);
            return false;
        }
    }

    // Clean up old events to prevent Firebase bloat
    static async cleanupOldEvents(divisionId: string) {
        try {
            const eventsRef = adminDatabase.ref(`drafts/${divisionId}/events`);
            const snapshot = await eventsRef.orderByKey().limitToFirst(1000).once('value');

            if (snapshot.exists()) {
                const events = snapshot.val();
                const eventKeys = Object.keys(events);

                // Keep only the last 50 events
                if (eventKeys.length > 50) {
                    const eventsToDelete = eventKeys.slice(0, eventKeys.length - 50);

                    for (const eventKey of eventsToDelete) {
                        const deleteRef = adminDatabase.ref(`drafts/${divisionId}/events/${eventKey}`);
                        await deleteRef.remove();
                    }

                    console.log(`🔥 Cleaned up ${eventsToDelete.length} old events for division ${divisionId}`);
                }
            }

            return true;
        } catch (error) {
            console.error('🔥 Error cleaning up events:', error);
            return false;
        }
    }

    // Clear cache for debugging
    static clearCache(divisionId?: string) {
        if (divisionId) {
            const keysToDelete = Array.from(FirebaseDraftSync.stateCache.keys()).filter((key) =>
                key.startsWith(divisionId),
            );
            keysToDelete.forEach((key) => FirebaseDraftSync.stateCache.delete(key));
            console.log(`🔥 Cleared cache for division ${divisionId}`);
        } else {
            FirebaseDraftSync.stateCache.clear();
            console.log('🔥 Cleared all Firebase sync cache');
        }
    }

    /**
     * Sync draft from Google Sheets to Firebase for a specific division
     * UPDATED: Now uses calculated currentPick from the new sheets approach
     */
    static async syncDraftFromSheets(divisionId: DivisionId, forceReset = false) {
        console.log(`🔥 SERVER: ${forceReset ? 'RESET' : 'SYNC'} starting for division ${divisionId}`);

        try {
            // Import sheets functions dynamically
            const { readDraftStateByDivision } = await import('../../lib/sheets/draft');
            const { getDraftPicksByDivision } = await import('../../lib/sheets/draft');
            const { getDraftOrderByDivision } = await import('../../lib/sheets/draft-order');

            // Get data from sheets (source of truth)
            const [draftState, draftPicks, draftOrder] = await Promise.all([
                readDraftStateByDivision(divisionId),
                getDraftPicksByDivision(divisionId),
                getDraftOrderByDivision(divisionId),
            ]);

            if (!draftState) {
                throw new Error(`No draft state found in sheets for division ${divisionId}`);
            }

            if (draftOrder.length === 0) {
                throw new Error(`No draft order found for division ${divisionId}`);
            }

            // Use the currentPick from draftState (now calculated in sheets)
            const currentPick = draftState.currentPick; // This is now calculated!
            const currentUserId = draftState.currentUserId;
            const isActive = draftState.isActive;
            const picksCount = draftPicks.length;
            const totalTeams = draftOrder.length;
            const totalPossiblePicks = totalTeams * draftState.picksPerTeam;

            console.log(`🔥 SERVER: Division ${divisionId} state from sheets:`, {
                picksCount,
                currentPick, // Now calculated in sheets
                currentUserId,
                isActive,
                totalPossiblePicks,
            });

            // Clear existing Firebase data if force reset
            if (forceReset) {
                console.log(`🔥 SERVER: 🧹 Force resetting Firebase data for division ${divisionId}`);
                const picksRef = adminDatabase.ref(`drafts/${divisionId}/picks`);
                await picksRef.remove();
            } else {
                // Remove orphaned picks that don't exist in sheets
                const validPickNumbers = draftPicks.map((pick) => pick.pickNumber);
                await FirebaseDraftSync.removeOrphanedPicks(divisionId, validPickNumbers);
            }

            // Update Firebase with the state from sheets (currentPick is now calculated)
            const firebaseState: DraftState = {
                currentPick, // Use calculated value from sheets
                currentUserId,
                isActive,
                totalPicks: totalPossiblePicks,
                lastUpdate: Date.now(),
                syncedFromSheets: true,
            };

            await FirebaseDraftSync.updateDraftState(divisionId, firebaseState);

            // Sync all picks from sheets to Firebase
            console.log(
                `🔥 SERVER: Syncing ${draftPicks.length} picks from sheets to Firebase for division ${divisionId}`,
            );
            for (const pick of draftPicks) {
                await FirebaseDraftSync.updateDraftPick(divisionId, pick.pickNumber, {
                    pickNumber: pick.pickNumber,
                    round: pick.round,
                    userId: pick.userId,
                    playerId: pick.playerId,
                    playerCode: pick.playerCode,
                    playerName: pick.playerName,
                    teamCode: pick.teamCode,
                    teamName: pick.teamName,
                    position: pick.position,
                    pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt,
                    divisionId: pick.divisionId,
                    timestamp: Date.now(),
                });
            }

            // Add sync event to notify clients
            await FirebaseDraftSync.addDraftEvent(divisionId, {
                type: forceReset ? 'draft-reset' : 'draft-synced',
                data: {
                    message: forceReset
                        ? `Draft completely reset and synced from Google Sheets for division ${divisionId}`
                        : `Draft synced from Google Sheets for division ${divisionId}`,
                    picksCount,
                    currentPick, // Now calculated value
                    currentUserId,
                    isActive,
                    totalPossiblePicks,
                    forceReset,
                    timestamp: new Date().toISOString(),
                },
            });

            console.log(`🔥 ✅ Draft ${forceReset ? 'reset and' : ''} synced for division ${divisionId}`);

            return {
                success: true,
                divisionId,
                picksCount,
                currentPick, // Calculated value
                currentUserId,
                isActive,
                totalPossiblePicks,
                forceReset,
            };
        } catch (error) {
            console.error(`🔥 ❌ Failed to sync draft for division ${divisionId}:`, error);

            // Add error event
            await FirebaseDraftSync.addDraftEvent(divisionId, {
                type: 'draft-synced',
                data: {
                    error: true,
                    message: `Failed to sync draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    timestamp: new Date().toISOString(),
                },
            });

            throw error;
        }
    }
}
