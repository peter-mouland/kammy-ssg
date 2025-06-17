/* Location: app/_shared/lib/firestore-cache/firebase-draft-sync.ts */

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

const adminDatabase = getRealtimeAdminDbInstance()

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
            const cachedHash = this.stateCache.get(cacheKey);
            if (cachedHash === currentDataHash) {
                console.log('🔥 SERVER: ⏭️ Skipping redundant write - data unchanged');
                return true;
            }

            // Get current state to compare
            const currentState = await this.getDraftState(divisionId);
            if (currentState) {
                // Compare relevant fields (excluding lastUpdate)
                const currentStateForComparison = {
                    currentPick: currentState.currentPick,
                    currentUserId: currentState.currentUserId,
                    isActive: currentState.isActive,
                    totalPicks: currentState.totalPicks
                };

                const newStateForComparison = {
                    currentPick: state.currentPick ?? currentState.currentPick,
                    currentUserId: state.currentUserId ?? currentState.currentUserId,
                    isActive: state.isActive ?? currentState.isActive,
                    totalPicks: state.totalPicks ?? currentState.totalPicks
                };

                if (JSON.stringify(currentStateForComparison) === JSON.stringify(newStateForComparison)) {
                    console.log('🔥 SERVER: ⏭️ Skipping redundant write - state unchanged in Firebase');
                    return true;
                }
            }

            // Add timestamp and update
            const updateData = {
                ...state,
                lastUpdate: Date.now()
            };

            const stateRef = adminDatabase.ref(path);
            await stateRef.update(updateData);

            // Cache this data to prevent future redundant writes
            this.stateCache.set(cacheKey, currentDataHash);

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
            const orphanedPickNumbers = existingPickNumbers.filter(pickNum => !validPickNumbers.includes(pickNum));

            if (orphanedPickNumbers.length > 0) {
                console.log(`🔥 SERVER: 🧹 Removing ${orphanedPickNumbers.length} orphaned picks:`, orphanedPickNumbers);

                // Remove each orphaned pick
                for (const pickNum of orphanedPickNumbers) {
                    const pickRef = adminDatabase.ref(`drafts/${divisionId}/picks/${pickNum}`);
                    await pickRef.remove();
                }

                console.log(`🔥 SERVER: ✅ Orphaned picks removed`);
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
            const lastEventTime = this.stateCache.get(cacheKey);
            if (lastEventTime && (now - parseInt(lastEventTime)) < 1000) {
                console.log('🔥 SERVER: ⏭️ Skipping duplicate event within 1s window');
                return null;
            }

            const eventsRef = adminDatabase.ref(`drafts/${divisionId}/events`);
            const eventData: DraftEvent = {
                ...event,
                divisionId,
                timestamp: now
            };

            const newEventRef = eventsRef.push();
            await newEventRef.set(eventData);

            // Cache this event to prevent duplicates
            this.stateCache.set(cacheKey, now.toString());

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

            const eventKey = await this.addDraftEvent(divisionId, event);

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
            await this.updateDraftPick(divisionId, pick.pickNumber, {
                pickNumber: pick.pickNumber,
                round: pick.round,
                userId: pick.userId,
                playerId: pick.playerId,
                playerName: pick.playerName,
                teamCode: pick.teamCode,
                teamName: pick.teamName,
                position: pick.position,
                pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt,
                divisionId: pick.divisionId,
                timestamp: Date.now()
            });

            // Update draft state (will be deduplicated if unchanged)
            await this.updateDraftState(divisionId, nextState);

            // Add pick-made event (will be deduplicated if duplicate)
            await this.addDraftEvent(divisionId, {
                type: 'pick-made',
                data: {
                    pick: {
                        ...pick,
                        pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt
                    },
                    nextTurn: {
                        currentPick: nextState.currentPick,
                        currentUserId: nextState.currentUserId,
                        isActive: nextState.isActive
                    }
                },
                userId: pick.userId
            });

            // Clean up old events periodically (every 10 picks)
            if (pick.pickNumber % 10 === 0) {
                await this.cleanupOldEvents(divisionId);
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
            const keysToDelete = Array.from(this.stateCache.keys()).filter(key => key.startsWith(divisionId));
            keysToDelete.forEach(key => this.stateCache.delete(key));
            console.log(`🔥 Cleared cache for division ${divisionId}`);
        } else {
            this.stateCache.clear();
            console.log('🔥 Cleared all Firebase sync cache');
        }
    }

    // NEW: Sync entire draft from sheets to Firebase (RESET + REBUILD)
    static async syncDraftFromSheets(divisionId: string, forceReset = false) {
        try {
            console.log(`🔥 SERVER: Starting ${forceReset ? 'RESET' : 'SYNC'} for division ${divisionId}`);

            // Import sheets functions dynamically
            const { readDraftState } = await import('../../lib/sheets/draft');
            const { getDraftPicksByDivision } = await import('../../lib/sheets/draft');
            const { getDraftOrderByDivision } = await import('../../lib/sheets/draft-order');
            const { getNextDraftState } = await import('../../../draft/lib/get-next-draft-state');

            // Get data from sheets (source of truth)
            const [draftState, draftPicks, draftOrder] = await Promise.all([
                readDraftState(),
                getDraftPicksByDivision(divisionId),
                getDraftOrderByDivision(divisionId)
            ]);

            if (!draftState) {
                throw new Error('No draft state found in sheets');
            }

            if (draftOrder.length === 0) {
                throw new Error('No draft order found for this division');
            }

            // Calculate correct state based on actual picks in sheets
            const picksCount = draftPicks.length;
            const totalTeams = draftOrder.length;
            const picksPerTeam = draftState.picksPerTeam || 12;
            const totalPossiblePicks = totalTeams * picksPerTeam;

            // Use the same logic as draft completion to determine current state
            let currentPick = picksCount + 1;
            let currentUserId = draftState.currentUserId;
            let isActive = draftState.isActive;

            // If there are picks, recalculate the next state from the last pick
            if (picksCount > 0) {
                // Create a mock previous state to calculate next state
                const mockPreviousState = {
                    ...draftState,
                    currentPick: picksCount,
                    isActive: true
                };

                const calculatedNextState = getNextDraftState(mockPreviousState, draftOrder);
                currentPick = calculatedNextState.currentPick;
                currentUserId = calculatedNextState.currentUserId;
                isActive = calculatedNextState.isActive;
            } else {
                // No picks yet, use first person in draft order
                const firstUser = draftOrder.find(order => order.position === 1);
                if (firstUser) {
                    currentUserId = firstUser.userId;
                    currentPick = 1;
                    isActive = draftState.isActive;
                }
            }

            console.log(`🔥 SERVER: Calculated state from sheets: Pick ${currentPick}, User ${currentUserId}, Active ${isActive}`);

            // Clear cache to force fresh sync
            this.clearCache(divisionId);

            // If force reset or if we detect inconsistencies, clear everything
            if (forceReset) {
                console.log(`🔥 SERVER: 🧹 FORCE RESET - Clearing all Firebase data for division ${divisionId}`);
                await this.clearAllEvents(divisionId);

                // Clear all picks
                const picksRef = adminDatabase.ref(`drafts/${divisionId}/picks`);
                await picksRef.remove();
            } else {
                // Remove orphaned picks that don't exist in sheets
                const validPickNumbers = draftPicks.map(pick => pick.pickNumber);
                await this.removeOrphanedPicks(divisionId, validPickNumbers);
            }

            // Update Firebase with the correct state from sheets
            const firebaseState: DraftState = {
                currentPick,
                currentUserId,
                isActive,
                totalPicks: totalPossiblePicks,
                lastUpdate: Date.now(),
                syncedFromSheets: true
            };

            await this.updateDraftState(divisionId, firebaseState);

            // Sync all picks from sheets to Firebase
            console.log(`🔥 SERVER: Syncing ${draftPicks.length} picks from sheets to Firebase`);
            for (const pick of draftPicks) {
                await this.updateDraftPick(divisionId, pick.pickNumber, {
                    pickNumber: pick.pickNumber,
                    round: pick.round,
                    userId: pick.userId,
                    playerId: pick.playerId,
                    playerName: pick.playerName,
                    teamCode: pick.teamCode,
                    teamName: pick.teamName,
                    position: pick.position,
                    pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt,
                    divisionId: pick.divisionId,
                    timestamp: Date.now()
                });
            }

            // Add sync event to notify clients
            await this.addDraftEvent(divisionId, {
                type: forceReset ? 'draft-reset' : 'draft-synced',
                data: {
                    message: forceReset
                        ? 'Draft completely reset and synced from Google Sheets'
                        : 'Draft synced from Google Sheets',
                    picksCount,
                    currentPick,
                    currentUserId,
                    isActive,
                    totalPossiblePicks,
                    forceReset,
                    timestamp: new Date().toISOString()
                }
            });

            console.log(`🔥 ✅ Draft ${forceReset ? 'RESET' : 'SYNC'} completed for division ${divisionId}:`, {
                picksCount,
                currentPick,
                currentUserId,
                isActive,
                totalPossiblePicks,
                forceReset
            });

            return {
                success: true,
                picksCount,
                currentPick,
                currentUserId,
                isActive,
                totalPossiblePicks,
                forceReset
            };

        } catch (error) {
            console.error(`🔥 ❌ Draft sync failed for division ${divisionId}:`, error);
            throw error;
        }
    }
}
