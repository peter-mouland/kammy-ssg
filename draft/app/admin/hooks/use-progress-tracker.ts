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
    isConnected: boolean;
    hasError: boolean;
    reconnect: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;

export function useProgressTracker({ jobId, onComplete, onError }: UseProgressTrackerProps): UseProgressTrackerReturn {
    const [progress, setProgress] = useState<ProgressUpdate | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isJobFinishedRef = useRef<boolean>(false);

    const cleanup = useCallback(() => {
        console.log('🔍 Cleaning up EventSource for jobId:', jobId);

        if (eventSourceRef.current) {
            console.log('🔍 Closing EventSource, readyState:', eventSourceRef.current.readyState);
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        setIsConnected(false);
        setConnectionAttempts(0);
    }, [jobId]);

    const connect = useCallback(() => {
        if (!jobId) {
            console.log('🔍 No jobId provided, skipping connection');
            return;
        }

        // Prevent connection if job is already finished
        if (isJobFinishedRef.current) {
            console.log('🔍 Job already finished, not connecting');
            return;
        }

        // Prevent too many reconnection attempts
        if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('🚨 Max reconnection attempts reached:', connectionAttempts);
            setHasError(true);
            return;
        }

        console.log('🔍 Connection attempt:', connectionAttempts + 1, 'for jobId:', jobId);

        cleanup();
        setHasError(false);

        try {
            const eventSource = new EventSource(`/admin-progress/${jobId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('✅ EventSource connected successfully');
                setIsConnected(true);
                setHasError(false);
                // Reset connection attempts on successful connection
                setConnectionAttempts(0);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle connection confirmation
                    if (data.type === 'connection') {
                        console.log('✅ Progress stream connection confirmed');
                        return;
                    }

                    // Handle actual progress updates
                    if (data.jobId && data.stage) {
                        console.log('📊 Progress update:', data.stage, `${data.percentage}%`);
                        const update = data as ProgressUpdate;
                        setProgress(update);

                        // Check if job is finished
                        if (update.status === 'completed') {
                            console.log('✅ Job completed successfully');
                            isJobFinishedRef.current = true;
                            if (onComplete) {
                                onComplete(update);
                            }
                        }

                        if (update.status === 'error') {
                            console.log('❌ Job failed with error');
                            isJobFinishedRef.current = true;
                            if (onError) {
                                onError(update);
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing progress update:', parseError);
                }
            };

            eventSource.onerror = (error) => {
                console.log('❌ EventSource error, readyState:', eventSource.readyState);
                setIsConnected(false);

                // Only set error and attempt reconnection if job isn't finished
                if (isJobFinishedRef.current) {
                    console.log('✅ Job finished, ignoring EventSource error');
                } else {
                    setHasError(true);
                    setConnectionAttempts((prev) => prev + 1);

                    // Only auto-reconnect if we haven't exceeded max attempts
                    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS - 1) {
                        console.log(
                            `🔄 Will retry connection in ${RECONNECT_DELAY}ms (attempt ${connectionAttempts + 2}/${MAX_RECONNECT_ATTEMPTS})`,
                        );

                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (jobId && !eventSourceRef.current && !isJobFinishedRef.current) {
                                connect();
                            }
                        }, RECONNECT_DELAY);
                    } else {
                        console.log('🚨 Max reconnection attempts will be reached, stopping auto-reconnect');
                    }
                }
            };
        } catch (error) {
            console.error('❌ Error creating EventSource:', error);
            setHasError(true);
            setConnectionAttempts((prev) => prev + 1);
        }
    }, [jobId, onComplete, onError, cleanup, connectionAttempts]);

    const reconnect = useCallback(() => {
        console.log('🔄 Manual reconnection requested');
        setConnectionAttempts(0); // Reset attempts for manual reconnection
        isJobFinishedRef.current = false; // Reset finished state
        connect();
    }, [connect]);

    // Connect when jobId changes
    useEffect(() => {
        if (jobId) {
            console.log('🔍 Setting up connection for new jobId:', jobId);
            isJobFinishedRef.current = false; // Reset finished state for new job
            setConnectionAttempts(0); // Reset attempts for new job

            // Call connect directly to avoid dependency issues
            const eventSource = new EventSource(`/admin-progress/${jobId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('✅ EventSource connected successfully');
                setIsConnected(true);
                setHasError(false);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'connection') {
                        console.log('✅ Progress stream connection confirmed');
                        return;
                    }

                    if (data.jobId && data.stage) {
                        console.log('📊 Progress update:', data.stage, `${data.percentage}%`);
                        const update = data as ProgressUpdate;
                        setProgress(update);

                        if (update.status === 'completed') {
                            console.log('✅ Job completed successfully');
                            isJobFinishedRef.current = true;
                            if (onComplete) {
                                onComplete(update);
                            }
                        }

                        if (update.status === 'error') {
                            console.log('❌ Job failed with error');
                            isJobFinishedRef.current = true;
                            if (onError) {
                                onError(update);
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing progress update:', parseError);
                }
            };

            eventSource.onerror = (error) => {
                console.log('❌ EventSource error, readyState:', eventSource.readyState);
                setIsConnected(false);
                setHasError(true);
                // DO NOT auto-reconnect to prevent loops
            };
        } else {
            console.log('🔍 No jobId, cleaning up');
            cleanup();
            setProgress(null);
            isJobFinishedRef.current = false;
        }

        return cleanup;
    }, [jobId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('🔍 useProgressTracker unmounting, cleaning up');
            cleanup();
        };
    }, [cleanup]);

    return {
        progress,
        isConnected,
        hasError,
        reconnect,
    };
}
