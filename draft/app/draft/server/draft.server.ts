/* Location: app/draft/server/draft.server.ts */

import { readDraftState, addDraftPick, getDraftPicksByDivision, updateDraftState } from '../../_shared/lib/sheets/draft';
import { cacheInvalidation } from '../../_shared/lib/sheets/cache/cached-sheet-functions';
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
    console.log('🎯 Making draft pick...');

    const divisionId = formData.get("divisionId")?.toString();
    const playerId = formData.get("playerId")?.toString();
    const userId = formData.get("userId")?.toString();

    if (!playerId || !userId || !divisionId) {
        throw new Error("Missing required fields for draft pick");
    }

    try {
        // Get current state using CACHED function
        const draftState = await readDraftState();

        if (!draftState?.isActive) {
            throw new Error("Draft is not currently active");
        }

        if (draftState.currentUserId !== userId) {
            throw new Error("It's not your turn to pick");
        }

        // Get player data
        const allPlayers = await fplApiCache.getFplPlayers();
        const player = allPlayers.find(p => p.id.toString() === playerId);

        if (!player) {
            throw new Error("Player not found");
        }

        // Get team data
        const teams = await fplApiCache.getFplTeams();
        const team = teams.find(t => t.code === player.team_code);

        if (!team) {
            throw new Error("Team not found for player");
        }

        // Create draft pick
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
            divisionId
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

        // Sync to Firebase AND broadcast to SSE connections
        try {
            await FirebaseDraftSync.broadcastPickMade(divisionId, draftPick, {
                currentPick: nextState.currentPick,
                currentUserId: nextState.currentUserId,
                isActive: nextState.isActive,
                totalPicks: draftOrder.length * (draftState.picksPerTeam || 12)
            });

            console.log(`✅ Draft pick successful and broadcast: ${player.web_name} to ${userId}`);
        } catch (syncError) {
            console.warn('Firebase sync or SSE broadcast failed after pick:', syncError);
            // Don't fail the pick if sync fails
        }

        console.log(`✅ Draft pick successful: ${player.web_name} to ${userId}`);

        return {
            success: true,
            pick: draftPick,
            action: "makePick"
        };

    } catch (error) {
        console.error('❌ Draft pick failed:', error);

        // Invalidate cache on error too, in case of partial updates
        cacheInvalidation.invalidateDraftData(divisionId);

        throw error;
    }
}
