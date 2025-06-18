// app/teams/server/team.server.ts
import {
    getUserTeamForGameweek,
    getUserTeamHistory,
    getAvailableGameweeks as getAvailableGameweeksFromService
} from '../../_shared/services/division-teams.service';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { getUserTeamsByDivision } from '../../_shared/lib/sheets/user-teams';
import type { TeamViewData } from '../types/team-view-types';
import type { TeamGameweekData } from '../../_shared/types/division-teams-types';

export async function loadTeamData(url: URL, params: any): Promise<TeamViewData> {
    try {
        // Get current user from session/auth (you'll need to implement this)
        const currentUser = await getCurrentUser(url);
        if (!currentUser) {
            throw new Error("User not authenticated");
        }

        // Get user's division
        const divisions = await readDivisions();
        const userTeams = await getUserTeamsByDivision(currentUser.divisionId);
        const userTeam = userTeams.find(team => team.userId === currentUser.id);

        if (!userTeam) {
            throw new Error("User team not found");
        }

        const division = divisions.find(d => d.id === userTeam.divisionId);
        if (!division) {
            throw new Error("Division not found");
        }

        // Get current gameweek
        const currentGameweek = await getCurrentGameweek();

        // Get current team data from new division-teams structure
        const currentTeam = await getUserTeamForGameweek(
            userTeam.divisionId,
            currentUser.id,
            currentGameweek
        );

        if (!currentTeam) {
            throw new Error("Current team data not found - division may not be set up yet");
        }

        // Get historical team data
        const gameweekHistory = await getUserTeamHistory(
            userTeam.divisionId,
            currentUser.id,
            0, // Start from draft (gameweek 0)
            currentGameweek
        );

        // Get available gameweeks from service
        const availableGameweeks = await getAvailableGameweeksFromService(userTeam.divisionId);

        return {
            currentUser: {
                id: currentUser.id,
                userName: userTeam.userName,
                teamName: userTeam.teamName
            },
            division: {
                id: division.id,
                name: division.name
            },
            currentGameweek,
            currentTeam,
            gameweekHistory,
            availableGameweeks: availableGameweeks.sort((a, b) => a - b)
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
    gameweek?: number
): Promise<TeamGameweekData | null> {
    try {
        const targetGameweek = gameweek ?? await getCurrentGameweek();
        return await getUserTeamForGameweek(divisionId, userId, targetGameweek);
    } catch (error) {
        console.error('Get user team from division error:', error);
        return null;
    }
}

/**
 * Placeholder functions - implement these based on your auth and game state logic
 */
async function getCurrentUser(url: URL): Promise<{ id: string; divisionId: string } | null> {
    // TODO: Implement actual user authentication
    // This might come from cookies, session, JWT, etc.

    // For now, return a mock user - replace with real auth logic
    return {
        id: 'naked',
        divisionId: 'leagueOne'
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
    } catch (error) {
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
