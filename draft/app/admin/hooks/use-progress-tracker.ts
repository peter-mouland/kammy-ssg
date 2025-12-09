// app/admin/hooks/use-progress-tracker.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProgressUpdate } from '../libs/progress-store.server';

interface UseProgressTrackerProps {
    jobId: string | null;
    onComplete?: (update: ProgressUpdate) => void;
    onError?: (update: ProgressUpdate) => void;
}

interface UseProgressTrackerReturn {
    progress: ProgressUpdate | null;
    connectionState: ConnectionState;
    reconnect: () => void;
}

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type ConnectionState =
    | { status: 'disconnected'; attempts: number }
    | { status: 'connecting'; attempts: number }
    | { status: 'connected'; attempts: number }
    | { status: 'error'; attempts: number; maxReached: boolean }
    | { status: 'polling'; attempts: number };

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;
const POLLING_INTERVAL = 1000; // Poll every 1 second when SSE fails
const CONNECTION_TIMEOUT = 5000; // If no progress after 5 seconds, switch to polling

// ============================================================================
// EVENTSOURCE-SPECIFIC HANDLERS (Pure functions for EventSource lifecycle)
// ============================================================================

interface ConnectionStateUpdaters {
    setConnecting: () => void;
    setConnected: () => void;
    setError: (maxReached?: boolean) => void;
    setDisconnected: () => void;
}

function createConnectionStateUpdaters(
    setConnectionState: React.Dispatch<React.SetStateAction<ConnectionState>>
): ConnectionStateUpdaters {
    return {
        setConnecting: () => setConnectionState(prev => ({
            status: 'connecting' as const,
            attempts: prev.attempts
        })),
        setConnected: () => setConnectionState( () => ({
            status: 'connected' as const,
            attempts: 0 // Reset on success
        })),
        setError: (maxReached = false) => setConnectionState(prev => ({
            status: 'error' as const,
            attempts: prev.attempts + 1,
            maxReached
        })),
        setDisconnected: () => setConnectionState(prev => ({
            status: 'disconnected' as const,
            attempts: prev.attempts
        })),
    };
}

function handleEventSourceOpen(updaters: ConnectionStateUpdaters): void {
    console.log('✅ EventSource connected successfully');
    updaters.setConnected();
}

function handleEventSourceError(
    updaters: ConnectionStateUpdaters,
    currentAttempts: number
): void {
    console.log('❌ EventSource error occurred');
    const maxReached = currentAttempts >= MAX_RECONNECT_ATTEMPTS - 1;
    updaters.setError(maxReached);
}

// ============================================================================
// PROGRESS-SPECIFIC HANDLERS (Pure functions for progress updates)
// ============================================================================

interface ProgressCallbacks {
    onProgress: (update: ProgressUpdate) => void;
    onComplete: (update: ProgressUpdate) => void;
    onError: (update: ProgressUpdate) => void;
    onJobFinished: () => void;
    onConnectionConfirmed?: () => void;
}

function handleProgressMessage(
    event: MessageEvent,
    callbacks: ProgressCallbacks
): void {
    try {
        const data = JSON.parse(event.data);

        // Handle connection confirmation
        if (data.type === 'connection') {
            console.log('✅ Progress stream connection confirmed');
            callbacks.onConnectionConfirmed?.();
            return;
        }

        // Handle actual progress updates
        if (data.jobId && data.stage) {
            console.log('📊 Progress update:', data.stage, `${data.percentage}%`);
            const update = data as ProgressUpdate;
            callbacks.onProgress(update);

            // Check if job is finished
            if (update.status === 'completed') {
                console.log('✅ Job completed successfully');
                callbacks.onJobFinished();
                callbacks.onComplete(update);
            } else if (update.status === 'error') {
                console.log('❌ Job failed with error');
                callbacks.onJobFinished();
                callbacks.onError(update);
            }
        }
    } catch (parseError) {
        console.error('❌ Error parsing progress update:', parseError);
    }
}

// ============================================================================
// EVENTSOURCE FACTORY
// ============================================================================

interface EventSourceConfig {
    jobId: string;
    connectionUpdaters: ConnectionStateUpdaters;
    progressCallbacks: ProgressCallbacks;
    currentAttempts: number;
}

