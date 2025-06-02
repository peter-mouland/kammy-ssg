// app/routes/draft.tsx
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useFetcher, useSearchParams, useNavigation, useActionData, useRevalidator } from "react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { requestFormData } from '../lib/form-data';
import type { DraftPickData, DraftOrderData, DraftStateData, FplPlayerData, UserTeamData, DivisionData } from '../types';

// Components
import { DraftBoard } from '../components/draft-board';
import { DraftOrder } from '../components/draft-order';
import { TeamDraft } from '../components/draft-team';
import { DraftPlayersAvailable } from '../components/draft-players-availablle';
import { Timer } from '../components/timer';
import { SelectUser } from '../components/select-user';
import { PageHeader } from '../components/page-header';

export const meta: MetaFunction = () => {
    return [
        { title: "Live Draft - Fantasy Football Draft" },
        { name: "description", content: "Live fantasy football draft interface" },
    ];
};

interface LoaderData {
    draftState: DraftStateData | null;
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
    availablePlayers: FplPlayerData[];
    currentUser: string;
    isUserTurn: boolean;
    divisions: DivisionData[];
    userTeams: UserTeamData[];
    selectedDivision: string;
    selectedUser: string;
    draftSequence: any[];
}

interface ActionData {
    success?: boolean;
    error?: string;
    pick?: DraftPickData;
}

interface OptimisticPick extends DraftPickData {
    isOptimistic?: boolean;
    timestamp?: number;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const { loadDraftData } = await import('./server/draft.server');
        const url = new URL(request.url);
        const loaderData = await loadDraftData(url);
        return data<LoaderData>(loaderData);
    } catch (error) {
        console.error("Draft loader error:", error);
        throw new Response("Failed to load draft data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get("actionType");

        switch (actionType) {
            case "makePick": {
                const { makeDraftPick } = await import('./server/draft.server');
                const result = await makeDraftPick(formData);
                return data<ActionData>(result);
            }
            default:
                return data<ActionData>({ error: "Invalid action type" });
        }
    } catch (error) {
        console.error("Draft action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform draft action"
        });
    }
}

// Custom hook for optimistic updates
function useOptimisticPicks(initialPicks: DraftPickData[]) {
    const [optimisticPicks, setOptimisticPicks] = useState<OptimisticPick[]>([]);
    const lastActionData = useRef<ActionData | undefined>();
    const actionData = useActionData<typeof action>();

    // Clear optimistic picks when real data comes back
    useEffect(() => {
        if (actionData !== lastActionData.current) {
            lastActionData.current = actionData;

            if (actionData?.success) {
                // Clear optimistic picks on success
                setOptimisticPicks([]);
            } else if (actionData?.error) {
                // Remove failed optimistic picks after a delay
                setTimeout(() => {
                    setOptimisticPicks(prev => prev.filter(pick =>
                        !pick.isOptimistic ||
                        (pick.timestamp && Date.now() - pick.timestamp < 5000)
                    ));
                }, 1000);
            }
        }
    }, [actionData]);

    // Clean up old optimistic picks
    useEffect(() => {
        const cleanup = setInterval(() => {
            setOptimisticPicks(prev => prev.filter(pick =>
                !pick.isOptimistic ||
                !pick.timestamp ||
                Date.now() - pick.timestamp < 10000 // 10 second timeout
            ));
        }, 5000);

        return () => clearInterval(cleanup);
    }, []);

    const addOptimisticPick = (pick: OptimisticPick) => {
        const optimisticPick: OptimisticPick = {
            ...pick,
            isOptimistic: true,
            timestamp: Date.now()
        };
        setOptimisticPicks(prev => [...prev, optimisticPick]);
    };

    const allPicks = useMemo(() => {
        const realPicks = initialPicks.map(pick => ({ ...pick, isOptimistic: false }));
        const validOptimisticPicks = optimisticPicks.filter(pick =>
            !realPicks.some(realPick =>
                realPick.playerId === pick.playerId &&
                realPick.divisionId === pick.divisionId
            )
        );

        return [...realPicks, ...validOptimisticPicks].sort((a, b) => a.pickNumber - b.pickNumber);
    }, [initialPicks, optimisticPicks]);

    return {
        optimisticPicks: allPicks,
        addOptimisticPick,
        hasOptimisticPicks: optimisticPicks.length > 0
    };
}

