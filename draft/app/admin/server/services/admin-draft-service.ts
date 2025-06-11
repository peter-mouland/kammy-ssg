// /admin/server/services/admin-draft-service.ts
import { readDivisions } from "../../../_shared/lib/sheets/divisions";
import { getUserTeamsByDivision } from "../../../_shared/lib/sheets/user-teams";
import { getDraftOrderByDivision } from "../../../_shared/lib/sheets/draft-order";
import { readDraftState } from "../../../_shared/lib/sheets/draft";
import type {
    UserTeamData,
    DraftOrderData,
    AdminDashboardData
} from "../../types";

export class AdminDraftService {
    /**
     * Get comprehensive draft admin data for dashboard
     */
    static async getDraftAdminData(): Promise<AdminDashboardData> {
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

    /**
     * Get draft status summary for a division
     */
    static async getDivisionDraftStatus(divisionId: string) {
        try {
            const [teams, draftOrder, draftState] = await Promise.all([
                getUserTeamsByDivision(divisionId),
                getDraftOrderByDivision(divisionId),
                readDraftState()
            ]);

            const isActiveDivision = draftState?.currentDivisionId === divisionId;
            const hasOrder = draftOrder.length > 0;
            const teamCount = teams.length;

            return {
                teamCount,
                hasOrder,
                isActive: draftState?.isActive && isActiveDivision,
                isReady: teamCount > 0 && hasOrder,
                currentPick: isActiveDivision ? draftState?.currentPick : undefined
            };
        } catch (error) {
            console.error(`Error getting draft status for ${divisionId}:`, error);
            return {
                teamCount: 0,
                hasOrder: false,
                isActive: false,
                isReady: false
            };
        }
    }

    /**
     * Get all divisions with their draft status
     */
    static async getAllDivisionsWithStatus() {
        const divisions = await readDivisions();

        const divisionsWithStatus = await Promise.all(
            divisions.map(async (division) => {
                const status = await this.getDivisionDraftStatus(division.id);
                return {
                    ...division,
                    status
                };
            })
        );

        return divisionsWithStatus;
    }
}
