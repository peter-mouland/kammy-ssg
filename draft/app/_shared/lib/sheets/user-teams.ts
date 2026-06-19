/* Location: app/_shared/lib/sheets/user-teams.ts */

import type { UserTeamsSheetData } from '../../../teams/types/team-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
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
    return await dataCache.get(CACHE_KEYS.SHEETS.USER_TEAMS, originalReadUserTeams, {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.USER_TEAMS),
    });
}

/**
 * Get user teams by division ID
 */
export async function getDivisionUserTeams(divisionId: string): Promise<UserTeamsSheetData[]> {
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
