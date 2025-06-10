// hooks/use-draft-sse.ts - Optimized to prevent excessive rerenders
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRevalidator } from 'react-router';

interface DraftEvent {
    type: 'pick-made' | 'turn-change' | 'draft-started' | 'draft-ended' | 'connection' | 'heartbeat';
    data: any;
    timestamp: string;
    divisionId: string;
}

interface UseDraftSSEOptions {
    divisionId: string;
    userId?: string;
    onPickMade?: (data: any) => void;
    onTurnChange?: (data: any) => void;
    onDraftEnded?: (data: any) => void;
    enabled?: boolean;
}

export function useDraftSSE({
                                divisionId,
                                userId,
                                onPickMade,
                                onTurnChange,
                                onDraftEnded,
                                enabled = true
                            }: UseDraftSSEOptions) {
    // Use refs for stable callbacks to prevent recreating EventSource
    const callbacksRef = useRef({ onPickMade, onTurnChange, onDraftEnded });
    const revalidator = useRevalidator();

    // Only track essential state that affects UI
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const [retryCount, setRetryCount] = useState(0);

    // Use refs for state that doesn't need to trigger rerenders
    const eventSourceRef = useRef<EventSource | null>(null);
    const lastEventIdRef = useRef<number>(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const lastRevalidationRef = useRef<number>(0);
    const isConnectedRef = useRef<boolean>(false);

    // Update callbacks ref without causing rerenders
    useEffect(() => {
        callbacksRef.current = { onPickMade, onTurnChange, onDraftEnded };
    }, [onPickMade, onTurnChange, onDraftEnded]);

    // Stable connect function that doesn't change unless essential deps change
    const connect = useCallback(() => {
        if (!enabled || !divisionId) return;

        // Clean up existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setConnectionState('connecting');
        isConnectedRef.current = false;

        const params = new URLSearchParams({
            division: divisionId,
            ...(userId && { user: userId }),
            ...(lastEventIdRef.current > 0 && { lastEventId: lastEventIdRef.current.toString() })
        });

        const eventSource = new EventSource(`/api/draft/live?${params}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log('📡 Draft SSE connected');
            setConnectionState('connected');
            setRetryCount(0);
            isConnectedRef.current = true;
        };

        eventSource.onmessage = (event) => {
            try {
                const draftEvent: DraftEvent = JSON.parse(event.data);

                // Update last event ID for reconnection
                if (event.lastEventId) {
                    lastEventIdRef.current = parseInt(event.lastEventId);
                }

                // Only log important events to reduce console spam
                if (draftEvent.type !== 'heartbeat') {
                    console.log('📡 Draft SSE event:', draftEvent.type);
                }

                switch (draftEvent.type) {
                    case 'pick-made':
                        callbacksRef.current.onPickMade?.(draftEvent.data);
                        // Throttle revalidation to prevent excessive calls
                        const now = Date.now();
                        if (now - lastRevalidationRef.current > 1000) { // Max once per second
                            lastRevalidationRef.current = now;
                            revalidator.revalidate();
                        }
                        break;

                    case 'turn-change':
                        callbacksRef.current.onTurnChange?.(draftEvent.data);
                        // Only revalidate if there are actual changes we care about
                        if (draftEvent.data.pickCount !== undefined) {
                            const now = Date.now();
                            if (now - lastRevalidationRef.current > 1000) {
                                lastRevalidationRef.current = now;
                                revalidator.revalidate();
                            }
                        }
                        break;

                    case 'draft-ended':
                        callbacksRef.current.onDraftEnded?.(draftEvent.data);
                        revalidator.revalidate();
                        break;

                    case 'connection':
                        // Just log, don't revalidate for connection messages
                        console.log('📡 Connection confirmed');
                        break;

                    case 'heartbeat':
                        // Heartbeats are silent - no logging or revalidation
                        break;

                    default:
                        console.log('📡 Unknown event type:', draftEvent.type);
                }
            } catch (error) {
                console.error('📡 Failed to parse SSE event:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('📡 Draft SSE error:', error);
            setConnectionState('error');
            isConnectedRef.current = false;

            // Exponential backoff for reconnection
            const currentRetryCount = retryCount;
            const backoffDelay = Math.min(1000 * Math.pow(2, currentRetryCount), 30000); // Max 30 seconds

            console.log(`📡 Reconnecting in ${backoffDelay}ms (attempt ${currentRetryCount + 1})`);

            reconnectTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                connect();
            }, backoffDelay);
        };

        // Don't create a separate close listener - cleanup is handled in disconnect
    }, [divisionId, userId, enabled, retryCount]); // Minimal dependencies

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
        }
        setConnectionState('disconnected');
        isConnectedRef.current = false;
    }, []);

    const reconnect = useCallback(() => {
        disconnect();
        setRetryCount(0);
        // Small delay to ensure cleanup is complete
        setTimeout(() => connect(), 100);
    }, [disconnect, connect]);

    // Connect/disconnect based on enabled state and dependencies
    useEffect(() => {
        if (enabled && divisionId) {
            connect();
        } else {
            disconnect();
        }

        return disconnect;
    }, [enabled, divisionId]); // Remove connect/disconnect from deps to prevent loops

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []); // Empty deps - only on unmount

    // Auto-reconnect when tab becomes visible (throttled)
    useEffect(() => {
        let lastVisibilityChange = 0;

        const handleVisibilityChange = () => {
            const now = Date.now();
            // Throttle visibility reconnects to prevent spam
            if (now - lastVisibilityChange < 5000) return;
            lastVisibilityChange = now;

            if (document.visibilityState === 'visible' &&
                connectionState === 'disconnected' &&
                !isConnectedRef.current &&
                enabled &&
                divisionId) {
                console.log('📡 Tab visible, reconnecting SSE...');
                reconnect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [connectionState, reconnect, enabled, divisionId]);

    // Return stable object to prevent consumer rerenders
    return {
        connectionState,
        retryCount,
        reconnect,
        disconnect,
        isConnected: connectionState === 'connected',
        isConnecting: connectionState === 'connecting',
        hasError: connectionState === 'error'
    };
}
