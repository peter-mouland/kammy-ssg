// app/draft/server/draft.server.ts
// Updated for multi-division support with calculated currentPick

import { getInvalidationKeys } from '../../_shared/lib/cache/cache-config';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
import { FirebaseDraftSync } from '../../_shared/lib/firestore-cache/firebase-draft-sync';
import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import {
    addDraftPick,
    getDraftPicksByDivision,
    readAllDraftStates,
    readDraftPicks,
    updateDraftState,
} from '../../_shared/lib/sheets/draft';
import { getDraftOrderByDivision } from '../../_shared/lib/sheets/draft-order';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import type { DivisionId } from '../../_shared/types/league-types';
import { calculateCurrentPick, calculateCurrentUserId } from '../lib/draft-pick-calculator'; // NEW: Use calculator
import { toDraftStateForDivision, toDraftStates } from '../lib/draft-state';
import { generateDraftSequence } from '../lib/generate-draft-sequence';
import type { DraftLoaderData, DraftOrderData, DraftPickData } from '../types/draft-types';

export async function loadDraftData(url: URL): Promise<DraftLoaderData> {
    const selectedUser = url.searchParams.get('user') || '';
    const search = url.searchParams.get('search') || '';
    const position = url.searchParams.get('position') || '';
    const divisionIdParam = url.searchParams.get('divisionId') as DivisionId;

    // Fetch all required data
    const [divisions, userTeams, allPlayers, teams] = await Promise.all([
        readDivisions(),
        readUserTeams(),
        fplApiCache.getFplPlayers(),
        fplApiCache.getFplTeams(),
    ]);

    // Determine which division to load - prioritize URL param, then first division
    const currentUserInfo = userTeams.find((team) => team.userId === selectedUser);
    const divisionId: DivisionId = divisionIdParam || currentUserInfo?.divisionId;

    // The sheet stores rows only; currentPick is derived here, in the draft domain.
    const [draftStateRows, allPicks] = await Promise.all([readAllDraftStates(), readDraftPicks()]);
    const draftStates = toDraftStates(draftStateRows, allPicks);
    const draftState = draftStates.find((ds) => ds.divisionId === divisionId) || draftStates[0];

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
    const draftedPlayerCodes = new Set(draftPicks.map((pick) => pick.playerCode));
    let availablePlayers = allPlayers.filter((player) => !draftedPlayerCodes.has(player.code));

    // Apply filters
    if (search) {
        const searchResults = await fplApiCache.searchPlayersByName(search);
        const searchCodes = new Set(searchResults.map((p) => p.code));
        availablePlayers = availablePlayers.filter((p) => searchCodes.has(p.code));
    }

    if (position) {
        availablePlayers = availablePlayers.filter((p) => p.draft.position === position);
    }

    // availablePlayers.sort((a, b) => b.draft.pointsTotal - a.draft?.pointsTotal);

    const currentUser = selectedUser || userTeams.find((team) => team.divisionId === divisionId)?.userId || '';
    const isUserTurn = !!(
        (draftState?.isActive && draftState?.currentUserId === currentUser && draftState?.divisionId === divisionId) // Check division matches
    );

    return {
        draftState,
        draftPicks,
        draftOrder,
        availablePlayers,
        currentUser,
        currentUserInfo,
        isUserTurn,
        divisions,
        userTeams,
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

/**
 * Make a draft pick for a specific division
 */
export async function makeDraftPick(
    formData: FormData,
): Promise<{ success?: boolean; error?: string; pick?: DraftPickData }> {
    try {
        const playerCode = Number.parseInt(formData.get('playerCode') as string, 10);
        const divisionIdParam = formData.get('divisionId') as DivisionId;
        const userId = formData.get('userId') as string;

        if (!playerCode || !userId) {
            return { error: 'Missing required fields: playerCode and userId' };
        }

        // Get division-specific draft state
        const draftState = divisionIdParam
            ? toDraftStateForDivision(await readAllDraftStates(), await readDraftPicks(), divisionIdParam)
            : null;

        if (!draftState?.isActive) {
            return { error: `No active draft found for division ${divisionIdParam}` };
        }

        const divisionId = draftState.divisionId;

        // Verify it's the user's turn
        if (draftState.currentUserId !== userId) {
            return { error: `Not your turn. Current turn: ${draftState.currentUserId}` };
        }

        // Get player and draft data
        const [player, draftPicks, draftOrder, teams] = await Promise.all([
            fplApiCache.getPlayerByCode(playerCode),
            getDraftPicksByDivision(divisionId),
            getDraftOrderByDivision(divisionId),
            fplApiCache.getFplTeams(),
        ]);

        if (!player) {
            return { error: 'Player not found' };
        }

        // Check if player is already drafted in this division
        const isDrafted = draftPicks.some((pick) => pick.playerCode === playerCode);
        if (isDrafted) {
            return { error: 'Player already drafted in this division' };
        }

        const team = teams.find((t) => t.code === player.team_code);

        // currentPick is derived from these same picks, so it cannot disagree with them.
        // (This used to compare the sheet's stored value against a recalculation.)
        const calculatedCurrentPick = calculateCurrentPick(divisionId, draftPicks);

        // Create pick data
        const pick: DraftPickData = {
            pickNumber: calculatedCurrentPick, // Use calculated value
            round: Math.ceil(calculatedCurrentPick / draftOrder.length),
            userId,
            playerId: player.id,
            playerCode: player.code,
            playerName: player.web_name,
            teamCode: player.team_code,
            teamName: team.name,
            position: player.draft.position,
            pickedAt: new Date(),
            divisionId,
        };

        // Add pick to sheets
        await addDraftPick(pick);

        // Calculate next state using updated picks
        const updatedPicks = [...draftPicks, pick];
        const nextCurrentPick = calculateCurrentPick(divisionId, updatedPicks);
        const nextUserId = calculateCurrentUserId(divisionId, updatedPicks, draftOrder, draftState.picksPerTeam);

        // Determine if draft is complete
        const totalPicks = draftOrder.length * draftState.picksPerTeam;
        const isComplete = updatedPicks.length >= totalPicks;

        // Update draft state
        const updatedDraftState = {
            ...draftState,
            currentPick: nextCurrentPick, // Will be calculated when read back
            currentUserId: isComplete ? '' : nextUserId,
            isActive: !isComplete,
            completedAt: isComplete ? new Date() : null,
        };

        await updateDraftState(updatedDraftState);

        // Broadcast pick to Firebase for real-time updates
        await FirebaseDraftSync.broadcastPickMade(divisionId, pick, {
            currentPick: nextCurrentPick,
            currentUserId: isComplete ? '' : nextUserId,
            isActive: !isComplete,
        });

        autoCommitDraft({ draftState, nextState: updatedDraftState, totalPicks, pick });

        // Invalidate caches
        const keysToInvalidate = getInvalidationKeys('DRAFT_ACTION', divisionId);
        dataCache.invalidateMultiple(keysToInvalidate);

        console.log(
            `✅ Pick made: ${player.web_name} by ${userId} in division ${divisionId} (Pick #${calculatedCurrentPick})`,
        );

        return { success: true, pick };
    } catch (error) {
        console.error('❌ Failed to make draft pick:', error);
        return { error: error instanceof Error ? error.message : 'Failed to make draft pick' };
    }
}

const autoCommitDraft = async ({ draftState, nextState, totalPicks, pick }) => {
    const divisionId = draftState.divisionId;
    // Auto-commit teams to Firestore if draft just completed
    if (draftState.isActive && !nextState.isActive && nextState.completedAt) {
        console.log(`🎉 Draft completed! Auto-committing teams for division: ${divisionId}`);

        // Import and run auto-commit (don't await to avoid blocking the pick response)
        const { handleCommitTeamsToFirestore } = await import('../../admin/server/actions/team-commit-actions');
        const commitResult = await handleCommitTeamsToFirestore(divisionId);
        if (commitResult.success) {
            await FirebaseDraftSync.broadcastDraftEvent(divisionId, {
                type: 'draft-ended',
                data: {
                    message: 'Draft completed! Teams have been automatically committed to Firestore.',
                    completedAt: nextState.completedAt,
                    totalPicks: totalPicks + 1,
                    autoCommitted: true,
                    commitResult: commitResult.message,
                },
            });
        } else {
            await FirebaseDraftSync.broadcastDraftEvent(divisionId, {
                type: 'draft-ended',
                data: {
                    message: 'Draft completed! Auto-commit failed - please commit teams manually from the admin panel.',
                    completedAt: nextState.completedAt,
                    totalPicks: totalPicks + 1,
                    autoCommitted: false,
                    commitError: commitResult.error,
                },
            });
        }
    }

    // Sync to Firebase AND broadcast to SSE connections
    try {
        await FirebaseDraftSync.broadcastPickMade(divisionId, pick, {
            currentPick: nextState.currentPick,
            currentUserId: nextState.currentUserId,
            isActive: nextState.isActive,
            totalPicks: totalPicks,
        });

        console.log(`✅ Draft pick processed: ${pick.playerName}`);
        console.log(
            `📊 Draft Status: Pick ${nextState.currentPick}, Active: ${nextState.isActive}, Division: ${divisionId}`,
        );
    } catch (syncError) {
        console.warn('Firebase sync or SSE broadcast failed after pick:', syncError);
        // Don't fail the pick if sync fails
    }
};
