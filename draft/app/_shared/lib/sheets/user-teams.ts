/* Location: app/_shared/lib/sheets/user-teams.ts */

import type { UserTeamsSheetData } from '../../../teams/types/team-types';
import { sheetsCache } from './cache/sheets-cache-service';
import { CACHE_CONFIG } from './cache-config';
import { createAppError, parseHeaderBasedData, parseSheetDate, readSheetRange, type SheetRange } from './utils/common';

// Sheet configuration
const USER_TEAMS_SHEET_NAME = 'UserTeams';
const USER_TEAMS_HEADERS = {
    'User ID': 'userId' as keyof UserTeamsSheetData,
    'User Name': 'userName' as keyof UserTeamsSheetData,
    'Team Name': 'teamName' as keyof UserTeamsSheetData,
    'Division ID': 'divisionId' as keyof UserTeamsSheetData,
    'Last Updated': 'lastUpdated' as keyof UserTeamsSheetData,
};

// Transform functions for parsing
const USER_TEAMS_TRANSFORM_FUNCTIONS: Partial<Record<keyof UserTeamsSheetData, (value: any) => any>> = {
    lastUpdated: parseSheetDate,
};

/**
 * Read all user teams from the sheet
 */
async function originalReadUserTeams(): Promise<UserTeamsSheetData[]> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${USER_TEAMS_SHEET_NAME}'!A:J`,
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<UserTeamsSheetData>(rawData, USER_TEAMS_HEADERS, USER_TEAMS_TRANSFORM_FUNCTIONS);
    } catch (error) {
        throw createAppError('USER_TEAMS_READ_ERROR', 'Failed to read user teams from sheet', error);
    }
}
export async function readUserTeams() {
    return sheetsCache.get('user-teams-all', () => originalReadUserTeams(), { ttlMs: CACHE_CONFIG.userTeams });
}

/**
 * Get user teams by division ID
 */
async function originalGetUserTeamsByDivision(divisionId: string): Promise<UserTeamsSheetData[]> {
    try {
        const userTeams = await readUserTeams();
        return userTeams.filter((team) => team.divisionId === divisionId);
    } catch (error) {
        throw createAppError(
            'USER_TEAMS_DIVISION_ERROR',
            `Failed to get user teams for division: ${divisionId}`,
            error,
        );
    }
}
export async function getUserTeamsByDivision(divisionId: string) {
    return sheetsCache.get(`user-teams-division-${divisionId}`, () => originalGetUserTeamsByDivision(divisionId), {
        ttlMs: CACHE_CONFIG.divisionUserTeams,
    });
}