// Optimized polling hook
function useOptimizedDraftPolling(
    draftState: DraftStateData | null,
    selectedDivision: string,
    currentPickCount: number,
    isPending: boolean,
    revalidator: any
) {
    const [isPolling, setIsPolling] = useState(false);
    const [lastPollTime, setLastPollTime] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout>();
    const backoffRef = useRef(1); // For exponential backoff on errors

    useEffect(() => {
        // Only poll during active drafts
        if (!draftState?.isActive || !selectedDivision) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
            return;
        }

        const pollForUpdates = async () => {
            if (isPending || isPolling) return;

            setIsPolling(true);
            const pollStartTime = Date.now();

            try {
                // Minimal API call with current state
                const response = await fetch(
                    `/api/draft/poll?division=${selectedDivision}&pickCount=${currentPickCount}`,
                    {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        // Add cache control to ensure fresh data
                        cache: 'no-cache'
                    }
                );

                if (!response.ok) {
                    throw new Error(`Poll failed: ${response.status}`);
                }

                const pollData = await response.json();

                // Only trigger full revalidation if there are actual updates
                if (pollData.hasUpdates && pollData.newPicksCount > 0) {
                    console.log(`🔄 Draft updates detected: ${pollData.newPicksCount} new picks`);
                    revalidator.revalidate();

                    // Reset backoff on successful update detection
                    backoffRef.current = 1;
                } else {
                    // Successful poll with no updates - this is normal
                    backoffRef.current = Math.max(1, backoffRef.current * 0.9); // Slowly reduce backoff
                }

                setLastPollTime(pollStartTime);

            } catch (error) {
                console.error('Draft polling error:', error);

                // Exponential backoff for errors (max 30 seconds)
                backoffRef.current = Math.min(6, backoffRef.current * 1.5);

                // Fallback: full revalidation every 30 seconds on repeated errors
                const timeSinceLastPoll = Date.now() - lastPollTime;
                if (timeSinceLastPoll > 30000) {
                    console.log('🔄 Fallback revalidation after polling errors');
                    revalidator.revalidate();
                    setLastPollTime(Date.now());
                }
            } finally {
                setIsPolling(false);
            }
        };

        // Start polling with adaptive interval
        const baseInterval = 5000; // 5 seconds base
        const adaptiveInterval = baseInterval * backoffRef.current;

        intervalRef.current = setInterval(pollForUpdates, adaptiveInterval);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
        };
    }, [
        draftState?.isActive,
        selectedDivision,
        currentPickCount,
        isPending,
        isPolling,
        revalidator
    ]);

    return { isPolling, lastPollTime };
}

// Loading spinner component
function LoadingSpinner({ size = "medium", message }: { size?: "small" | "medium" | "large"; message?: string }) {
    const sizeMap = {
        small: { width: "1rem", height: "1rem" },
        medium: { width: "2rem", height: "2rem" },
        large: { width: "3rem", height: "3rem" }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
        }}>
            <div
                style={{
                    ...sizeMap[size],
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}
            />
            {message && (
                <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    textAlign: 'center'
                }}>
                    {message}
                </div>
            )}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// Toast notification component
