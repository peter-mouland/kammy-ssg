import { readDraftState, addDraftPick, getDraftPicksByDivision, updateDraftState } from '../../_shared/lib/sheets/draft';
import { getDraftOrderByDivision } from '../../_shared/lib/sheets/draft-order';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import { getNextDraftState } from "../lib/get-next-draft-state";
import { generateDraftSequence } from "../lib/generate-draft-sequence";
import type { DraftPickData, DraftOrderData } from "../../_shared/types";

import { FirebaseDraftSync } from '../../_shared/lib/firestore-cache/firebase-draft-sync';

export async function loadDraftData(url: URL) {
    const selectedUser = url.searchParams.get("user") || "";
    const search = url.searchParams.get("search") || "";
    const position = url.searchParams.get("position") || "";

    // Fetch all required data
    const [draftState, divisions, userTeams, allPlayers, teams] = await Promise.all([
        readDraftState(),
        readDivisions(),
        readUserTeams(),
        fplApiCache.getFplPlayers(),
        fplApiCache.getFplTeams()
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
        availablePlayers: availablePlayers,
        currentUser,
        isUserTurn,
        divisions,
        userTeams: userTeams.filter(team => team.divisionId === divisionId),
        selectedDivision: divisionId,
        selectedUser: currentUser,
        draftSequence,
        teams
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
    const allTeams = await fplApiCache.getFplTeams();
    const player = allPlayers.find(p => p.id.toString() === playerId);
    const team = allTeams.find(t => t.code === player.team_code);

    if (!player) {
        throw new Error("Player not found");
    }
    if (!team) {
        throw new Error(`Team ${player.team_code} not found`);
    }

    const [draftState, existingPicks, draftOrder, userTeams] = await Promise.all([
        readDraftState(),
        getDraftPicksByDivision(divisionId),
        getDraftOrderByDivision(divisionId),
        readUserTeams(),
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
        playerName: player.web_name,
        teamName: team.name,
        teamCode: player.team_code,
        position: player.draft.position,
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

