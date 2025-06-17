// /_shared/lib/firestore-cache/firebase-draft-sync.ts - UPDATED WITH CACHING
import { getRealtimeAdminDbInstance } from './firebase.realtime-admin';

interface DraftEvent {
    type: 'pick-made' | 'turn-change' | 'draft-started' | 'draft-ended';
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
                    console.log('🔥 SERVER: ⏭️ Skipping write - state unchanged in database');
                    this.stateCache.set(cacheKey, currentDataHash);
                    return true;
                }
            }

            console.log('🔥 SERVER: Writing to path:', path);
            console.log('🔥 SERVER: Writing data:', state);

            const stateRef = adminDatabase.ref(path);
            const updateData = {
                ...state,
                lastUpdate: Date.now()
            };

            await stateRef.set(updateData);

            // Cache this write to prevent immediate duplicates
            this.stateCache.set(cacheKey, currentDataHash);

            console.log('🔥 SERVER: ✅ Write successful');
            return true;
        } catch (error) {
            console.error('🔥 SERVER: ❌ Write failed:', error);
            return false;
        }
    }

    // Get draft state from Firebase
    static async getDraftState(divisionId: string): Promise<DraftState | null> {
        try {
            const stateRef = adminDatabase.ref(`drafts/${divisionId}/state`);
            const snapshot = await stateRef.once('value');
            return snapshot.val();
        } catch (error) {
            console.error('🔥 Error getting draft state:', error);
            return null;
        }
    }

    // Sync draft from sheets to Firebase - UPDATED WITH CACHED FUNCTIONS
    static async syncDraftFromSheets(divisionId: string) {
        try {
            console.log(`🔥 SERVER: Starting sync for division ${divisionId}`);

            // Import sheets functions to get current state
            const { readDraftState, getDraftPicksByDivision } = await import('../sheets/draft');
            const { getDraftOrderByDivision } = await import('../sheets/draft-order');

            // Get current data from sheets
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

            // Calculate the correct current state based on picks made
            const picksCount = draftPicks.length;
            const totalTeams = draftOrder.length;
            const picksPerTeam = draftState.picksPerTeam || 15;
            const totalPossiblePicks = totalTeams * picksPerTeam;

            // Determine whose turn it is based on picks made
            let currentPick = picksCount + 1;
            let currentUserId = draftState.currentUserId;
            let isActive = draftState.isActive && currentPick <= totalPossiblePicks;

            if (isActive && currentPick <= totalPossiblePicks) {
                // Calculate whose turn it is using snake draft logic
                const currentRound = Math.ceil(currentPick / totalTeams);
                const positionInRound = ((currentPick - 1) % totalTeams) + 1;

                let actualPosition: number;
                if (currentRound % 2 === 0) {
                    // Even rounds: reverse order (snake draft)
                    actualPosition = totalTeams - positionInRound + 1;
                } else {
                    // Odd rounds: normal order
                    actualPosition = positionInRound;
                }

                const currentUser = draftOrder.find(order => order.position === actualPosition);
                if (currentUser) {
                    currentUserId = currentUser.userId;
                }
            }

            // Update Firebase with the correct state
            const firebaseState = {
                currentPick,
                currentUserId,
                isActive,
                totalPicks: totalPossiblePicks,
                lastUpdate: Date.now(),
                syncedFromSheets: true
            };

            await this.updateDraftState(divisionId, firebaseState);

            // Initialize the draft structure if needed
            const draftRef = adminDatabase.ref(`drafts/${divisionId}`);
            const draftSnapshot = await draftRef.once('value');

            if (!draftSnapshot.exists()) {
                // Initialize the complete draft structure
                await this.initializeDraft(divisionId, {
                    currentPick,
                    currentUserId,
                    isActive,
                    lastUpdate: Date.now(),
                    totalPicks: totalPossiblePicks
                });
            }

            // Sync existing picks to Firebase
            if (draftPicks.length > 0) {
                console.log(`🔥 Syncing ${draftPicks.length} existing picks to Firebase`);

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
            }

            // Add sync event
            await this.addDraftEvent(divisionId, {
                type: 'draft-synced',
                data: {
                    message: 'Draft synced from Google Sheets',
                    picksCount,
                    currentPick,
                    currentUserId,
                    isActive,
                    timestamp: new Date().toISOString()
                }
            });

            console.log(`🔥 ✅ Draft sync completed for division ${divisionId}:`, {
                picksCount,
                currentPick,
                currentUserId,
                isActive,
                totalPossiblePicks
            });

            return {
                success: true,
                picksCount,
                currentPick,
                currentUserId,
                isActive,
                totalPossiblePicks
            };

        } catch (error) {
            console.error(`🔥 ❌ Draft sync failed for division ${divisionId}:`, error);
            throw error;
        }
    }

    // Initialize draft structure
    static async initializeDraft(divisionId: string, initialState: DraftState) {
        try {
            const draftRef = adminDatabase.ref(`drafts/${divisionId}`);
            const initData = {
                state: {
                    ...initialState,
                    lastUpdate: Date.now()
                },
                events: {},
                picks: {}
            };

            await draftRef.set(initData);
            console.log(`🔥 ✅ Draft initialized for division ${divisionId}`);
        } catch (error) {
            console.error(`🔥 ❌ Failed to initialize draft for division ${divisionId}:`, error);
            throw error;
        }
    }

    // Update draft pick in Firebase
    static async updateDraftPick(divisionId: string, pickNumber: number, pickData: any) {
        try {
            const pickRef = adminDatabase.ref(`drafts/${divisionId}/picks/${pickNumber}`);
            await pickRef.set(pickData);
        } catch (error) {
            console.error(`🔥 ❌ Failed to update pick ${pickNumber}:`, error);
            throw error;
        }
    }

    // Add draft event (with deduplication)
    static async addDraftEvent(divisionId: string, event: Omit<DraftEvent, 'divisionId' | 'timestamp'>) {
        try {
            // Prevent duplicate events within a short time window
            const eventKey = `${divisionId}_${event.type}_${JSON.stringify(event.data)}`;
            const now = Date.now();
            const cacheKey = `event_${eventKey}`;
            const lastEventTime = this.stateCache.get(cacheKey);

            if (lastEventTime && (now - parseInt(lastEventTime)) < 1000) { // 1 second window
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

    // Broadcast pick made - MISSING METHOD ADDED
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
            // Clear cache for specific division
            const keysToDelete = Array.from(this.stateCache.keys()).filter(key =>
                key.startsWith(`${divisionId}_`)
            );
            keysToDelete.forEach(key => this.stateCache.delete(key));
            console.log(`🔥 Cleared cache for division: ${divisionId}`);
        } else {
            // Clear all cache
            this.stateCache.clear();
            console.log('🔥 Cleared all cache');
        }
    }
}
