// app/routes/draft.tsx - Refactored with components and CSS modules
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useFetcher, useSearchParams, useNavigation, useActionData, useRevalidator } from "react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { DraftWithSSE } from '../components/draft-sse-handler';

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

    // Optimistic updates
    const { optimisticPicks, addOptimisticPick, hasOptimisticPicks } = useOptimisticPicks(loaderData.draftPicks);

    // Loading states
    const isInitialLoading = navigation.state === "loading" && navigation.location?.pathname === "/draft";
    const isNavigating = navigation.state === "loading" && navigation.location?.pathname !== "/draft";
    const isSubmitting = fetcher.state === "submitting";
    const isPending = navigation.state !== "idle" || fetcher.state !== "idle";

    // Handle action responses
    useEffect(() => {
        if (actionData?.success && actionData.pick) {
            showToast({
                message: `${actionData.pick.playerName} drafted successfully!`,
                type: 'success'
            });
        } else if (actionData?.error) {
            showToast({
                message: actionData.error,
                type: 'error'
            });
        }
    }, [actionData, showToast]);

    // Handle fetcher responses
    useEffect(() => {
        if (fetcher.data?.success && fetcher.data.pick) {
            showToast({
                message: `${fetcher.data.pick.playerName} drafted successfully!`,
                type: 'success'
            });
        } else if (fetcher.data?.error) {
            showToast({
                message: fetcher.data.error,
                type: 'error'
            });
        }
    }, [fetcher.data, showToast]);

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
            position: selectedPlayer.position?.toString(),
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

            {/* Loading overlay */}
            <LoadingOverlay show={isPending || hasOptimisticPicks} />

            {/* SSE Handler - manages real-time connections */}
            <DraftWithSSE
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
                                    Debug Info (Component Optimized)
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
                                        draftActive: loaderData.draftState?.isActive,
                                        components: 'Modularized with CSS modules'
                                    }, null, 2)}
                                </pre>
                            </details>
                        )}
                    </>
                )}
            </DraftWithSSE>
        </div>
    );
}
