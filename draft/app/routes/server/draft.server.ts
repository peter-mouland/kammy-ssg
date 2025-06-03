// Enhanced app/server/draft.server.ts with Firebase broadcasting
import { readDraftState, addDraftPick, getDraftPicksByDivision, updateDraftState } from './sheets/draft';
import { getDraftOrderByDivision } from './sheets/draft-order';
import { readDivisions } from './sheets/divisions';
import { readUserTeams } from './sheets/user-teams';
import { fplApiCache } from './fpl/api-cache';
import { getNextDraftState } from "../../lib/draft/get-next-draft-state";
import { generateDraftSequence } from "../../lib/draft/generate-draft-sequence";
import type { DraftPickData, DraftOrderData } from "../../types";

// Import Firebase sync
import { FirebaseDraftSync } from './firestore-cache/firebase-draft-sync';

export async function loadDraftData(url: URL) {
    const selectedUser = url.searchParams.get("user") || "";
    const search = url.searchParams.get("search") || "";
    const position = url.searchParams.get("position") || "";

    // Fetch all required data
    const [draftState, divisions, userTeams, allPlayers] = await Promise.all([
        readDraftState(),
        readDivisions(),
        readUserTeams(),
        fplApiCache.getFplPlayers()
    ]);

    const divisionId = draftState?.currentDivisionId || divisions[0]?.id || "";

    let draftPicks: DraftPickData[] = [];
    let draftOrder: DraftOrderData[] = [];
    let draftSequence: any[] = [];

    if (divisionId) {
        [draftPicks, draftOrder] = await Promise.all([
            getDraftPicksByDivision(divisionId),
            getDraftOrderByDivision(divisionId)
        ]);

        if (draftOrder.length > 0 && draftState) {
            draftSequence = generateDraftSequence(draftOrder, draftState.picksPerTeam);
        }
    }

    // REMOVED: No longer sync Firebase state on every page load
    // This was causing excessive writes on every revalidation

    // Only initialize Firebase state when draft is first activated
    // This should be done in a separate "start draft" action, not on every load

    // Filter available players
    const draftedPlayerIds = new Set(draftPicks.map(pick => pick.playerId));
    let availablePlayers = allPlayers.filter(player => !draftedPlayerIds.has(player.id.toString()));

    // Apply filters
    if (search) {
        const searchResults = await fplApiCache.searchPlayersByName(search);
        const searchIds = new Set(searchResults.map(p => p.id));
        availablePlayers = availablePlayers.filter(p => searchIds.has(p.id));
    }

    if (position) {
        availablePlayers = availablePlayers.filter(p => p.draft.position === position);
    }

    availablePlayers.sort((a, b) => b.total_points - a.total_points);

    const currentUser = selectedUser || userTeams.find(team => team.divisionId === divisionId)?.userId || "";
    const isUserTurn = draftState?.isActive &&
        draftState.currentDivisionId === divisionId &&
        draftState.currentUserId === currentUser;

    return {
        draftState,
        draftPicks,
        draftOrder,
        availablePlayers: availablePlayers.slice(0, 50),
        currentUser,
        isUserTurn,
        divisions,
        userTeams: userTeams.filter(team => team.divisionId === divisionId),
        selectedDivision: divisionId,
        selectedUser: currentUser,
        draftSequence
    };
}

export async function makeDraftPick(formData: FormData) {
    const divisionId = formData.get("divisionId")?.toString();
    const playerId = formData.get("playerId")?.toString();
    const userId = formData.get("userId")?.toString();

    if (!divisionId || !playerId || !userId) {
        throw new Error("Missing required fields for pick");
    }

    const allPlayers = await fplApiCache.getFplPlayers();
    const player = allPlayers.find(p => p.id.toString() === playerId);

    if (!player) {
        throw new Error("Player not found");
    }

    const [draftState, existingPicks, draftOrder, userTeams] = await Promise.all([
        readDraftState(),
        getDraftPicksByDivision(divisionId),
        getDraftOrderByDivision(divisionId),
        readUserTeams()
    ]);

    if (!draftState?.isActive) {
        throw new Error("Draft is not active");
    }

    if (draftState.currentUserId !== userId) {
        throw new Error("Not your turn to pick");
    }

    // Check if player already picked
    const alreadyPicked = existingPicks.some(pick => pick.playerId === playerId);
    if (alreadyPicked) {
        throw new Error("Player has already been drafted");
    }

    const pickNumber = existingPicks.length + 1;
    const round = Math.ceil(pickNumber / draftOrder.length);
    const userName = userTeams.find(team => team.userId === userId)?.userName || 'Unknown User';

    const draftPick: DraftPickData = {
        pickNumber,
        round,
        userId,
        playerId: player.id.toString(),
        playerName: `${player.first_name} ${player.second_name}`,
        team: `Team ${player.team}`,
        position: player.draft.position,
        price: player.now_cost / 10,
        pickedAt: new Date(),
        divisionId
    };

    // Add the pick to sheets
    await addDraftPick(draftPick);

    // Calculate next draft state
    const nextDraftState = getNextDraftState(draftState, draftOrder);
    await updateDraftState(nextDraftState);

    // Get next state variables
    const nextPickNumber = nextDraftState.currentPick;
    const nextUserId = nextDraftState.currentUserId;
    const nextUserName = userTeams.find(team => team.userId === nextUserId)?.userName || 'Unknown User';

    try {
        // ONLY sync to Firebase when a pick is actually made
        // This will use the deduplication logic we added earlier
        await FirebaseDraftSync.broadcastPickMade(divisionId, draftPick, {
            currentPick: nextPickNumber,
            currentUserId: nextUserId,
            isActive: nextDraftState.isActive,
            totalPicks: draftOrder.length * (draftState.picksPerTeam || 15)
        });

        console.log(`🔥 Pick synced to Firebase: ${draftPick.playerName} by ${userName}`);
    } catch (error) {
        console.error("🔥 Failed to sync pick to Firebase:", error);
        // Don't throw - the pick was still saved to your main database
    }

    return {
        success: true,
        pick: {
            ...draftPick,
            userName,
            nextUser: nextDraftState.isActive ? {
                userId: nextUserId,
                userName: nextUserName,
                pickNumber: nextPickNumber
            } : null
        }
    };
}

