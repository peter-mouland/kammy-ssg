// lib/firebase-draft-sync.ts
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

            // Cache this event
            this.stateCache.set(cacheKey, now.toString());

            console.log('🔥 Draft event added:', divisionId, eventData);
            return newEventRef.key;
        } catch (error) {
            console.error('🔥 Error adding draft event:', error);
            return null;
        }
    }

    // Update pick data
    static async updateDraftPick(divisionId: string, pickNumber: number, pickData: any) {
        try {
            const pickRef = adminDatabase.ref(`drafts/${divisionId}/picks/${pickNumber}`);
            const updateData = {
                ...pickData,
                timestamp: Date.now()
            };

            await pickRef.set(updateData);
            console.log('🔥 Draft pick updated:', divisionId, pickNumber, updateData);

            return true;
        } catch (error) {
            console.error('🔥 Error updating draft pick:', error);
            return false;
        }
    }

    // Get current draft state
    static async getDraftState(divisionId: string): Promise<DraftState | null> {
        try {
            const stateRef = adminDatabase.ref(`drafts/${divisionId}/state`);
            const snapshot = await stateRef.once('value');

            if (snapshot.exists()) {
                return snapshot.val() as DraftState;
            }

            return null;
        } catch (error) {
            console.error('🔥 Error getting draft state:', error);
            return null;
        }
    }

    // Add this to your FirebaseDraftSync class in firebase-draft-sync.ts

// Sync current draft state from Google Sheets to Firebase
    static async syncDraftFromSheets(divisionId: string) {
        try {
            console.log(`🔥 Syncing draft state from sheets to Firebase for division: ${divisionId}`);

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

    // Initialize draft
    static async initializeDraft(divisionId: string, initialState: DraftState) {
        try {
            const draftRef = adminDatabase.ref(`drafts/${divisionId}`);
            const initData = {
                state: {
                    ...initialState,
                    lastUpdate: Date.now()
                },
                events: {},
                picks: {},
                metadata: {
                    created: Date.now(),
                    version: '1.0'
                }
            };

            await draftRef.set(initData);
            console.log('🔥 Draft initialized:', divisionId);

            // Clear cache for this division
            const cacheKey = `${divisionId}_state`;
            this.stateCache.delete(cacheKey);

            // Add initialization event
            await this.addDraftEvent(divisionId, {
                type: 'draft-started',
                data: { message: 'Draft initialized' }
            });

            return true;
        } catch (error) {
            console.error('🔥 Error initializing draft:', error);
            return false;
        }
    }

    // Clean up old events (keep last 50 events per division)
    static async cleanupOldEvents(divisionId: string, keepCount: number = 50) {
        try {
            const eventsRef = adminDatabase.ref(`drafts/${divisionId}/events`);
            const snapshot = await eventsRef.once('value');

            if (snapshot.exists()) {
                const events = snapshot.val();
                const eventEntries = Object.entries(events)
                    .sort(([,a]: [string, any], [,b]: [string, any]) => b.timestamp - a.timestamp);

                if (eventEntries.length > keepCount) {
                    const eventsToDelete = eventEntries.slice(keepCount);

                    for (const [eventId] of eventsToDelete) {
                        const deleteRef = adminDatabase.ref(`drafts/${divisionId}/events/${eventId}`);
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

    // Broadcast pick made
    static async broadcastPickMade(divisionId: string, pick: any, nextState: Partial<DraftState>) {
        try {
            // Update the pick
            await this.updateDraftPick(divisionId, pick.pickNumber, pick);

            // Update draft state (will be deduplicated if unchanged)
            await this.updateDraftState(divisionId, nextState);

            // Add event (will be deduplicated if duplicate)
            await this.addDraftEvent(divisionId, {
                type: 'pick-made',
                data: {
                    pick,
                    nextTurn: {
                        currentPick: nextState.currentPick,
                        currentUserId: nextState.currentUserId
                    }
                },
                userId: pick.userId
            });

            // Clean up old events periodically
            if (pick.pickNumber % 10 === 0) {
                await this.cleanupOldEvents(divisionId);
            }

            return true;
        } catch (error) {
            console.error('🔥 Error broadcasting pick:', error);
            return false;
        }
    }

    // Clear cache for a specific division (useful for testing/debugging)
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
