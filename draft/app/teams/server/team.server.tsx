// app/teams/server/team.server.ts

import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import {
    getAvailableGameweeks as getAvailableGameweeksFromService,
    getUserTeamForGameweek,
    getUserTeamHistory,
} from '../../scoring/server/services/division-teams.service';
import type { CurrentUser, TeamGameweekData, TeamViewData, UserTeamsSheetData } from '../types/team-types';

export async function loadTeamData(url: URL, params: any): Promise<TeamViewData> {
    try {
        const userTeams = await readUserTeams();

        const currentUser = await getCurrentUser(params.managerId, userTeams);
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Get user's division
        const divisions = await readDivisions();
        const division = divisions.find((d) => d.id === currentUser.divisionId);
        if (!division) {
            throw new Error('Division not found');
        }

        // Get current gameweek
        const currentGameweek = await getCurrentGameweek();

        // Get current team data from new division-teams structure
        const currentTeam = await getUserTeamForGameweek(currentUser.divisionId, currentUser.id, currentGameweek);

        if (!currentTeam) {
            console.warn(`cGW:${currentGameweek} user divisionId: ${currentUser.divisionId} user: ${currentUser.id} `);
            throw new Error('Current team data not found - division may not be set up yet');
        }

        // Get historical team data
        const gameweekHistory = await getUserTeamHistory(
            currentUser.divisionId,
            currentUser.id,
            0, // Start from draft (gameweek 0)
            currentGameweek,
        );

        // Get available gameweeks from service
        const availableGameweeks = await getAvailableGameweeksFromService(currentUser.divisionId);

        return {
            currentUser,
            division: {
                id: division.id,
                name: division.label,
            },
            currentGameweek,
            currentTeam,
            gameweekHistory,
            availableGameweeks: availableGameweeks.sort((a, b) => a - b),
        };
    } catch (error) {
        console.error('Load team data error:', error);
        throw new Error(`Failed to load team data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get specific user's team from division for a gameweek
 */
export async function getUserTeamFromDivision(
    divisionId: string,
    userId: string,
    gameweek?: number,
): Promise<TeamGameweekData | null> {
    try {
        const targetGameweek = gameweek ?? (await getCurrentGameweek());
        return await getUserTeamForGameweek(divisionId, userId, targetGameweek);
    } catch (error) {
        console.error('Get user team from division error:', error);
        return null;
    }
}

/**
 * Placeholder functions - implement these based on your auth and game state logic
 */
async function getCurrentUser(managerId: string, userTeams: UserTeamsSheetData[]): Promise<CurrentUser | null> {
    const teamData = userTeams.find((t) => t.userId === managerId);
    if (!teamData) {
        return null;
    }
    return {
        teamName: teamData?.teamName,
        userName: teamData?.userName,
        id: teamData?.userId,
        divisionId: teamData?.divisionId,
    };
}

async function getCurrentGameweek(): Promise<number> {
    try {
        // Import FPL API cache to get current gameweek
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
        const currentGameweek = await fplApiCache.getCurrentGameweek();
        return currentGameweek || 1; // Fallback to GW1 if unable to determine
    } catch (error) {
        console.error('Error getting current gameweek:', error);
        return 1; // Fallback to GW1
    }
}

/**
 * Helper function to check if division has been set up with new structure
 */
export async function isDivisionSetUpWithNewStructure(divisionId: string): Promise<boolean> {
    try {
        const currentGameweek = await getCurrentGameweek();
        const teamData = await getUserTeamForGameweek(divisionId, 'any_user', currentGameweek);
        return teamData !== null;
    } catch (_error) {
        return false;
    }
}

/**
 * Migration helper - convert old team structure to new if needed
 */
export async function ensureDivisionMigrated(divisionId: string): Promise<void> {
    const isSetUp = await isDivisionSetUpWithNewStructure(divisionId);

    if (!isSetUp) {
        console.warn(`Division ${divisionId} not set up with new structure - migration may be needed`);
        // TODO: Implement migration logic or point to admin tools
        throw new Error(`Division ${divisionId} needs to be migrated to new structure. Please use admin tools.`);
    }
}