function Toast({ message, type, onDismiss }: {
    message: string;
    type: 'success' | 'error' | 'info';
    onDismiss: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const colors = {
        success: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
        error: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
        info: { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            backgroundColor: colors[type].bg,
            border: `1px solid ${colors[type].border}`,
            color: colors[type].text,
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxWidth: '20rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <span style={{ fontSize: '0.875rem' }}>{message}</span>
            <button
                onClick={onDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    color: colors[type].text,
                    cursor: 'pointer',
                    marginLeft: '0.5rem',
                    fontSize: '1.25rem'
                }}
            >
                ×
            </button>
        </div>
    );
}

export default function Draft() {
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const fetcher = useFetcher<ActionData>();
    const revalidator = useRevalidator();
    const [searchParams, setSearchParams] = useSearchParams();

    // Local state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [lastKnownPickCount, setLastKnownPickCount] = useState<number>(0);
    const [lastProcessedPickIds, setLastProcessedPickIds] = useState<Set<string>>(new Set());

    // Optimistic updates
    const { optimisticPicks, addOptimisticPick, hasOptimisticPicks } = useOptimisticPicks(loaderData.draftPicks);

    // Loading states
    const isInitialLoading = navigation.state === "loading" && navigation.location?.pathname === "/draft";
    const isNavigating = navigation.state === "loading" && navigation.location?.pathname !== "/draft";
    const isSubmitting = fetcher.state === "submitting";
    const isPending = navigation.state !== "idle" || fetcher.state !== "idle";

    // Optimized polling
    const { isPolling } = useOptimizedDraftPolling(
        loaderData.draftState,
        loaderData.selectedDivision,
        loaderData.draftPicks.length,
        isPending,
        revalidator
    );

    const isRevalidating = revalidator.state === "loading" || isPolling;

    // Handle action responses
    useEffect(() => {
        if (actionData?.success && actionData.pick) {
            setToast({
                message: `${actionData.pick.playerName} drafted successfully!`,
                type: 'success'
            });
        } else if (actionData?.error) {
            setToast({
                message: actionData.error,
                type: 'error'
            });
        }
    }, [actionData]);

    // Handle fetcher responses
    useEffect(() => {
        if (fetcher.data?.success && fetcher.data.pick) {
            setToast({
                message: `${fetcher.data.pick.playerName} drafted successfully!`,
                type: 'success'
            });
        } else if (fetcher.data?.error) {
            setToast({
                message: fetcher.data.error,
                type: 'error'
            });
        }
    }, [fetcher.data]);

    // Detect new picks from other users
    useEffect(() => {
        // Initialize on first load
        if (lastKnownPickCount === 0) {
            setLastKnownPickCount(loaderData.draftPicks.length);
            setLastProcessedPickIds(new Set(loaderData.draftPicks.map(pick =>
                `${pick.divisionId}-${pick.pickNumber}-${pick.playerId}`
            )));
            return;
        }

        // Check for new picks
        if (loaderData.draftPicks.length > lastKnownPickCount) {
            const newPicks = loaderData.draftPicks.slice(lastKnownPickCount);

            newPicks.forEach(pick => {
                const pickId = `${pick.divisionId}-${pick.pickNumber}-${pick.playerId}`;

                // Only show toast for picks from other users that we haven't processed yet
                if (pick.userId !== loaderData.currentUser && !lastProcessedPickIds.has(pickId)) {
                    // Find the user name from userTeams
                    const userName = loaderData.userTeams.find(team => team.userId === pick.userId)?.userName || 'Someone';

                    setToast({
                        message: `${userName} picked ${pick.playerName}`,
                        type: 'info'
                    });
                }
            });

            // Update tracking state
            setLastKnownPickCount(loaderData.draftPicks.length);
            setLastProcessedPickIds(new Set(loaderData.draftPicks.map(pick =>
                `${pick.divisionId}-${pick.pickNumber}-${pick.playerId}`
            )));
        }
    }, [loaderData.draftPicks, loaderData.currentUser, loaderData.userTeams, lastKnownPickCount, lastProcessedPickIds]);

    const handleUserChange = (userId: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("user", userId);
            return newParams;
        });
    };

    const handleMakePick = (playerId: string) => {
        if (!loaderData.currentUser || !loaderData.selectedDivision || isSubmitting) {
            return;
        }

        const selectedPlayer = loaderData.availablePlayers.find(p => p.id.toString() === playerId);
        if (!selectedPlayer) {
            setToast({
                message: "Player not found",
                type: 'error'
            });
            return;
        }

        // Create optimistic pick
        const optimisticPick: OptimisticPick = {
            pickNumber: optimisticPicks.length + 1,
            round: Math.ceil((optimisticPicks.length + 1) / loaderData.draftOrder.length),
            userId: loaderData.currentUser,
            playerId,
            playerName: selectedPlayer.web_name || `${selectedPlayer.first_name} ${selectedPlayer.second_name}`,
            team: `Team ${selectedPlayer.team}`,
            position: selectedPlayer.position?.toString(),
            price: selectedPlayer.now_cost / 10,
            pickedAt: new Date(),
            divisionId: loaderData.selectedDivision
        };

        // Add optimistic update
        addOptimisticPick(optimisticPick);

        // Submit the actual pick
        fetcher.submit({
            actionType: "makePick",
            playerId,
            userId: loaderData.currentUser,
            divisionId: loaderData.selectedDivision
        }, { method: "post" });
    };

    // Filter out optimistically picked players
    const availablePlayersFiltered = useMemo(() => {
        const pickedPlayerIds = new Set(optimisticPicks.map(pick => pick.playerId));
        return loaderData.availablePlayers.filter(player => !pickedPlayerIds.has(player.id.toString()));
    }, [loaderData.availablePlayers, optimisticPicks]);

    // Show initial loading state
    if (isInitialLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <LoadingSpinner size="large" message="Loading draft room..." />
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <div>Fetching latest draft data</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        This may take a moment...
                    </div>
                </div>
            </div>
        );
    }

    const h1 = loaderData.draftState?.isActive
        ? `🟢 Live ${loaderData.divisions.find(d => d.id === loaderData.draftState?.currentDivisionId)?.label} Draft Room`
        : "⚪️ Draft Room";

    return (
        <div>
            {/* Toast notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => setToast(null)}
                />
            )}

            {/* Loading overlay for actions */}
            {(isPending || hasOptimisticPicks) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    zIndex: 999
                }}>
                    <div style={{
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        animation: 'progress 2s ease-in-out infinite',
                        transformOrigin: 'left'
                    }} />
                    <style>{`
                        @keyframes progress {
                            0% { transform: scaleX(0); }
                            50% { transform: scaleX(0.5); }
                            100% { transform: scaleX(1); }
                        }
                    `}</style>
                </div>
            )}

            <PageHeader
                title={h1}
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isRevalidating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LoadingSpinner size="small" />
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    {isPolling ? 'Checking...' : 'Syncing...'}
                                </span>
                            </div>
                        )}
                        <SelectUser
                            users={loaderData.userTeams}
                            selectedUser={loaderData.selectedUser}
                            handleUserChange={handleUserChange}
                        />
                    </div>
                }
            />

            {/* Your Turn Alert */}
            {loaderData.isUserTurn && (
                <div style={{
                    border: '2px solid #059669',
                    backgroundColor: 'rgb(240, 253, 244)',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#059669'
                    }}>
                        🎯 It's Your Turn!
                    </h3>
                    <Timer />

                    {isSubmitting && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '1rem',
                            transform: 'translateY(-50%)'
                        }}>
                            <LoadingSpinner size="small" message="Making pick..." />
                        </div>
                    )}
                </div>
            )}

            {/* Connection status */}
            {isNavigating && (
                <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fcd34d',
                    color: '#92400e',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem'
                }}>
                    🔄 Navigating to new page...
                </div>
            )}

            {/* Draft interface */}
            {loaderData.draftState?.isActive ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2rem',
                    marginBottom: '2rem'
                }}>
                    {/* Available Players */}
                    <div style={{ position: 'relative' }}>
                        <DraftPlayersAvailable
                            onSelectPlayer={handleMakePick}
                            availablePlayers={availablePlayersFiltered}
                            isUserTurn={loaderData.isUserTurn && !isSubmitting}
                        />

                        {/* Optimistic feedback overlay */}
                        {hasOptimisticPicks && (
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.75rem',
                                zIndex: 10
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <LoadingSpinner size="medium" />
                                    <div style={{
                                        marginTop: '1rem',
                                        color: '#6b7280',
                                        fontWeight: '500'
                                    }}>
                                        Processing your pick...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'grid', gridTemplateRows: '0.7fr 1.3fr', gap: '2rem' }}>
                        {/* Draft Order */}
                        <DraftOrder
                            draftOrder={loaderData.draftOrder}
                            draftPicks={optimisticPicks}
                            draftSequence={loaderData.draftSequence}
                            draftState={loaderData.draftState}
                        />

                        {/* Draft Board */}
                        <DraftBoard draftPicks={optimisticPicks} />
                    </div>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: '#6b7280'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Draft Not Active
                    </h3>
                    <p style={{ fontSize: '1rem', margin: 0 }}>
                        The draft hasn't started yet. Check back soon!
                    </p>
                </div>
            )}

            {/* Team Draft - always visible */}
            <TeamDraft
                draftPicks={optimisticPicks}
                draftOrder={loaderData.draftOrder}
            />

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
                <details style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#6b7280' }}>
                        Debug Info
                    </summary>
                    <pre style={{
                        backgroundColor: '#f3f4f6',
                        padding: '1rem',
                        borderRadius: '0.375rem',
                        overflow: 'auto',
                        marginTop: '0.5rem'
                    }}>
                        {JSON.stringify({
                            isInitialLoading,
                            isNavigating,
                            isSubmitting,
                            isPending,
                            isRevalidating,
                            isPolling,
                            hasOptimisticPicks,
                            optimisticPicksCount: optimisticPicks.filter(p => p.isOptimistic).length,
                            navigationState: navigation.state,
                            fetcherState: fetcher.state,
                            lastActionData: actionData,
                            lastFetcherData: fetcher.data,
                            currentPickCount: loaderData.draftPicks.length
                        }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}
