/* Location: app/draft/components/draft-firebase-handler.tsx */

// /draft/components/draft-firebase-handler.tsx - UPDATED WITH SYNC EVENT HANDLING
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRevalidator } from 'react-router';
import { ref, onValue, off, get } from 'firebase/database';
import { useToast } from '../../_shared/components/toast-manager';
import { getRealtimeDbInstance } from '../lib/firebase-client-config';
import type { ConnectionStatusProps } from './connection-status';

interface DraftEvent {
    type: 'pick-made' | 'turn-change' | 'draft-started' | 'draft-ended' | 'draft-synced' | 'draft-reset';
    data: any;
    timestamp: number;
    divisionId: string;
    userId?: string;
}

interface DraftFirebaseHandlerProps {
    divisionId: string;
    currentUserId: string;
    isDraftActive: boolean;
    children: (props: ConnectionStatusProps) => React.ReactNode;
}

export const DraftFirebaseHandler: React.FC<DraftFirebaseHandlerProps> = ({
    children,
    divisionId,
    currentUserId,
    isDraftActive,
}) => {
    const revalidator = useRevalidator();
    const { showToast } = useToast();
    const revalidatorRef = useRef(revalidator);
    const revalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [lastEventId, setLastEventId] = useState<string>('');
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
        'connecting',
    );
    const [hasError, setHasError] = useState(false);

    // Stable refs
    const listenersSetupRef = useRef(false);

    // Update refs when props change
    useEffect(() => {
        revalidatorRef.current = revalidator;
    }, [revalidator]);

    // Monitor Firebase connection status
    useEffect(() => {
        const database = getRealtimeDbInstance();
        const connectedRef = ref(database, '.info/connected');

        const connectionListener = onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val() === true;
            setConnectionState((prev) => {
                const newState = connected ? 'connected' : 'disconnected';
                return prev !== newState ? newState : prev;
            });
            setHasError((prev) => (prev ? false : prev));

            if (connected) {
                console.log('🔥 Firebase connected');
            } else {
                console.log('🔥 Firebase disconnected');
            }
        });

        return () => {
            off(connectedRef, 'value', connectionListener);
        };
    }, []); // Empty dependency array - connection listener only

    // Enhanced handleDraftEvent with sync event handling
    const handleDraftEvent = useCallback(
        (event: DraftEvent & { id: string }) => {
            console.log('🔥 📨 Processing draft event:', event.type, event.data);

            switch (event.type) {
                case 'pick-made':
                    console.log('🏈 Pick made:', event.data);
                    // Show toast for other users' picks
                    if (event.userId && event.userId !== currentUserId && event.data?.pick) {
                        showToast({
                            message: `${event.data.pick.playerName} drafted by ${event.userId}`,
                            type: 'info',
                            duration: 4000,
                        });
                    }
                    break;

                case 'turn-change':
                    console.log('🔄 Turn changed:', event.data);
                    break;

                case 'draft-started':
                    console.log('🏁 Draft started');
                    showToast({
                        message: '🏁 Draft has started!',
                        type: 'success',
                        duration: 5000,
                    });
                    revalidatorRef.current.revalidate();
                    break;

                case 'draft-ended': {
                    console.log('🏆 Draft ended');
                    const endData = event.data;

                    if (endData?.autoCommitted) {
                        showToast({
                            message: '🎉 Draft completed! Teams have been automatically committed to Firestore.',
                            type: 'success',
                            duration: 8000,
                        });
                    } else {
                        showToast({
                            message: '🏁 Draft completed! Please commit teams manually from the admin panel.',
                            type: 'warning',
                            duration: 8000,
                        });
                    }
                    revalidatorRef.current.revalidate();
                    break;
                }

                case 'draft-synced': {
                    console.log('🔄 Draft synced from sheets');
                    const syncData = event.data;

                    showToast({
                        message: `📋 Draft synced from Google Sheets! ${syncData?.picksCount || 0} picks, ${
                            syncData?.isActive ? 'active' : 'completed'
                        }`,
                        type: 'info',
                        duration: 5000,
                    });

                    // Always revalidate after sync to get fresh data
                    revalidatorRef.current.revalidate();
                    break;
                }

                case 'draft-reset': {
                    console.log('🔄 Draft RESET from sheets');
                    const resetData = event.data;

                    showToast({
                        message: `⚠️ Draft completely reset from Google Sheets! All Firebase data cleared and rebuilt. ${
                            resetData?.picksCount || 0
                        } picks restored.`,
                        type: 'warning',
                        duration: 8000,
                    });

                    // Always revalidate after reset to get fresh data
                    revalidatorRef.current.revalidate();
                    break;
                }

                default:
                    console.log('🔥 Unknown event type:', event.type);
            }
        },
        [currentUserId, showToast],
    ); // Dependencies for stable callback

    // Listen to draft state changes and events
    useEffect(() => {
        if (!isDraftActive || !divisionId) {
            console.log('🔥 ❌ Skipping listener setup:', {
                isDraftActive,
                divisionId,
            });
            // Reset the flag when conditions aren't met
            listenersSetupRef.current = false;
            return;
        }

        if (listenersSetupRef.current) {
            console.log('🔥 ❌ Listeners already setup, skipping');
            return;
        }

        console.log(`🔥 ✅ Setting up Firebase listeners for division: ${divisionId} (ONCE)`);
        listenersSetupRef.current = true;

        const database = getRealtimeDbInstance();

        console.log(`🔥 Current user: ${currentUserId}`);

        const draftStateRef = ref(database, `drafts/${divisionId}/state`);
        const draftEventsRef = ref(database, `drafts/${divisionId}/events`);

        console.log('🔥 📡 Listening to Firebase paths:', {
            state: `drafts/${divisionId}/state`,
            events: `drafts/${divisionId}/events`,
        });

        // Store current lastEventId to avoid stale closure
        let currentLastEventId = lastEventId;

        // Listen to draft state changes
        const stateListener = onValue(
            draftStateRef,
            (snapshot) => {
                console.log('🔥 📥 Raw state snapshot received:', snapshot.exists(), snapshot.val());

                const state = snapshot.val();
                if (state?.lastUpdate) {
                    console.log('🔥 ✅ Draft state updated:', state);
                    console.log(
                        '🔥 🕒 State lastUpdate:',
                        state.lastUpdate,
                        'Previous lastEventId:',
                        currentLastEventId,
                    );

                    // Only revalidate if this is a newer update
                    if (state.lastUpdate.toString() !== currentLastEventId) {
                        console.log('🔥 🔄 NEW UPDATE DETECTED - scheduling revalidation');
                        currentLastEventId = state.lastUpdate.toString();
                        setLastEventId(currentLastEventId);

                        // Clear existing timeout to prevent multiple revalidations
                        if (revalidateTimeoutRef.current) {
                            clearTimeout(revalidateTimeoutRef.current);
                        }

                        revalidateTimeoutRef.current = setTimeout(() => {
                            console.log('🔥 🚀 Calling revalidator.revalidate() (debounced)');
                            revalidatorRef.current.revalidate();
                        }, 500);
                    } else {
                        console.log('🔥 ⏭️ Update already processed, skipping');
                    }
                } else {
                    console.log('🔥 ⚠️ No state data or lastUpdate field:', state);
                }
            },
            (error) => {
                console.error('🔥 ❌ Draft state listener error:', error);
                setHasError(true);
                setConnectionState('error');
            },
        );

        // Listen to draft events for immediate UI feedback
        const eventsListener = onValue(
            draftEventsRef,
            (snapshot) => {
                console.log('🔥 📥 Raw events snapshot received:', snapshot.exists());

                const events = snapshot.val();
                if (events) {
                    console.log('🔥 📋 Events data:', events);

                    const eventList = Object.entries(events)
                        .map(([id, event]: [string, any]) => ({ id, ...event }))
                        .sort((a, b) => b.timestamp - a.timestamp);

                    console.log('🔥 📊 Processed event list:', eventList);

                    const latestEvent = eventList[0];
                    if (latestEvent && latestEvent.id !== currentLastEventId) {
                        console.log('🔥 🎉 NEW EVENT DETECTED:', latestEvent);
                        currentLastEventId = latestEvent.id;
                        setLastEventId(currentLastEventId);
                        handleDraftEvent(latestEvent);
                    } else {
                        console.log('🔥 ⏭️ No new events or already processed');
                    }
                } else {
                    console.log('🔥 ⚠️ No events data');
                }
            },
            (error) => {
                console.error('🔥 ❌ Draft events listener error:', error);
                setHasError(true);
                setConnectionState('error');
            },
        );

        // Test if we can read the data immediately
        get(draftStateRef)
            .then((snapshot) => {
                console.log('🔥 🧪 Initial state read test:', snapshot.exists(), snapshot.val());
            })
            .catch((error) => {
                console.error('🔥 ❌ Initial state read failed:', error);
            });

        // Cleanup function
        return () => {
            console.log(`🔥 🧹 Cleaning up Firebase listeners for division: ${divisionId}`);
            off(draftStateRef, 'value', stateListener);
            off(draftEventsRef, 'value', eventsListener);

            if (revalidateTimeoutRef.current) {
                clearTimeout(revalidateTimeoutRef.current);
                revalidateTimeoutRef.current = null;
            }

            listenersSetupRef.current = false;
        };
    }, [isDraftActive, divisionId, lastEventId, handleDraftEvent, currentUserId]); // Include dependencies

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (revalidateTimeoutRef.current) {
                clearTimeout(revalidateTimeoutRef.current);
            }
        };
    }, []);

    // Connection status indicator (optional UI feedback)
    if (hasError) {
        return (
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: '#fee',
                    color: '#c00',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    border: '1px solid #fcc',
                }}
            >
                ❌ Firebase connection error
            </div>
        );
    }

    if (connectionState === 'disconnected') {
        return (
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: '#ffeaa7',
                    color: '#d63031',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    border: '1px solid #fdcb6e',
                }}
            >
                ⚠️ Offline - changes will sync when reconnected
            </div>
        );
    }

    return (
        <>
            {children({
                connectionState,
                onReconnect: revalidator.revalidate,
            })}
        </>
    );
};
