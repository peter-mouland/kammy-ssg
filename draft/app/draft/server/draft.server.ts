/* Location: app/draft/server/draft.server.ts */

import {
    readDraftState,
    addDraftPick,
    getDraftPicksByDivision,
    updateDraftState,
} from '../../_shared/lib/sheets/draft';
import { cacheInvalidation } from '../../_shared/lib/sheets/cache/cached-sheet-functions';
import { getDraftOrderByDivision } from '../../_shared/lib/sheets/draft-order';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import { getNextDraftState } from '../lib/get-next-draft-state';
import { generateDraftSequence } from '../lib/generate-draft-sequence';
import type { DraftPickData, DraftOrderData, DraftLoaderData } from '../types/draft-types';

import { FirebaseDraftSync } from '../../_shared/lib/firestore-cache/firebase-draft-sync';
import type { DivisionId } from '../../teams/types/team-types';

export async function loadDraftData(url: URL): Promise<DraftLoaderData> {
    const selectedUser = url.searchParams.get('user') || '';
    const search = url.searchParams.get('search') || '';
    const position = url.searchParams.get('position') || '';

    // Fetch all required data
    const [draftState, divisions, userTeams, allPlayers, teams] = await Promise.all([
        readDraftState(),
        readDivisions(),
        readUserTeams(),
        fplApiCache.getFplPlayers(),
        fplApiCache.getFplTeams(),
    ]);

    const divisionId: DivisionId = draftState?.currentDivisionId || divisions[0]?.id || '';

    let draftPicks: DraftPickData[] = [];
    let draftOrder: DraftOrderData[] = [];
    let draftSequence: any[] = [];

    if (divisionId) {
        [draftPicks, draftOrder] = await Promise.all([
            getDraftPicksByDivision(divisionId),
            getDraftOrderByDivision(divisionId),
        ]);

        if (draftOrder.length > 0 && draftState) {
            draftSequence = generateDraftSequence(draftOrder, draftState.picksPerTeam);
        }
    }

    // Filter available players
    const draftedPlayerIds = new Set(draftPicks.map((pick) => pick.playerId));
    let availablePlayers = allPlayers.filter((player) => !draftedPlayerIds.has(player.id.toString()));

    // Apply filters
    if (search) {
        const searchResults = await fplApiCache.searchPlayersByName(search);
        const searchIds = new Set(searchResults.map((p) => p.id));
        availablePlayers = availablePlayers.filter((p) => searchIds.has(p.id));
    }

    if (position) {
        availablePlayers = availablePlayers.filter((p) => p.draft.position === position);
    }

    availablePlayers.sort((a, b) => b.draft.pointsTotal - a.draft.pointsTotal);

    const currentUser = selectedUser || userTeams.find((team) => team.divisionId === divisionId)?.userId || '';
    const isUserTurn = !!(
        draftState?.isActive &&
        draftState.currentDivisionId === divisionId &&
        draftState.currentUserId === currentUser
    );

    return {
        draftState,
        draftPicks,
        draftOrder,
        availablePlayers: availablePlayers,
        currentUser,
        isUserTurn,
        divisions,
        userTeams: userTeams.filter((team) => team.divisionId === divisionId),
        selectedDivision: divisionId,
        selectedUser: currentUser,
        draftSequence,
        teams,
        filters: {
            selectedUser,
            search,
            position,
        },
    };
}

