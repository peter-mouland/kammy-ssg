import {
    parseSheetWithHeaders,
    appendToSheet,
    getFieldValue,
    getNumericFieldValue,
    getBooleanFieldValue
} from './sheets.common';

export interface WeeklyPoints {
    user_id: string;
    gameweek: number;
    points: number;
    transfers: number;
    hits: number;
    captain: string;
    vice_captain: string;
    bench_boost: boolean;
    triple_captain: boolean;
    wildcard: boolean;
    free_hit: boolean;
    date_recorded?: string;
}

const SHEET_NAME = 'WeeklyPoints';
const HEADERS = [
    'User ID', 'Gameweek', 'Points', 'Transfers', 'Hits',
    'Captain', 'Vice Captain', 'Bench Boost', 'Triple Captain',
    'Wildcard', 'Free Hit', 'Date Recorded'
];

// Add weekly points
export async function addWeeklyPoints(weeklyData: WeeklyPoints): Promise<boolean> {
    try {
        const values = [[
            weeklyData.user_id,
            weeklyData.gameweek,
            weeklyData.points,
            weeklyData.transfers,
            weeklyData.hits,
            weeklyData.captain,
            weeklyData.vice_captain,
            weeklyData.bench_boost ? 'YES' : 'NO',
            weeklyData.triple_captain ? 'YES' : 'NO',
            weeklyData.wildcard ? 'YES' : 'NO',
            weeklyData.free_hit ? 'YES' : 'NO',
            weeklyData.date_recorded || new Date().toISOString(),
        ]];

        return await appendToSheet(SHEET_NAME, 'A:L', values);
    } catch (error) {
        console.error('Error adding weekly points:', error);
        return false;
    }
}

// Get weekly points history
export async function getWeeklyPointsHistory(userId?: string): Promise<WeeklyPoints[]> {
    try {
        const weeklyData = await parseSheetWithHeaders(SHEET_NAME, (rowData) => ({
            user_id: getFieldValue(rowData, 'User ID', ['user_id']),
            gameweek: getNumericFieldValue(rowData, 'Gameweek', ['gameweek']),
            points: getNumericFieldValue(rowData, 'Points', ['points']),
            transfers: getNumericFieldValue(rowData, 'Transfers', ['transfers']),
            hits: getNumericFieldValue(rowData, 'Hits', ['hits']),
            captain: getFieldValue(rowData, 'Captain', ['captain']),
            vice_captain: getFieldValue(rowData, 'Vice Captain', ['vice_captain']),
            bench_boost: getBooleanFieldValue(rowData, 'Bench Boost', ['bench_boost']),
            triple_captain: getBooleanFieldValue(rowData, 'Triple Captain', ['triple_captain']),
            wildcard: getBooleanFieldValue(rowData, 'Wildcard', ['wildcard']),
            free_hit: getBooleanFieldValue(rowData, 'Free Hit', ['free_hit']),
            date_recorded: getFieldValue(rowData, 'Date Recorded', ['date_recorded']),
        }));

        return userId ? weeklyData.filter(data => data.user_id === userId) : weeklyData;
    } catch (error) {
        console.error('Error getting weekly points history:', error);
        return [];
    }
}

// Get weekly points for specific gameweek
export async function getWeeklyPointsByGameweek(gameweek: number): Promise<WeeklyPoints[]> {
    const allData = await getWeeklyPointsHistory();
    return allData.filter(data => data.gameweek === gameweek);
}

// Get user's weekly points history
export async function getUserWeeklyHistory(userId: string): Promise<WeeklyPoints[]> {
    const userHistory = await getWeeklyPointsHistory(userId);
    return userHistory.sort((a, b) => a.gameweek - b.gameweek);
}

// Get latest gameweek data
export async function getLatestGameweekData(): Promise<{ gameweek: number; data: WeeklyPoints[] }> {
    const allData = await getWeeklyPointsHistory();

    if (allData.length === 0) {
        return { gameweek: 0, data: [] };
    }

    const latestGameweek = Math.max(...allData.map(d => d.gameweek));
    const latestData = allData.filter(d => d.gameweek === latestGameweek);

    return { gameweek: latestGameweek, data: latestData };
}

// Get gameweek summary stats
export async function getGameweekSummary(gameweek: number) {
    const gameweekData = await getWeeklyPointsByGameweek(gameweek);

    if (gameweekData.length === 0) {
        return null;
    }

    const points = gameweekData.map(d => d.points);
    const averagePoints = points.reduce((sum, p) => sum + p, 0) / points.length;
    const highestPoints = Math.max(...points);
    const lowestPoints = Math.min(...points);

    const highestScorer = gameweekData.find(d => d.points === highestPoints);
    const transfers = gameweekData.map(d => d.transfers);
    const totalTransfers = transfers.reduce((sum, t) => sum + t, 0);

    const chips = {
        bench_boost: gameweekData.filter(d => d.bench_boost).length,
        triple_captain: gameweekData.filter(d => d.triple_captain).length,
        wildcard: gameweekData.filter(d => d.wildcard).length,
        free_hit: gameweekData.filter(d => d.free_hit).length,
    };

    return {
        gameweek,
        total_managers: gameweekData.length,
        average_points: Math.round(averagePoints * 100) / 100,
        highest_points: highestPoints,
        lowest_points: lowestPoints,
        highest_scorer: highestScorer?.user_id,
        total_transfers: totalTransfers,
        average_transfers: Math.round((totalTransfers / gameweekData.length) * 100) / 100,
        chips_used: chips,
    };
}

// Get season summary for user
export async function getUserSeasonSummary(userId: string) {
    const userHistory = await getUserWeeklyHistory(userId);

    if (userHistory.length === 0) {
        return null;
    }

    const totalPoints = userHistory.reduce((sum, gw) => sum + gw.points, 0);
    const totalTransfers = userHistory.reduce((sum, gw) => sum + gw.transfers, 0);
    const totalHits = userHistory.reduce((sum, gw) => sum + gw.hits, 0);

    const gameweeksPlayed = userHistory.length;
    const averagePoints = Math.round((totalPoints / gameweeksPlayed) * 100) / 100;

    const bestGameweek = userHistory.reduce((best, gw) =>
        gw.points > best.points ? gw : best
    );

    const worstGameweek = userHistory.reduce((worst, gw) =>
        gw.points < worst.points ? gw : worst
    );

    const chipsUsed = {
        bench_boost: userHistory.filter(gw => gw.bench_boost).length,
        triple_captain: userHistory.filter(gw => gw.triple_captain).length,
        wildcard: userHistory.filter(gw => gw.wildcard).length,
        free_hit: userHistory.filter(gw => gw.free_hit).length,
    };

    return {
        user_id: userId,
        gameweeks_played: gameweeksPlayed,
        total_points: totalPoints,
        average_points: averagePoints,
        total_transfers: totalTransfers,
        total_hits: totalHits,
        best_gameweek: bestGameweek,
        worst_gameweek: worstGameweek,
        chips_used: chipsUsed,
    };
}

export { SHEET_NAME as WEEKLY_POINTS_SHEET_NAME, HEADERS as WEEKLY_POINTS_HEADERS };
