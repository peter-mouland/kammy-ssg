// components/draft-firebase-handler.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, off, get, set } from 'firebase/database';
import { useRevalidator } from 'react-router';
import { getRealtimeDbInstance } from '../lib/firebase-client-config';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

const database = getRealtimeDbInstance()

interface DraftEvent {
    type: 'pick-made' | 'turn-change' | 'draft-started' | 'draft-ended' | 'connection';
    data: any;
    timestamp: string;
    divisionId: string;
}

interface DraftFirebaseProps {
    divisionId: string;
    currentUserId: string;
    isDraftActive: boolean;
    children: (props: {
        connectionState: ConnectionState;
        isConnected: boolean;
        hasError: boolean;
        reconnect: () => void;
    }) => React.ReactNode;
}

export function DraftWithFirebase({
                                      divisionId,
                                      currentUserId,
                                      isDraftActive,
                                      children
                                  }: DraftFirebaseProps) {
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
    const [isConnected, setIsConnected] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [lastEventId, setLastEventId] = useState<string>('');

    // Store revalidator in ref to prevent dependency issues
    const revalidator = useRevalidator();
    const revalidatorRef = useRef(revalidator);
    revalidatorRef.current = revalidator;

    const listenersSetupRef = useRef(false);
    const revalidateTimeoutRef = useRef<NodeJS.Timeout>();

    // Handle connection state changes
    useEffect(() => {
        const connectedRef = ref(database, '.info/connected');

        const connectionListener = onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val();

            // Prevent unnecessary state updates
            setIsConnected(prev => prev !== connected ? connected : prev);
            setConnectionState(prev => {
                const newState = connected ? 'connected' : 'disconnected';
                return prev !== newState ? newState : prev;
            });
            setHasError(prev => prev ? false : prev);

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

    // Stable handleDraftEvent using useCallback with proper dependencies
    const handleDraftEvent = useCallback((event: DraftEvent & { id: string }) => {
        switch (event.type) {
            case 'pick-made':
                console.log('🏈 Pick made:', event.data);
                break;
            case 'turn-change':
                console.log('🔄 Turn changed:', event.data);
                break;
            case 'draft-started':
                console.log('🏁 Draft started');
                revalidatorRef.current.revalidate();
                break;
            case 'draft-ended':
                console.log('🏆 Draft ended');
                revalidatorRef.current.revalidate();
                break;
            default:
                console.log('🔥 Unknown event type:', event.type);
        }
    }, []); // No dependencies needed since we use ref

    // Listen to draft state changes
    useEffect(() => {
        if (!isDraftActive || !divisionId) {
            console.log('🔥 ❌ Skipping listener setup:', {
                isDraftActive,
                divisionId
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
        console.log(`🔥 Current user: ${currentUserId}`);

        const draftStateRef = ref(database, `drafts/${divisionId}/state`);
        const draftEventsRef = ref(database, `drafts/${divisionId}/events`);

        console.log('🔥 📡 Listening to Firebase paths:', {
            state: `drafts/${divisionId}/state`,
            events: `drafts/${divisionId}/events`
        });

        // Store current lastEventId to avoid stale closure
        let currentLastEventId = lastEventId;

        // Listen to draft state changes
        const stateListener = onValue(draftStateRef, (snapshot) => {
            console.log('🔥 📥 Raw state snapshot received:', snapshot.exists(), snapshot.val());

            const state = snapshot.val();
            if (state && state.lastUpdate) {
                console.log('🔥 ✅ Draft state updated:', state);
                console.log('🔥 🕒 State lastUpdate:', state.lastUpdate, 'Previous lastEventId:', currentLastEventId);

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
        }, (error) => {
            console.error('🔥 ❌ Draft state listener error:', error);
            setHasError(true);
            setConnectionState('error');
        });

        // Listen to draft events for immediate UI feedback
        const eventsListener = onValue(draftEventsRef, (snapshot) => {
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
        }, (error) => {
            console.error('🔥 ❌ Draft events listener error:', error);
            setHasError(true);
            setConnectionState('error');
        });

        // Test if we can read the data immediately
        get(draftStateRef).then((snapshot) => {
            console.log('🔥 🧪 Initial state read test:', snapshot.exists(), snapshot.val());
        }).catch((error) => {
            console.error('🔥 ❌ Initial state read test failed:', error);
        });

        return () => {
            console.log(`🔥 🧹 Cleaning up Firebase listeners for division: ${divisionId}`);
            listenersSetupRef.current = false;

            // Clean up timeout to prevent memory leaks and unwanted writes
            if (revalidateTimeoutRef.current) {
                clearTimeout(revalidateTimeoutRef.current);
                revalidateTimeoutRef.current = undefined;
            }

            off(draftStateRef, 'value', stateListener);
            off(draftEventsRef, 'value', eventsListener);
        };
    }, [isDraftActive, divisionId, currentUserId]); // REMOVED lastEventId and handleDraftEvent

    // Manual reconnection using ref
    const reconnect = useCallback(() => {
        console.log('🔥 Manual reconnect triggered');
        setConnectionState('connecting');
        setHasError(false);
        revalidatorRef.current.revalidate();
    }, []);

    // Sync when tab becomes visible (user returns to app)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isConnected) {
                console.log('🔥 Tab visible - syncing data');
                revalidatorRef.current.revalidate();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isConnected]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (revalidateTimeoutRef.current) {
                clearTimeout(revalidateTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            {children({
                connectionState,
                isConnected,
                hasError,
                reconnect
            })}
        </>
    );
}
