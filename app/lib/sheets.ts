// Main sheets integration file - brings everything together
export { getGoogleSheetsClient, testConnection } from './sheets.base';
export {
    parseSheetWithHeaders,
    writeSheetWithHeaders,
    appendToSheet,
    clearSheetRange,
    ensureSheetExists,
    getFieldValue,
    getNumericFieldValue,
    getFloatFieldValue,
    getBooleanFieldValue
} from './sheets.common';

// Divisions
export {
    getDivisions,
    addDivision,
    getDivisionById,
    getDivisionsSorted,
    DIVISIONS_SHEET_NAME,
    DIVISIONS_HEADERS
} from './sheet.divisions';
export type { Division } from './sheet.divisions';

// Users/Teams
export {
    getUserTeamData,
    updateUserTeamData,
    getUsersByDivision,
    getUserById,
    upsertUser,
    USERS_SHEET_NAME,
    USERS_HEADERS
} from './sheet.users';
export type { UserTeamData } from './sheet.users';

// Custom Players
export {
    getCustomPlayers,
    getCustomPlayersWithFPLData,
    getCustomPlayerById,
    getCustomPlayersByPosition,
    getCustomPlayersByTeam,
    getCustomPlayerPositions,
    getCustomPlayerTeams,
    PLAYERS_SHEET_NAME,
    PLAYERS_HEADERS
} from './sheet.players';
export type { CustomPlayer } from './sheet.players';

// Draft System
export {
    getDraftPicks,
    addDraftPick,
    getDraftPicksByUser,
    getDraftPicksByDivision,
    getDraftState,
    updateDraftState,
    getDraftOrder,
    setDraftOrder,
    generateRandomDraftOrder,
    getDraftOrderByDivision,
    getAvailablePlayers,
    getAvailablePlayersByPosition,
    getDraftSummary,
    DRAFT_SHEET_NAME,
    DRAFT_HEADERS,
    DRAFT_STATE_SHEET_NAME,
    DRAFT_STATE_HEADERS,
    DRAFT_ORDER_SHEET_NAME,
    DRAFT_ORDER_HEADERS
} from './sheet.draft';
export type { DraftPick, DraftState, DraftOrder } from './sheet.draft';

// Weekly Points
export {
    addWeeklyPoints,
    getWeeklyPointsHistory,
    getWeeklyPointsByGameweek,
    getUserWeeklyHistory,
    getLatestGameweekData,
    getGameweekSummary,
    getUserSeasonSummary,
    WEEKLY_POINTS_SHEET_NAME,
    WEEKLY_POINTS_HEADERS
} from './sheet.weekly-points';
export type { WeeklyPoints } from './sheet.weekly-points';

// Initialize all sheets
export async function initializeSheets(): Promise<boolean> {
    try {
        const { ensureSheetExists } = await import('./sheets.common');
        const { DIVISIONS_HEADERS } = await import('./sheet.divisions');
        const { USERS_HEADERS } = await import('./sheet.users');
        const { PLAYERS_HEADERS } = await import('./sheet.players');
        const { DRAFT_HEADERS, DRAFT_STATE_HEADERS, DRAFT_ORDER_HEADERS } = await import('./sheet.draft');
        const { WEEKLY_POINTS_HEADERS } = await import('./sheet.weekly-points');

        const sheetsToCreate = [
            { name: 'Divisions', headers: DIVISIONS_HEADERS },
            { name: 'UserTeams', headers: USERS_HEADERS },
            { name: 'Players', headers: PLAYERS_HEADERS }, // YOUR custom players
            { name: 'Draft', headers: DRAFT_HEADERS },
            { name: 'DraftState', headers: DRAFT_STATE_HEADERS },
            { name: 'DraftOrder', headers: DRAFT_ORDER_HEADERS },
            { name: 'WeeklyPoints', headers: WEEKLY_POINTS_HEADERS }
        ];

        const results = await Promise.all(
            sheetsToCreate.map(sheet => ensureSheetExists(sheet.name, sheet.headers))
        );

        const allSuccessful = results.every(result => result);

        if (allSuccessful) {
            console.log('All sheets initialized successfully');
        } else {
            console.error('Some sheets failed to initialize');
        }

        return allSuccessful;
    } catch (error) {
        console.error('Error initializing sheets:', error);
        return false;
    }
}
