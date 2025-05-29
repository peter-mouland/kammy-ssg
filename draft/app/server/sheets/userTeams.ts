import type { UserTeamData } from '../../types';
import {
    readSheetRange,
    writeSheetRange,
    appendToSheet,
    parseHeaderBasedData,
    convertToSheetRows,
    parseSheetNumber,
    parseSheetDate,
    createAppError,
    type SheetRange
} from './common';

// Sheet configuration
const USER_TEAMS_SHEET_NAME = 'UserTeams';
const USER_TEAMS_HEADERS = {
    'User ID': 'userId' as keyof UserTeamData,
    'User Name': 'userName' as keyof UserTeamData,
    'Team Name': 'teamName' as keyof UserTeamData,
    'FPL ID': 'fplId' as keyof UserTeamData,
    'Division ID': 'divisionId' as keyof UserTeamData,
    'Current GW Points': 'currentGwPoints' as keyof UserTeamData,
    'Total Points': 'totalPoints' as keyof UserTeamData,
    'Overall Rank': 'overallRank' as keyof UserTeamData,
    'League Rank': 'leagueRank' as keyof UserTeamData,
    'Last Updated': 'lastUpdated' as keyof UserTeamData
};

// Transform functions for parsing
const USER_TEAMS_TRANSFORM_FUNCTIONS: Partial<Record<keyof UserTeamData, (value: any) => any>> = {
    currentGwPoints: parseSheetNumber,
    totalPoints: parseSheetNumber,
    overallRank: parseSheetNumber,
    leagueRank: parseSheetNumber,
    lastUpdated: parseSheetDate
};

/**
 * Read all user teams from the sheet
 */
export async function readUserTeams(
): Promise<UserTeamData[]> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${USER_TEAMS_SHEET_NAME}'!A:J`
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<UserTeamData>(
            rawData,
            USER_TEAMS_HEADERS,
            USER_TEAMS_TRANSFORM_FUNCTIONS
        );
    } catch (error) {
        throw createAppError(
            'USER_TEAMS_READ_ERROR',
            'Failed to read user teams from sheet',
            error
        );
    }
}

/**
 * Write user teams to the sheet (overwrites existing data)
 */
export async function writeUserTeams(
    userTeams: UserTeamData[]
): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        // Transform dates to ISO strings for sheet storage
        const transformedTeams = userTeams.map(team => ({
            ...team,
            lastUpdated: team.lastUpdated.toISOString()
        }));

        const sheetRows = convertToSheetRows(transformedTeams, USER_TEAMS_HEADERS, true);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${USER_TEAMS_SHEET_NAME}'!A:J`
        };

        await writeSheetRange(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'USER_TEAMS_WRITE_ERROR',
            'Failed to write user teams to sheet',
            error
        );
    }
}

/**
 * Add a new user team to the sheet
 */
export async function addUserTeam(
    userTeam: UserTeamData
): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const transformedTeam = {
            ...userTeam,
            lastUpdated: userTeam.lastUpdated.toISOString()
        };

        const sheetRows = convertToSheetRows([transformedTeam], USER_TEAMS_HEADERS, false);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${USER_TEAMS_SHEET_NAME}'!A:J`
        };

        await appendToSheet(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'USER_TEAM_ADD_ERROR',
            'Failed to add user team to sheet',
            error
        );
    }
}

/**
 * Find a user team by user ID
 */
export async function findUserTeamById(
    userId: string
): Promise<UserTeamData | null> {
    try {
        const userTeams = await readUserTeams();
        return userTeams.find(team => team.userId === userId) || null;
    } catch (error) {
        throw createAppError(
            'USER_TEAM_FIND_ERROR',
            `Failed to find user team with ID: ${userId}`,
            error
        );
    }
}

/**
 * Get user teams by division ID
 */
