// app/routes/draft.tsx - Refactored with components and CSS modules
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useFetcher, useSearchParams, useNavigation, useActionData, useRevalidator } from "react-router";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as React from "react";
import { requestFormData } from '../lib/form-data';
import type { DraftPickData, DraftOrderData, DraftStateData, FplPlayerData, UserTeamData, DivisionData } from '../types';

// Components
import { DraftBoard } from '../components/draft-board';
import { DraftOrder } from '../components/draft-order';
import { TeamDraft } from '../components/draft-team';
import { DraftPlayersAvailable } from '../components/draft-players-availablle';
import { SelectUser } from '../components/select-user';
import { PageHeader } from '../components/page-header';

// New modular components
import { ToastManager, useToast } from '../components/toast-manager';
import { ConnectionStatus, ConnectionAlert } from '../components/connection-status';
import { LoadingOverlay, LoadingSpinner, TurnAlert } from '../components/loading-overlay';
import { DraftWithFirebase } from '../components/draft-firebase-handler';
import { DraftConfetti } from '../components/draft-confetti';

// Audio imports
import {
    playCelebrationSound,
    playPickSuccessSound,
    playErrorSound,
    playYourTurnSound
} from '../lib/audio/celebration-sounds';

// Hooks
import { useOptimisticPicks } from '../lib/draft/use-optimistic-picks';

