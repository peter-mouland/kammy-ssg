// app/teams/server/team.server.ts

import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import { getTeamsForGameweek } from '../../scoring/server/services/division-teams.service';
import { transformToTeamRows } from '../lib/all-teams-utils';
import type { TeamViewData } from '../types/team-types';

export async function loadTeamData(url: URL, params: any): Promise<TeamViewData> {
    try {
        const userTeams = await readUserTeams();
        const currentUser = userTeams.find((t) => t.userId === params.managerId);
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Get user's division
        const divisions = await readDivisions();
        const division = divisions.find((d) => d.id === currentUser.divisionId);
        if (!division) {
            throw new Error('Division not found');
        }

        // Get available gameweeks from service
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
        const currentGameweekData = await fplApiCache.getCurrentGameweekData();
        const currentGameweek = currentGameweekData.fplEvent.id;
        const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);
        const selectedGameweek = Number.parseInt(url.searchParams.get('gameweek') || String(currentGameweek), 10);

        const events = await fplApiCache.getFplEvents();
        const targetGameweek = selectedGameweek ?? currentGameweek;
        const selectedGameweekData = events.find((e) => e.fplEvent.id === targetGameweek) || currentGameweekData;

        // Get current team data from new division-teams structure
        const currentTeams = await getTeamsForGameweek(currentUser.divisionId, currentUser.userId, targetGameweek);

        if (!currentTeams) {
            console.warn(
                `cGW:${currentGameweek} user divisionId: ${currentUser.divisionId} user: ${currentUser.userId} `,
            );
            throw new Error('Current team data not found - division may not be set up yet');
        }

        // Check if we need to load all teams data (for 'all-teams' tab)
        const allTeamsData = transformToTeamRows(currentTeams.divisionDoc, userTeams);

        return {
            currentUser,
            division,
            currentGameweek,
            currentGameweekData,
            selectedGameweekData,
            currentTeam: currentTeams,
            availableGameweeks,
            allTeamsData,
        };
    } catch (error) {
        console.error('Load team data error:', error);
        throw new Error(`Failed to load team data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
