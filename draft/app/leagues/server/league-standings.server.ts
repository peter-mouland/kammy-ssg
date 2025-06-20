/* Location: app/leagues/server/league-standings.server.ts */

// app/routes/server/league-standings.server.ts
import { readUserTeams, getUserTeamsByDivision } from '../../_shared/lib/sheets/user-teams';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import type { UserTeamsSheetData, DivisionSheetData, DivisionId } from '../../teams/types/team-types';

export interface LeagueStandingsLoaderData {
    userTeamsByDivision: Record<string, UserTeamsSheetData[]>;
    divisions: DivisionSheetData[];
    selectedDivision?: string;
}

export async function getLeagueStandingsData(selectedDivision: DivisionId): Promise<LeagueStandingsLoaderData> {
    // Fetch divisions first
    const divisions = await readDivisions();

    // If specific division selected, just get that one
    if (selectedDivision) {
        const userTeams = await getUserTeamsByDivision(selectedDivision);

        return {
            userTeamsByDivision: {
                [selectedDivision]: userTeams,
            },
            divisions,
            selectedDivision,
        };
    }

    // Get all teams and organize by division
    const allUserTeams = await readUserTeams();
    const userTeamsByDivision: Record<string, UserTeamsSheetData[]> = {};

    // Initialize empty arrays for all divisions
    divisions.forEach((division) => {
        userTeamsByDivision[division.id] = [];
    });

    // Group teams by division and sort by total points within each division
    allUserTeams.forEach((team) => {
        if (!userTeamsByDivision[team.divisionId]) {
            userTeamsByDivision[team.divisionId] = [];
        }
        userTeamsByDivision[team.divisionId].push(team);
    });

    // Sort teams within each division by total points (descending)
    Object.keys(userTeamsByDivision).forEach((divisionId) => {
        userTeamsByDivision[divisionId];
    });

    return {
        userTeamsByDivision,
        divisions,
        selectedDivision: undefined,
    };
}

export async function handleLeagueStandingsAction(formData: FormData) {
    const actionType = formData.get('actionType');
    const divisionId = formData.get('divisionId');

    switch (actionType) {
        default:
            throw new Error('Invalid action type');
    }
}
