// /admin/server/services/admin-draft-service.ts
import { readDivisions } from "../../../_shared/lib/sheets/divisions";
import { readUserTeams } from '../../../_shared/lib/sheets/user-teams';
import { readDraftOrders } from '../../../_shared/lib/sheets/draft-order';
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
        // Fetch gsheets, optimised to one call per sheet
        const [divisions, draftState, teams, draftOrder] = await Promise.all([
            readDivisions(),
            readDraftState(),
            readUserTeams(),
            readDraftOrders()
        ]);

        // Fetch user teams and draft orders for each division
        const draftOrders: Record<string, DraftOrderData[]> = {};
        const userTeamsByDivision: Record<string, UserTeamData[]> = {};

        const getDraftOrderByDivision = (divisionId) => draftOrder
            .filter(order => order.divisionId === divisionId)
            .sort((a, b) => a.position - b.position);

        const getUserTeamsByDivision = (divisionId) => {
            return teams.filter(team => team.divisionId === divisionId);
        }

        divisions.forEach((division) => {
            userTeamsByDivision[division.id] = getUserTeamsByDivision(division.id);
            draftOrders[division.id] = getDraftOrderByDivision(division.id);
        })

        return {
            divisions,
            draftOrders,
            userTeamsByDivision,
            draftState
        };
    }

    /**
     * Alternative: Load minimal data for dashboard
     * Use this if rate limits are a persistent issue
     */
    static async getDraftAdminDataMinimal(): Promise<AdminDashboardData> {
        try {
            // Only load essential data
            const [divisions, draftState] = await Promise.all([
                readDivisions(),
                readDraftState()
            ]);

            // Return with empty collections - let components load data on-demand
            return {
                divisions,
                draftOrders: {},
                userTeamsByDivision: {},
                draftState
            };

        } catch (error) {
            console.error('Failed to load minimal admin data:', error);
            throw error;
        }
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