function createProgressEventSource(config: EventSourceConfig): EventSource {
    const eventSource = new EventSource(`/admin-progress/${config.jobId}`);

    eventSource.onopen = () => handleEventSourceOpen(config.connectionUpdaters);

    eventSource.onmessage = (event) => handleProgressMessage(event, config.progressCallbacks);

    eventSource.onerror = () => handleEventSourceError(
        config.connectionUpdaters,
        config.currentAttempts
    );

    return eventSource;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useProgressTracker({
                                       jobId,
                                       onComplete = () => {},
                                       onError = () => {}
                                   }: UseProgressTrackerProps): UseProgressTrackerReturn {
    const [progress, setProgress] = useState<ProgressUpdate | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        status: 'disconnected',
        attempts: 0
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isJobFinishedRef = useRef<boolean>(false);
    const hasReceivedDataRef = useRef<boolean>(false);

    // FIXED: Remove all dependencies that could cause loops
    const cleanup = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }

        setConnectionState({ status: 'disconnected', attempts: 0 });
    }, []);

    const connect = useCallback(() => {
        if (!jobId) {
            console.log('🔍 No jobId provided, skipping connection');
            return;
        }

        if (isJobFinishedRef.current) {
            console.log('🔍 Job already finished, not connecting');
            return;
        }

        if (connectionState.status === 'error' && connectionState.maxReached) {
            console.log('🚨 Max reconnection attempts reached');
            return;
        }

        console.log('🔍 Connection attempt:', connectionState.attempts + 1, 'for jobId:', jobId);

        cleanup();

        try {
            const connectionUpdaters = createConnectionStateUpdaters(setConnectionState);
            connectionUpdaters.setConnecting();

            const progressCallbacks: ProgressCallbacks = {
                onProgress: (update) => {
                    hasReceivedDataRef.current = true;
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }
                    setProgress(update);
                },
                onComplete,
                onError,
                onJobFinished: () => { isJobFinishedRef.current = true; },
                onConnectionConfirmed: () => {
                    hasReceivedDataRef.current = true;
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }
                },
            };

            const eventSource = createProgressEventSource({
                jobId,
                connectionUpdaters,
                progressCallbacks,
                currentAttempts: connectionState.attempts,
            });

            eventSourceRef.current = eventSource;
            hasReceivedDataRef.current = false;
        } catch (error) {
            console.error('❌ Error creating EventSource:', error);
            setConnectionState(prev => ({
                status: 'error',
                attempts: prev.attempts + 1,
                maxReached: prev.attempts >= MAX_RECONNECT_ATTEMPTS - 1
            }));
        }
    }, [jobId, connectionState.attempts, connectionState.status, onComplete, onError]); // Removed cleanup

    // Auto-reconnect logic
    useEffect(() => {
        if (connectionState.status === 'error' &&
            !connectionState.maxReached &&
            !isJobFinishedRef.current &&
            jobId) {

            console.log(
                `🔄 Will retry connection in ${RECONNECT_DELAY}ms (attempt ${connectionState.attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
                if (jobId && !isJobFinishedRef.current) {
                    connect();
                }
            }, RECONNECT_DELAY);
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [connectionState, jobId, connect]);

    const reconnect = useCallback(() => {
        console.log('🔄 Manual reconnection requested');
        setConnectionState({ status: 'disconnected', attempts: 0 });
        isJobFinishedRef.current = false;
        connect();
    }, [connect]);

    // Polling fallback function
    const pollProgress = useCallback(async () => {
        if (!jobId || isJobFinishedRef.current) {
            return;
        }

        try {
            const response = await fetch(`/admin-progress-poll/${jobId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('📊 Job not found - may have expired');
                    isJobFinishedRef.current = true;
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }
                return;
            }

            const update: ProgressUpdate = await response.json();
            console.log('📊 Polled progress update:', update.stage, `${update.percentage}%`);
            setProgress(update);

            // Check if job is finished
            if (update.status === 'completed') {
                console.log('✅ Job completed (via polling)');
                isJobFinishedRef.current = true;
                onComplete(update);
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            } else if (update.status === 'error') {
                console.log('❌ Job failed (via polling)');
                isJobFinishedRef.current = true;
                onError(update);
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            }
        } catch (error) {
            console.error('❌ Error polling progress:', error);
        }
    }, [jobId, onComplete, onError]);

    // Switch to polling mode (just sets the state, actual polling handled by useEffect)
    const switchToPolling = useCallback(() => {
        if (isJobFinishedRef.current || connectionState.status === 'polling') {
            return;
        }

        console.log('🔄 Switching to polling mode (SSE unavailable)');

        // Clean up SSE connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }

        // Just set the state - the useEffect below will handle starting polling
        setConnectionState({ status: 'polling', attempts: 0 });
    }, [connectionState.status]);

    // Connection timeout - switch to polling if no data received
    useEffect(() => {
        if ((connectionState.status === 'connecting' || connectionState.status === 'connected') &&
            jobId &&
            !isJobFinishedRef.current) {

            // Start timeout when connecting
            console.log('⏱️ Starting connection timeout...');
            connectionTimeoutRef.current = setTimeout(() => {
                if (!hasReceivedDataRef.current && !isJobFinishedRef.current) {
                    console.log('⏱️ Connection timeout - no data received, switching to polling');
                    switchToPolling();
                }
            }, CONNECTION_TIMEOUT);
        }

        return () => {
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
        };
    }, [connectionState.status, jobId, switchToPolling]);

    // Switch to polling when SSE fails after max attempts
    useEffect(() => {
        if (connectionState.status === 'error' &&
            connectionState.maxReached &&
            jobId &&
            !isJobFinishedRef.current) {

            console.log('🔄 SSE failed after max attempts, switching to polling mode');
            switchToPolling();
        }
    }, [connectionState.status, connectionState.maxReached, jobId, switchToPolling]);

    // Manage polling when in polling mode
    useEffect(() => {
        if (connectionState.status === 'polling' && jobId && !isJobFinishedRef.current) {
            console.log('📊 Starting polling interval...');

            // Clear any existing polling interval
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }

            // Start polling immediately
            pollProgress();

            // Set up interval for continued polling
            pollingIntervalRef.current = setInterval(pollProgress, POLLING_INTERVAL);
        }

        return () => {
            if (pollingIntervalRef.current) {
                console.log('📊 Cleaning up polling interval');
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [connectionState.status, jobId, pollProgress]);

    useEffect(() => {
        if (jobId) {
            console.log('🔍 Setting up connection for new jobId:', jobId);
            isJobFinishedRef.current = false;
            setConnectionState({ status: 'disconnected', attempts: 0 });

            // Call connect directly instead of through dependencies
            const timeoutId = setTimeout(() => {
                connect();
            }, 0);

            return () => {
                clearTimeout(timeoutId);
                cleanup();
            };
        } else {
            console.log('🔍 No jobId, cleaning up');
            cleanup();
            setProgress(null);
            isJobFinishedRef.current = false;
        }
    }, [jobId]); // ONLY jobId dependency

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        progress,
        connectionState,
        reconnect,
    };
}