export async function makeDraftPick(formData: FormData | URLSearchParams) {
    console.log('🎯 Making draft pick...');

    const divisionId = formData.get('divisionId')?.toString() as DivisionId;
    const playerId = formData.get('playerId')?.toString();
    const userId = formData.get('userId')?.toString();

    if (!playerId || !userId || !divisionId) {
        throw new Error('Missing required fields for draft pick');
    }

    const draftState = await readDraftState();

    try {
        // Get current draft state
        if (!draftState?.isActive) {
            throw new Error('Draft is not currently active');
        }

        if (draftState.currentUserId !== userId) {
            throw new Error(`It's not your turn to pick: ${userId} != ${draftState.currentUserId}`);
        }

        if (!divisionId) {
            throw new Error('No active division found');
        }

        // Check if player is already drafted
        const existingPicks = await getDraftPicksByDivision(divisionId);
        const isPlayerDrafted = existingPicks.some((pick) => pick.playerId === playerId);
        if (isPlayerDrafted) {
            throw new Error('Player has already been drafted');
        }

        // Get player and team data for the pick
        const [allPlayers, teams] = await Promise.all([fplApiCache.getFplPlayers(), fplApiCache.getFplTeams()]);

        const player = allPlayers.find((p) => p.id.toString() === playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        const team = teams.find((t) => t.code === player.team_code);
        if (!team) {
            throw new Error('Team not found for player');
        }

        // Create draft pick record
        const draftPick: DraftPickData = {
            pickNumber: draftState.currentPick,
            round: Math.ceil(draftState.currentPick / 10), // Assuming 10 teams per round
            userId,
            playerId,
            playerName: player.web_name,
            teamCode: player.team_code,
            teamName: team.name,
            position: player.draft?.position || 'unknown',
            pickedAt: new Date(),
            divisionId,
        };

        // Add pick to sheets
        await addDraftPick(draftPick);

        // Get updated draft order and state
        const draftOrder = await getDraftOrderByDivision(divisionId);
        const nextState = getNextDraftState(draftState, draftOrder);
        // Update draft state
        await updateDraftState(nextState);

        // IMPORTANT: Invalidate cache after making changes
        cacheInvalidation.invalidateDraftData(divisionId);

        // Auto-commit teams to Firestore if draft just completed
        if (draftState.isActive && !nextState.isActive && nextState.completedAt) {
            console.log(`🎉 Draft completed! Auto-committing teams for division: ${divisionId}`);

            // Import and run auto-commit (don't await to avoid blocking the pick response)
            import('./auto-commit.server')
                .then(async ({ autoCommitTeamsToFirestore }) => {
                    const commitResult = await autoCommitTeamsToFirestore(divisionId);

                    if (commitResult.success) {
                        // Broadcast successful auto-commit event
                        try {
                            await FirebaseDraftSync.broadcastDraftEvent(divisionId, {
                                type: 'draft-ended',
                                data: {
                                    message: 'Draft completed! Teams have been automatically committed to Firestore.',
                                    completedAt: nextState.completedAt,
                                    totalPicks: existingPicks.length + 1,
                                    autoCommitted: true,
                                    commitResult: commitResult.message,
                                },
                            });
                        } catch (broadcastError) {
                            console.warn('Failed to broadcast auto-commit success:', broadcastError);
                        }
                    } else {
                        // Broadcast auto-commit failure (teams can still be committed manually)
                        try {
                            await FirebaseDraftSync.broadcastDraftEvent(divisionId, {
                                type: 'draft-ended',
                                data: {
                                    message:
                                        'Draft completed! Auto-commit failed - please commit teams manually from the admin panel.',
                                    completedAt: nextState.completedAt,
                                    totalPicks: existingPicks.length + 1,
                                    autoCommitted: false,
                                    commitError: commitResult.error,
                                },
                            });
                        } catch (broadcastError) {
                            console.warn('Failed to broadcast auto-commit failure:', broadcastError);
                        }
                    }
                })
                .catch((autoCommitError) => {
                    console.error('❌ Auto-commit import failed:', autoCommitError);

                    // Still try to broadcast that draft ended, even if auto-commit failed
                    FirebaseDraftSync.broadcastDraftEvent(divisionId, {
                        type: 'draft-ended',
                        data: {
                            message:
                                'Draft completed! Auto-commit system error - please commit teams manually from the admin panel.',
                            completedAt: nextState.completedAt,
                            totalPicks: existingPicks.length + 1,
                            autoCommitted: false,
                            commitError: 'Auto-commit system error',
                        },
                    }).catch((err) => console.warn('Failed to broadcast draft completion:', err));
                });
        }

        // Sync to Firebase AND broadcast to SSE connections
        try {
            await FirebaseDraftSync.broadcastPickMade(divisionId, draftPick, {
                currentPick: nextState.currentPick,
                currentUserId: nextState.currentUserId,
                isActive: nextState.isActive,
                totalPicks: draftOrder.length * (draftState.picksPerTeam || 12),
            });

            console.log(`✅ Draft pick processed: ${player.web_name} by ${userId}`);
            console.log(
                `📊 Draft Status: Pick ${nextState.currentPick}, Active: ${nextState.isActive}, Division: ${divisionId}`,
            );
        } catch (syncError) {
            console.warn('Firebase sync or SSE broadcast failed after pick:', syncError);
            // Don't fail the pick if sync fails
        }

        console.log(`✅ Draft pick successful: ${player.web_name} to ${userId}`);

        return {
            success: true,
            pick: draftPick,
            action: 'makePick',
        };
    } catch (error) {
        console.error('❌ Draft pick failed:', error);

        // Invalidate cache on error too, in case of partial updates
        cacheInvalidation.invalidateDraftData(divisionId);

        throw error;
    }
}