// Styles
import styles from './draft.module.css';

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
    action?: string;
    removedCount?: number;
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
            case "removeLastPick": {
                const { removeLastDraftPick } = await import('./server/draft.server');
                const result = await removeLastDraftPick(formData);
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

// Memoized components to prevent unnecessary rerenders
const MemoizedDraftBoard = React.memo(DraftBoard);
const MemoizedDraftOrder = React.memo(DraftOrder);
const MemoizedTeamDraft = React.memo(TeamDraft);
const MemoizedDraftPlayersAvailable = React.memo(DraftPlayersAvailable);

export default function Draft() {
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const fetcher = useFetcher<ActionData>();
    const revalidator = useRevalidator();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();

    // Track previous pick count to detect new picks from Firebase
    const previousPickCountRef = useRef(loaderData.draftPicks.length);
    const [lastProcessedPick, setLastProcessedPick] = useState<DraftPickData | null>(null);

    // Track turn changes to show "It's your turn" toast
    const previousIsUserTurnRef = useRef(loaderData.isUserTurn);

    // Track draft completion for celebration
    const [showDraftCompleteConfetti, setShowDraftCompleteConfetti] = useState(false);
    const previousDraftCompleteRef = useRef(false);

    // Track remove pick attempts for progressive removal
    const [removePickCount, setRemovePickCount] = useState(0);
    const removePickTimeoutRef = useRef<NodeJS.Timeout>();

    // Optimistic updates
    const { optimisticPicks, addOptimisticPick, hasOptimisticPicks } = useOptimisticPicks(loaderData.draftPicks);

    // Loading states
    const isInitialLoading = navigation.state === "loading" && navigation.location?.pathname === "/draft";
    const isNavigating = navigation.state === "loading" && navigation.location?.pathname !== "/draft";
    const isSubmitting = fetcher.state === "submitting";
    const isPending = navigation.state !== "idle" || fetcher.state !== "idle";

    // Handle new picks from Firebase (when data revalidates)
    useEffect(() => {
        const currentPickCount = loaderData.draftPicks.length;
        const previousPickCount = previousPickCountRef.current;

        // If we have new picks (and it's not the initial load)
        if (currentPickCount > previousPickCount && previousPickCount > 0) {
            // Get the latest pick(s)
            const newPicks = loaderData.draftPicks.slice(previousPickCount);

            newPicks.forEach(pick => {
                // Don't show toast for your own picks (those are handled by action/fetcher responses)
                if (pick.userId !== loaderData.currentUser) {
                    // Find the user who made the pick
                    const userTeam = loaderData.userTeams.find(team => team.userId === pick.userId);
                    const userName = userTeam?.teamName || `User ${pick.userId}`;

                    showToast({
                        message: `${userName} drafted ${pick.playerName}`,
                        type: 'info',
                        duration: 4000
                    });
                }
            });
        }

        // Update the ref for next comparison
        previousPickCountRef.current = currentPickCount;
    }, [loaderData.draftPicks, loaderData.currentUser, loaderData.userTeams, showToast]);

    // Handle turn changes - show "It's your turn" toast
    useEffect(() => {
        const currentIsUserTurn = loaderData.isUserTurn;
        const previousIsUserTurn = previousIsUserTurnRef.current;

        // If it just became the user's turn (and draft is active)
        if (currentIsUserTurn && !previousIsUserTurn && loaderData.draftState?.isActive) {
            showToast({
                message: "🎯 It's your turn to pick!",
                type: 'warning',
                duration: 6000 // Longer duration for turn notifications
            });

            // Play your turn sound
            setTimeout(() => {
                playYourTurnSound();
            }, 100);
        }

        // Update the ref for next comparison
        previousIsUserTurnRef.current = currentIsUserTurn;
    }, [loaderData.isUserTurn, loaderData.draftState?.isActive, showToast]);

    // Handle draft completion detection
    useEffect(() => {
        if (!loaderData.draftState?.isActive) {
            previousDraftCompleteRef.current = false;
            return;
        }

        // Calculate if draft is complete
        const totalPossiblePicks = loaderData.draftOrder.length * (loaderData.draftState.picksPerTeam || 15);
        const currentDraftComplete = optimisticPicks.length >= totalPossiblePicks;
        const previousDraftComplete = previousDraftCompleteRef.current;

        // If draft just completed
        if (currentDraftComplete && !previousDraftComplete && optimisticPicks.length > 0) {
            setShowDraftCompleteConfetti(true);

            showToast({
                message: "🎉 DRAFT COMPLETE! All picks are in! Good luck this season! 🏆",
                type: 'success',
                duration: 8000
            });

            // Note: Celebration sound will be played by the confetti component
        }

        previousDraftCompleteRef.current = currentDraftComplete;
    }, [optimisticPicks.length, loaderData.draftOrder.length, loaderData.draftState, showToast]);

    // Handle action responses (your own picks and removals)
    useEffect(() => {
        if (actionData?.success && actionData.pick) {
            showToast({
                message: `${actionData.pick.playerName} drafted successfully!`,
                type: 'success'
            });

            // Play success sound for your own picks
            setTimeout(() => {
                playPickSuccessSound();
            }, 100);
        } else if (actionData?.error) {
            showToast({
                message: actionData.error,
                type: 'error'
            });

            // Play error sound
            setTimeout(() => {
                playErrorSound();
            }, 100);
        }
    }, [actionData, showToast]);

    // Handle fetcher responses (your own picks and removals)
    useEffect(() => {
        if (fetcher.data?.success && fetcher.data.pick) {
            showToast({
                message: `${fetcher.data.pick.playerName} drafted successfully!`,
                type: 'success'
            });

            // Play success sound for your own picks
            setTimeout(() => {
                playPickSuccessSound();
            }, 100);
        } else if (fetcher.data?.success && fetcher.data.action === 'removeLastPick') {
            const removedCount = fetcher.data.removedCount || 1;
            const totalClicks = removePickCount + 1;
            showToast({
                message: `✅ Removed 1 pick (${totalClicks} ${totalClicks === 1 ? 'removal' : 'removals'} total)`,
                type: 'success'
            });
            // Don't reset the counter here - let it continue to track total removals
        } else if (fetcher.data?.error) {
            showToast({
                message: fetcher.data.error,
                type: 'error'
            });

            // Play error sound
            setTimeout(() => {
                playErrorSound();
            }, 100);

            // Reset remove counter on error
            setRemovePickCount(0);
        }
    }, [fetcher.data, showToast, removePickCount]);

    const handleUserChange = useCallback((userId: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("user", userId);
            return newParams;
        });
    }, [setSearchParams]);

    const handleMakePick = useCallback((playerId: string) => {
        if (!loaderData.currentUser || !loaderData.selectedDivision || isSubmitting) {
            return;
        }

        const selectedPlayer = loaderData.availablePlayers.find(p => p.id.toString() === playerId);
        if (!selectedPlayer) {
            showToast({
                message: "Player not found",
                type: 'error'
            });
            return;
        }

        // Create optimistic pick
        const optimisticPick = {
            pickNumber: optimisticPicks.length + 1,
            round: Math.ceil((optimisticPicks.length + 1) / loaderData.draftOrder.length),
            userId: loaderData.currentUser,
            playerId,
            playerName: selectedPlayer.web_name || `${selectedPlayer.first_name} ${selectedPlayer.second_name}`,
            team: `Team ${selectedPlayer.team}`,
            position: selectedPlayer.draft.position,
            price: selectedPlayer.now_cost / 10,
            pickedAt: new Date(),
            divisionId: loaderData.selectedDivision
        };

        addOptimisticPick(optimisticPick);

        fetcher.submit({
            actionType: "makePick",
            playerId,
            userId: loaderData.currentUser,
            divisionId: loaderData.selectedDivision
        }, { method: "post" });
    }, [
        loaderData.currentUser,
        loaderData.selectedDivision,
        loaderData.availablePlayers,
        loaderData.draftOrder.length,
        isSubmitting,
        optimisticPicks.length,
        addOptimisticPick,
        fetcher,
        showToast
    ]);

    const handleRemoveLastPick = useCallback(() => {
        if (!loaderData.selectedDivision || isSubmitting || optimisticPicks.length === 0) {
            return;
        }

        // Increment remove count for UI display
        const newCount = removePickCount + 1;
        setRemovePickCount(newCount);

        // Clear existing timeout
        if (removePickTimeoutRef.current) {
            clearTimeout(removePickTimeoutRef.current);
        }

        // Show progressive toast - but always remove only 1 pick
        showToast({
            message: `Removing 1 pick... (${newCount} ${newCount === 1 ? 'click' : 'clicks'} total)`,
            type: 'warning',
            duration: 3000
        });

        // Set timeout to reset count if no more clicks
        removePickTimeoutRef.current = setTimeout(() => {
            setRemovePickCount(0);
        }, 3000);

        // Submit removal request - ALWAYS remove only 1 pick per click
        fetcher.submit({
            actionType: "removeLastPick",
            divisionId: loaderData.selectedDivision,
            removeCount: "1" // Always remove just 1 pick per click
        }, { method: "post" });
    }, [
        loaderData.selectedDivision,
        isSubmitting,
        optimisticPicks.length,
        removePickCount,
        fetcher,
        showToast
    ]);

    // Memoized filtered players
    const availablePlayersFiltered = useMemo(() => {
        const pickedPlayerIds = new Set(optimisticPicks.map(pick => pick.playerId));
        return loaderData.availablePlayers.filter(player => !pickedPlayerIds.has(player.id.toString()));
    }, [loaderData.availablePlayers, optimisticPicks]);

    // Show initial loading state
    if (isInitialLoading) {
        return (
            <div className={styles.initialLoading}>
                <LoadingSpinner size="large" message="Loading draft room..." />
                <div className={styles.loadingDetails}>
                    <div>Fetching latest draft data</div>
                    <div className={styles.loadingSubtext}>
                        This may take a moment...
                    </div>
                </div>
            </div>
        );
    }

    const title = loaderData.draftState?.isActive
        ? `🟢 Live ${loaderData.divisions.find(d => d.id === loaderData.draftState?.currentDivisionId)?.label} Draft Room`
        : "⚪️ Draft Room";

    return (
        <div className={styles.draftContainer}>
            {/* Toast Manager - handles all notifications */}
            <ToastManager maxToasts={3} />

            {/* Draft Complete Confetti */}
            <DraftConfetti
                show={showDraftCompleteConfetti}
                onComplete={() => setShowDraftCompleteConfetti(false)}
                duration={5000}
            />

            {/* Loading overlay */}
            <LoadingOverlay show={isPending || hasOptimisticPicks} />

            {/* Firebase Handler - manages real-time connections */}
            <DraftWithFirebase
                divisionId={loaderData.selectedDivision}
                currentUserId={loaderData.currentUser}
                isDraftActive={loaderData.draftState?.isActive || false}
            >
                {({ connectionState, isConnected, hasError, reconnect }) => (
                    <>
                        {/* Header with connection status */}
                        <PageHeader
                            title={title}
                            actions={
                                <div className={styles.headerActions}>
                                    <ConnectionStatus
                                        connectionState={connectionState}
                                        isRevalidating={revalidator.state === "loading"}
                                        onReconnect={reconnect}
                                    />
                                    <SelectUser
                                        users={loaderData.userTeams}
                                        selectedUser={loaderData.selectedUser}
                                        handleUserChange={handleUserChange}
                                    />

                                    {/* Remove Last Pick Button - Admin/Debug Feature */}
                                    {(process.env.NODE_ENV === 'development' || loaderData.currentUser === 'admin') && optimisticPicks.length > 0 && (
                                        <button
                                            onClick={handleRemoveLastPick}
                                            disabled={isSubmitting}
                                            className={styles.removePickButton}
                                            title={`Remove 1 pick (clicked ${removePickCount + 1} ${removePickCount === 0 ? 'time' : 'times'})`}
                                        >
                                            🗑️ Remove Last Pick
                                            {removePickCount > 0 && (
                                                <span className={styles.removeCount}>×{removePickCount + 1}</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            }
                        />

                        {/* Turn Alert */}
                        <TurnAlert
                            isUserTurn={loaderData.isUserTurn}
                            isSubmitting={isSubmitting}
                        />

                        {/* Connection Alert */}
                        <ConnectionAlert
                            isConnected={isConnected}
                            isDraftActive={loaderData.draftState?.isActive || false}
                            onReconnect={reconnect}
                        />

                        {/* Navigation Alert */}
                        {isNavigating && (
                            <div className={styles.navigationAlert}>
                                🔄 Navigating to new page...
                            </div>
                        )}

                        {/* Main Draft Interface */}
                        {loaderData.draftState?.isActive ? (
                            <div className={styles.draftInterface}>
                                {/* Available Players */}
                                <div className={styles.playersSection}>
                                    <MemoizedDraftPlayersAvailable
                                        onSelectPlayer={handleMakePick}
                                        availablePlayers={availablePlayersFiltered}
                                        isUserTurn={loaderData.isUserTurn && !isSubmitting}
                                    />

                                    {/* Optimistic feedback overlay */}
                                    {hasOptimisticPicks && (
                                        <div className={styles.optimisticOverlay}>
                                            <div className={styles.optimisticContent}>
                                                <LoadingSpinner size="medium" />
                                                <div className={styles.optimisticMessage}>
                                                    Processing your pick...
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className={styles.rightColumn}>
                                    {/* Draft Order */}
                                    <MemoizedDraftOrder
                                        draftOrder={loaderData.draftOrder}
                                        draftPicks={optimisticPicks}
                                        draftSequence={loaderData.draftSequence}
                                        draftState={loaderData.draftState}
                                    />

                                    {/* Draft Board */}
                                    <MemoizedDraftBoard draftPicks={optimisticPicks} />
                                </div>
                            </div>
                        ) : (
                            <div className={styles.draftInactive}>
                                <div className={styles.inactiveIcon}>⏳</div>
                                <h3 className={styles.inactiveTitle}>
                                    Draft Not Active
                                </h3>
                                <p className={styles.inactiveMessage}>
                                    The draft hasn't started yet. Check back soon!
                                </p>
                            </div>
                        )}

                        {/* Team Draft - always visible */}
                        <MemoizedTeamDraft
                            draftPicks={optimisticPicks}
                            draftOrder={loaderData.draftOrder}
                        />

                        {/* Debug info in development */}
                        {process.env.NODE_ENV === 'development' && (
                            <details className={styles.debugInfo}>
                                <summary className={styles.debugSummary}>
                                    Debug Info (Complete Audio Integration)
                                </summary>
                                <pre className={styles.debugContent}>
                                    {JSON.stringify({
                                        isInitialLoading,
                                        isNavigating,
                                        isSubmitting,
                                        isPending,
                                        connectionState,
                                        isConnected,
                                        hasError,
                                        hasOptimisticPicks,
                                        optimisticPicksCount: optimisticPicks.filter(p => p.isOptimistic).length,
                                        navigationState: navigation.state,
                                        fetcherState: fetcher.state,
                                        currentPickCount: loaderData.draftPicks.length,
                                        previousPickCount: previousPickCountRef.current,
                                        removePickCount: removePickCount,
                                        draftActive: loaderData.draftState?.isActive,
                                        components: 'Firebase toast integration + turn notifications + remove last pick + audio'
                                    }, null, 2)}
                                </pre>
                            </details>
                        )}
                    </>
                )}
            </DraftWithFirebase>
        </div>
    );
}
