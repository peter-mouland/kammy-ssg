import { parseSheetWithHeaders, writeSheetWithHeaders, getFieldValue, getNumericFieldValue } from './sheets.common';

export interface UserTeamData {
    user_id: string;
    user_name: string;
    team_name: string;
    fpl_id: number;
    division_id: string;
    current_gw_points: number;
    total_points: number;
    overall_rank: number;
    league_rank: number;
    last_updated: string;
}

const SHEET_NAME = 'UserTeams';
const HEADERS = [
    'User ID', 'User Name', 'Team Name', 'FPL ID', 'Division ID',
    'Current GW Points', 'Total Points', 'Overall Rank', 'League Rank', 'Last Updated'
];

// Read user team data
export async function getUserTeamData(): Promise<UserTeamData[]> {
    try {
        return await parseSheetWithHeaders(SHEET_NAME, (rowData) => ({
            user_id: getFieldValue(rowData, 'User ID', ['user_id', 'UserID', 'ID']),
            user_name: getFieldValue(rowData, 'User Name', ['user_name', 'UserName', 'Manager Name', 'Name']),
            team_name: getFieldValue(rowData, 'Team Name', ['team_name', 'TeamName', 'Team']),
            fpl_id: getNumericFieldValue(rowData, 'FPL ID', ['fpl_id', 'FPLID', 'FPL_ID']),
            division_id: getFieldValue(rowData, 'Division ID', ['division_id', 'DivisionID', 'Division']),
            current_gw_points: getNumericFieldValue(rowData, 'Current GW Points', ['current_gw_points', 'GW Points', 'Current Points']),
            total_points: getNumericFieldValue(rowData, 'Total Points', ['total_points', 'TotalPoints', 'Points']),
            overall_rank: getNumericFieldValue(rowData, 'Overall Rank', ['overall_rank', 'OverallRank', 'Rank']),
            league_rank: getNumericFieldValue(rowData, 'League Rank', ['league_rank', 'LeagueRank']),
            last_updated: getFieldValue(rowData, 'Last Updated', ['last_updated', 'LastUpdated', 'Updated']) || new Date().toISOString(),
        }));
    } catch (error) {
        console.error('Error reading user team data:', error);

        if (error instanceof Error) {
            if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                throw new Error('Network error: Unable to connect to Google Sheets API. Check your internet connection.');
            }
            if (error.message.includes('403')) {
                throw new Error('Permission denied: Check that the service account has access to the spreadsheet.');
            }
            if (error.message.includes('404')) {
                throw new Error('Spreadsheet not found: Check the GOOGLE_SHEETS_ID environment variable.');
            }
        }

        throw error;
    }
}

// Update user team data
export async function updateUserTeamData(userData: UserTeamData[]): Promise<boolean> {
    try {
        const dataRows = userData.map(user => [
            user.user_id, user.user_name, user.team_name, user.fpl_id, user.division_id,
            user.current_gw_points, user.total_points, user.overall_rank, user.league_rank, user.last_updated,
        ]);

        return await writeSheetWithHeaders(SHEET_NAME, HEADERS, dataRows);
    } catch (error) {
        console.error('Error updating user team data:', error);
        return false;
    }
}

// Get users by division
export async function getUsersByDivision(divisionId: string): Promise<UserTeamData[]> {
    const allUsers = await getUserTeamData();
    return allUsers.filter(user => user.division_id === divisionId);
}

// Get user by ID
export async function getUserById(userId: string): Promise<UserTeamData | null> {
    const allUsers = await getUserTeamData();
    return allUsers.find(user => user.user_id === userId) || null;
}

// Add or update single user
export async function upsertUser(userData: UserTeamData): Promise<boolean> {
    try {
        const allUsers = await getUserTeamData();
        const existingIndex = allUsers.findIndex(user => user.user_id === userData.user_id);

        if (existingIndex >= 0) {
            allUsers[existingIndex] = userData;
        } else {
            allUsers.push(userData);
        }

        return await updateUserTeamData(allUsers);
    } catch (error) {
        console.error('Error upserting user:', error);
        return false;
    }
}

export { SHEET_NAME as USERS_SHEET_NAME, HEADERS as USERS_HEADERS };
