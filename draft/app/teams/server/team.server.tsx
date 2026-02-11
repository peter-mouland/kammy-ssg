// app/teams/server/team.server.ts

import { getUserSelection } from '../../_shared/features/user-selection/user-selection.utils';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import { getTeamsForGameweek } from '../../scoring/server/services/division-teams.service';
import { transformToTeamRows } from '../lib/all-teams-utils';
import type { TeamViewData } from '../types/team-types';

export async function loadTeamData({ request, params }): Promise<TeamViewData> {
    const url = new URL(request.url);
    try {
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
        const [currentGameweekData, teamsByCode, fplPlayersByCode, events, userTeams, divisions] = await Promise.all([
            fplApiCache.getCurrentGameweekData(),
            fplApiCache.getTeamsByCode(),
            fplApiCache.getPlayersByCode(),
            fplApiCache.getFplEvents(),
            readUserTeams(),
            readDivisions(),
        ]);
        const persistedUser = getUserSelection(request, params);
        const currentUser = userTeams.find((t) => t.userId === persistedUser.selectedUserId);
        const currentGameweek = currentGameweekData.fplEvent.id;
        const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);
        const gameweekParam = url.searchParams.get('gameweek');
        const parsedGameweek = gameweekParam ? Number.parseInt(gameweekParam, 10) : currentGameweek;
        const targetGameweek = Number.isNaN(parsedGameweek) ? currentGameweek : parsedGameweek;
        const selectedGameweekData = events.find((e) => e.fplEvent.id === targetGameweek) || currentGameweekData;

        if (!currentUser) {
            return {
                currentGameweek,
                currentGameweekData,
                selectedGameweekData,
                availableGameweeks,
                teamsByCode,
                fplPlayersByCode,
                userTeams: userTeams.sort((a, b) => (a.userId < b.userId ? -1 : 1)),
            };
        }

        // Get user's division
        const division = divisions.find((d) => d.id === currentUser.divisionId);
        if (!division) {
            throw new Error('Division not found');
        }

        // Get current team data from new division-teams structure
        const currentTeams = await getTeamsForGameweek(currentUser.divisionId, currentUser.userId, targetGameweek);
        if (!currentTeams) {
            throw new Error(
                `Current team data not found - division may not be set up yet. divisionId: ${currentUser.divisionId} user: ${currentUser.userId} `,
            );
        }

        // Check if we need to load all teams data (for 'all-teams' tab)
        const allTeamsData = transformToTeamRows(currentTeams.divisionDoc, userTeams);

        // Get Team of the Week with manager ownership data
        const { getTeamOfTheWeek } = await import('../../leagues/server/team-of-the-week.server');
        const teamOfTheWeek = await getTeamOfTheWeek(targetGameweek, {
            divisionDoc: currentTeams.divisionDoc,
            userTeams,
        });

        return {
            persistedUser,
            currentUser,
            division,
            currentGameweek,
            currentGameweekData,
            selectedGameweekData,
            currentTeam: currentTeams,
            availableGameweeks,
            allTeamsData,
            teamsByCode,
            fplPlayersByCode,
            userTeams: userTeams.sort((a, b) => (a.userId < b.userId ? -1 : 1)),
            teamOfTheWeek: teamOfTheWeek ?? undefined,
        };
    } catch (error) {
        console.error('Load team data error:', error);
        throw new Error(`Failed to load team data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
