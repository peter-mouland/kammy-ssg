// Enhanced app/server/draft-admin.server.ts with clear data functionality
import { readDivisions } from "./sheets/divisions";
import { getUserTeamsByDivision } from "./sheets/user-teams";
import {
    generateRandomDraftOrder,
    getDraftOrderByDivision,
    clearDraftOrder,
    draftOrderExists
} from "./sheets/draft-order";
import { updateDraftState, readDraftState } from "./sheets/draft";
import { FirestoreClearService } from "./firestore-cache/clear-service";
import type { DivisionData, UserTeamData, DraftOrderData, DraftStateData } from "../types";

export interface DraftAdminData {
    divisions: DivisionData[];
    draftOrders: Record<string, DraftOrderData[]>;
    userTeamsByDivision: Record<string, UserTeamData[]>;
    draftState: DraftStateData | null;
}

export async function getDraftAdminData(): Promise<DraftAdminData> {
    // Fetch divisions and draft state
    const [divisions, draftState] = await Promise.all([
        readDivisions(),
        readDraftState()
    ]);

    // Fetch user teams and draft orders for each division
    const draftOrders: Record<string, DraftOrderData[]> = {};
    const userTeamsByDivision: Record<string, UserTeamData[]> = {};

    await Promise.all(
        divisions.map(async (division) => {
            const [teams, orders] = await Promise.all([
                getUserTeamsByDivision(division.id),
                getDraftOrderByDivision(division.id)
            ]);

            userTeamsByDivision[division.id] = teams;
            draftOrders[division.id] = orders;
        })
    );

    return {
        divisions,
        draftOrders,
        userTeamsByDivision,
        draftState
    };
}

export interface DraftActionParams {
    actionType: string;
    divisionId?: string;
    authToken?: string;
    variant?: 'all' | 'fpl-only' | 'elements-only';
}

export async function handleDraftAction(params: DraftActionParams) {
    const { actionType, divisionId, authToken, variant } = params;

    switch (actionType) {
        case "generateOrder":
            if (!divisionId) {
                throw new Error("Division ID is required");
            }

            const userTeams = await getUserTeamsByDivision(divisionId);
            if (userTeams.length === 0) {
                throw new Error("No teams found in this division");
            }

            const teamData = userTeams.map(team => ({
                userId: team.userId,
                userName: team.userName
            }));

            await generateRandomDraftOrder(divisionId, teamData);
            return { success: true, message: `Draft order generated for division ${divisionId}` };

        case "clearOrder":
            if (!divisionId) {
                throw new Error("Division ID is required");
            }

            await clearDraftOrder(divisionId);
            return { success: true, message: `Draft order cleared for division ${divisionId}` };

        case "startDraft":
            console.log('Processing startDraft action');

            if (!divisionId) {
                throw new Error("Please select a division to start the draft");
            }

            const orderExists = await draftOrderExists(divisionId);
            if (!orderExists) {
                throw new Error("Draft order must be generated before starting the draft");
            }

            const draftOrder = await getDraftOrderByDivision(divisionId);
            const firstUser = draftOrder.find(order => order.position === 1);

            if (!firstUser) {
                throw new Error("No users found in draft order");
            }

            const newDraftState: DraftStateData = {
                isActive: true,
                currentPick: 1,
                currentUserId: firstUser.userId,
                currentDivisionId: divisionId,
                picksPerTeam: 12,
                startedAt: new Date(),
                completedAt: null
            };

            await updateDraftState(newDraftState);
            return { success: true, message: `Draft started for division ${divisionId}!` };

        case "stopDraft":
            const currentDraftState = await readDraftState();
            if (!currentDraftState?.isActive) {
                throw new Error("No active draft to stop");
            }

            const stoppedDraftState: DraftStateData = {
                ...currentDraftState,
                isActive: false,
                completedAt: new Date()
            };

            await updateDraftState(stoppedDraftState);
            return { success: true, message: "Draft stopped successfully" };

        case "clearFirestoreData":
            // Validate auth token
            // if (!authToken || !isValidAdminToken(authToken)) {
            //     throw new Error("Unauthorized: Invalid admin token");
            // }

            const clearVariant = variant || 'all';
            const clearService = new FirestoreClearService();

            try {
                switch (clearVariant) {
                    case 'all':
                        await clearService.clearAllData();
                        break;
                    case 'fpl-only':
                        await clearService.clearFplCacheOnly();
                        break;
                    case 'elements-only':
                        await clearService.clearElementSummariesOnly();
                        break;
                    default:
                        throw new Error(`Invalid clear variant: ${clearVariant}`);
                }

                return {
                    success: true,
                    message: `Firestore data cleared successfully (${clearVariant})`
                };
            } catch (error) {
                console.error('Clear firestore data error:', error);
                throw new Error(`Failed to clear firestore data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

        case "getFirestoreStats":
            // Validate auth token
            // if (!authToken || !isValidAdminToken(authToken)) {
            //     throw new Error("Unauthorized: Invalid admin token");
            // }

            try {
                const clearService = new FirestoreClearService();
                const [stats, estimate] = await Promise.all([
                    clearService.getCollectionStats(),
                    clearService.estimateClearTime()
                ]);

                return {
                    success: true,
                    data: { stats, estimate, timestamp: new Date().toISOString() }
                };
            } catch (error) {
                console.error('Get firestore stats error:', error);
                throw new Error(`Failed to get firestore stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

        default:
            throw new Error("Invalid action type: " + actionType);
    }
}

function isValidAdminToken(token: string): boolean {
    const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
    return token === adminToken;
}
