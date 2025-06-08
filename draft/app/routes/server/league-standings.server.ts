// app/routes/server/league-standings.server.ts
import { readUserTeams, getUserTeamsByDivision, recalculateLeagueRanks } from "./sheets/user-teams";
import { readDivisions } from "./sheets/divisions";
import type { UserTeamData, DivisionData } from "../../types";

export interface LeagueStandingsLoaderData {
    userTeamsByDivision: Record<string, UserTeamData[]>;
    divisions: DivisionData[];
    selectedDivision?: string;
}

export async function getLeagueStandingsData(selectedDivision): Promise<LeagueStandingsLoaderData> {

    // Fetch divisions first
    const divisions = await readDivisions();

    // If specific division selected, just get that one
    if (selectedDivision) {
        const userTeams = await getUserTeamsByDivision(selectedDivision);

        return {
            userTeamsByDivision: {
                [selectedDivision]: userTeams.sort((a, b) => b.totalPoints - a.totalPoints)
            },
            divisions,
            selectedDivision
        };
    }

    // Get all teams and organize by division
    const allUserTeams = await readUserTeams();
    const userTeamsByDivision: Record<string, UserTeamData[]> = {};

    // Initialize empty arrays for all divisions
    divisions.forEach(division => {
        userTeamsByDivision[division.id] = [];
    });

    // Group teams by division and sort by total points within each division
    allUserTeams.forEach(team => {
        if (!userTeamsByDivision[team.divisionId]) {
            userTeamsByDivision[team.divisionId] = [];
        }
        userTeamsByDivision[team.divisionId].push(team);
    });

    // Sort teams within each division by total points (descending)
    Object.keys(userTeamsByDivision).forEach(divisionId => {
        userTeamsByDivision[divisionId].sort((a, b) => b.totalPoints - a.totalPoints);
    });

    return {
        userTeamsByDivision,
        divisions,
        selectedDivision: undefined
    };
}

export async function handleLeagueStandingsAction(formData: FormData) {
    const actionType = formData.get("actionType");
    const divisionId = formData.get("divisionId");

    switch (actionType) {
        case "refreshRankings":
            // Recalculate rankings for specific division or all divisions
            const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

            if (divisionId && typeof divisionId === 'string') {
                await recalculateLeagueRanks(spreadsheetId, divisionId);
                return {
                    success: true,
                    message: `Rankings refreshed for division: ${divisionId}`
                };
            } else {
                await recalculateLeagueRanks(spreadsheetId);
                return {
                    success: true,
                    message: "Rankings refreshed for all divisions"
                };
            }

        default:
            throw new Error("Invalid action type");
    }
}
