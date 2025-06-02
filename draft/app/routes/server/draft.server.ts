// Enhanced app/server/draft.server.ts with SSE broadcasting
import { readDraftState, addDraftPick, getDraftPicksByDivision, updateDraftState } from './sheets/draft';
import { getDraftOrderByDivision } from './sheets/draft-order';
import { readDivisions } from './sheets/divisions';
import { readUserTeams } from './sheets/user-teams';
import { fplApiCache } from './fpl/api-cache';
import { getNextDraftState } from "../../lib/draft/get-next-draft-state";
import { generateDraftSequence } from "../../lib/draft/generate-draft-sequence";
import type { DraftPickData, DraftOrderData } from "../../types";

// Import the broadcast function (using dynamic import to avoid issues)
async function broadcastDraftEvent(event: any) {
    try {
        const { broadcastDraftEvent: broadcast } = await import("../api.draft.live");
        broadcast(event);
    } catch (error) {
        console.error("Failed to broadcast draft event:", error);
    }
}

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
        const positionId = parseInt(position);
        availablePlayers = availablePlayers.filter(p => p.element_type === positionId);
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
        position: player.position?.toString(),
        price: player.now_cost / 10,
        pickedAt: new Date(),
        divisionId
    };

    // Add the pick to sheets
    await addDraftPick(draftPick);

    // Calculate next draft state
    const nextDraftState = getNextDraftState(draftState, draftOrder);
    await updateDraftState(nextDraftState);

    // 🚀 Broadcast the pick to all connected clients
    await broadcastDraftEvent({
        type: 'pick-made',
        data: {
            pick: {
                ...draftPick,
                userName // Add userName for better UX
            },
            pickNumber: draftPick.pickNumber,
            userId: draftPick.userId,
            userName,
            playerName: draftPick.playerName,
            round: draftPick.round
        },
        divisionId
    });

    // 🚀 Broadcast turn change if draft is still active
    if (nextDraftState.isActive) {
        const nextUser = draftOrder.find(order => order.userId === nextDraftState.currentUserId);
        await broadcastDraftEvent({
            type: 'turn-change',
            data: {
                currentPick: nextDraftState.currentPick,
                currentUserId: nextDraftState.currentUserId,
                currentUserName: nextUser?.userName || 'Unknown User',
                pickDeadline: new Date(Date.now() + 120000), // 2 minutes
                isActive: true,
                pickCount: pickNumber
            },
            divisionId
        });
    } else {
        // 🚀 Broadcast draft completion
        await broadcastDraftEvent({
            type: 'draft-ended',
            data: {
                message: 'Draft completed!',
                finalPickCount: pickNumber,
                completedAt: nextDraftState.completedAt
            },
            divisionId
        });
    }

    return { success: true, pick: { ...draftPick, userName } };
}