export async function getUserTeamsByDivision(
    divisionId: string
): Promise<UserTeamData[]> {
    try {
        const userTeams = await readUserTeams();
        return userTeams.filter(team => team.divisionId === divisionId);
    } catch (error) {
        throw createAppError(
            'USER_TEAMS_DIVISION_ERROR',
            `Failed to get user teams for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Get user teams ordered by league rank
 */
export async function getUserTeamsOrderedByRank(
    divisionId?: string
): Promise<UserTeamData[]> {
    try {
        let userTeams = await readUserTeams();

        if (divisionId) {
            userTeams = userTeams.filter(team => team.divisionId === divisionId);
        }

        return userTeams.sort((a, b) => a.leagueRank - b.leagueRank);
    } catch (error) {
        throw createAppError(
            'USER_TEAMS_RANK_ERROR',
            'Failed to get user teams ordered by rank',
            error
        );
    }
}

/**
 * Update a user team by user ID
 */
export async function updateUserTeam(
    userId: string,
    updates: Partial<UserTeamData>
): Promise<boolean> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const userTeams = await readUserTeams();
        const teamIndex = userTeams.findIndex(team => team.userId === userId);

        if (teamIndex === -1) {
            return false;
        }

        // Update lastUpdated timestamp
        const updatedTeam = {
            ...userTeams[teamIndex],
            ...updates,
            lastUpdated: new Date()
        };

        userTeams[teamIndex] = updatedTeam;
        await writeUserTeams(userTeams);

        return true;
    } catch (error) {
        throw createAppError(
            'USER_TEAM_UPDATE_ERROR',
            `Failed to update user team with ID: ${userId}`,
            error
        );
    }
}

/**
 * Delete a user team by user ID
 */
export async function deleteUserTeam(
    userId: string
): Promise<boolean> {
    try {
        const userTeams = await readUserTeams();
        const filteredTeams = userTeams.filter(team => team.userId !== userId);

        if (filteredTeams.length === userTeams.length) {
            return false; // Team not found
        }

        await writeUserTeams(filteredTeams);
        return true;
    } catch (error) {
        throw createAppError(
            'USER_TEAM_DELETE_ERROR',
            `Failed to delete user team with ID: ${userId}`,
            error
        );
    }
}

/**
 * Update FPL data for multiple users
 */
export async function updateFplDataForUsers(
    fplUpdates: Array<{
        userId: string;
        currentGwPoints: number;
        totalPoints: number;
        overallRank: number;
    }>
): Promise<void> {
    try {
        const userTeams = await readUserTeams();
        const updateMap = new Map(fplUpdates.map(update => [update.userId, update]));

        // Update teams with new FPL data
        const updatedTeams = userTeams.map(team => {
            const fplUpdate = updateMap.get(team.userId);
            if (fplUpdate) {
                return {
                    ...team,
                    currentGwPoints: fplUpdate.currentGwPoints,
                    totalPoints: fplUpdate.totalPoints,
                    overallRank: fplUpdate.overallRank,
                    lastUpdated: new Date()
                };
            }
            return team;
        });

        await writeUserTeams(updatedTeams);
    } catch (error) {
        throw createAppError(
            'FPL_DATA_UPDATE_ERROR',
            'Failed to update FPL data for users',
            error
        );
    }
}

/**
 * Recalculate league ranks for all teams
 */
export async function recalculateLeagueRanks(
    spreadsheetId: string,
    divisionId?: string
): Promise<void> {
    try {
        let userTeams = await readUserTeams();

        if (divisionId) {
            // Recalculate ranks within division only
            const divisionTeams = userTeams.filter(team => team.divisionId === divisionId);
            const otherTeams = userTeams.filter(team => team.divisionId !== divisionId);

            // Sort by total points (descending)
            divisionTeams.sort((a, b) => b.totalPoints - a.totalPoints);

            // Assign ranks
            divisionTeams.forEach((team, index) => {
                team.leagueRank = index + 1;
                team.lastUpdated = new Date();
            });

            userTeams = [...otherTeams, ...divisionTeams];
        } else {
            // Recalculate ranks for all teams
            userTeams.sort((a, b) => b.totalPoints - a.totalPoints);
            userTeams.forEach((team, index) => {
                team.leagueRank = index + 1;
                team.lastUpdated = new Date();
            });
        }

        await writeUserTeams(userTeams);
    } catch (error) {
        throw createAppError(
            'LEAGUE_RANKS_UPDATE_ERROR',
            'Failed to recalculate league ranks',
            error
        );
    }
}

/**
 * Validate user team data
 */
export function validateUserTeamData(data: Partial<UserTeamData>): string[] {
    const errors: string[] = [];

    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
        errors.push('User ID is required and must be a non-empty string');
    }

    if (!data.userName || typeof data.userName !== 'string' || data.userName.trim().length === 0) {
        errors.push('User name is required and must be a non-empty string');
    }

    if (!data.teamName || typeof data.teamName !== 'string' || data.teamName.trim().length === 0) {
        errors.push('Team name is required and must be a non-empty string');
    }

    if (!data.fplId || typeof data.fplId !== 'string' || data.fplId.trim().length === 0) {
        errors.push('FPL ID is required and must be a non-empty string');
    }

    if (!data.divisionId || typeof data.divisionId !== 'string' || data.divisionId.trim().length === 0) {
        errors.push('Division ID is required and must be a non-empty string');
    }

    if (data.currentGwPoints !== undefined && (typeof data.currentGwPoints !== 'number' || data.currentGwPoints < 0)) {
        errors.push('Current GW points must be a non-negative number');
    }

    if (data.totalPoints !== undefined && (typeof data.totalPoints !== 'number' || data.totalPoints < 0)) {
        errors.push('Total points must be a non-negative number');
    }

    if (data.overallRank !== undefined && (typeof data.overallRank !== 'number' || data.overallRank < 1)) {
        errors.push('Overall rank must be a positive number');
    }

    if (data.leagueRank !== undefined && (typeof data.leagueRank !== 'number' || data.leagueRank < 1)) {
        errors.push('League rank must be a positive number');
    }

    return errors;
}

/**
 * Check if user ID is unique
 */
export async function isUserIdUnique(
    userId: string
): Promise<boolean> {
    try {
        const userTeams = await readUserTeams();
        return !userTeams.some(team => team.userId === userId);
    } catch (error) {
        throw createAppError(
            'USER_ID_UNIQUE_CHECK_ERROR',
            `Failed to check if user ID is unique: ${userId}`,
            error
        );
    }
}

/**
 * Check if FPL ID is unique
 */
export async function isFplIdUnique(
    fplId: string
): Promise<boolean> {
    try {
        const userTeams = await readUserTeams();
        return !userTeams.some(team => team.fplId === fplId);
    } catch (error) {
        throw createAppError(
            'FPL_ID_UNIQUE_CHECK_ERROR',
            `Failed to check if FPL ID is unique: ${fplId}`,
            error
        );
    }
}
