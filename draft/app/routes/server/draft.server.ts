// app/routes/draft/draft.server.ts
import { readDraftState, addDraftPick, getDraftPicksByDivision, updateDraftState } from './sheets/draft';
import { getDraftOrderByDivision } from './sheets/draftOrder';
import { readDivisions } from './sheets/divisions';
import { readUserTeams } from './sheets/userTeams';
import { fplApiCache } from './fpl/api-cache';
import { getNextDraftState, generateDraftSequence } from "../../lib/draft/helpers";
import type { DraftStateData, DraftPickData, DraftOrderData, FplPlayerData, DivisionData, UserTeamData } from "../../types";

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

    const [draftState, existingPicks, draftOrder] = await Promise.all([
        readDraftState(),
        getDraftPicksByDivision(divisionId),
        getDraftOrderByDivision(divisionId)
    ]);

    if (!draftState?.isActive) {
        throw new Error("Draft is not active");
    }

    if (draftState.currentUserId !== userId) {
        throw new Error("Not your turn to pick");
    }

    const pickNumber = existingPicks.length + 1;
    const round = Math.ceil(pickNumber / draftOrder.length);

    const draftPick: DraftPickData = {
        pickNumber,
        round,
        userId,
        playerId: player.id.toString(),
        playerName: `${player.first_name} ${player.second_name}`,
        team: `Team ${player.team}`,
        position: player.element_type.toString(),
        price: player.now_cost / 10,
        pickedAt: new Date(),
        divisionId
    };

    await addDraftPick(draftPick);

    const nextDraftState = getNextDraftState(draftState, draftOrder);
    await updateDraftState(nextDraftState);

    return { success: true, pick: draftPick };
}
