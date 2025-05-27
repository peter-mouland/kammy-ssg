import type { PlayerGameweekStatsData, PlayerSeasonStatsData } from '../../types';
import {
    readSheetRange,
    writeSheetRange,
    appendToSheet,
    parseHeaderBasedData,
    convertToSheetRows,
    parseSheetNumber,
    parseSheetDate,
    createAppError,
    batchSheetOperations,
    type SheetRange
} from './common';

// Player Gameweek Stats sheet configuration
const PLAYER_GAMEWEEK_STATS_SHEET_NAME = 'PlayerGameweekStats';
const PLAYER_GAMEWEEK_STATS_HEADERS = {
    'Player ID': 'playerId' as keyof PlayerGameweekStatsData,
    'Gameweek': 'gameweek' as keyof PlayerGameweekStatsData,
    'Minutes Played': 'minutesPlayed' as keyof PlayerGameweekStatsData,
    'Goals': 'goals' as keyof PlayerGameweekStatsData,
    'Assists': 'assists' as keyof PlayerGameweekStatsData,
    'Clean Sheets': 'cleanSheets' as keyof PlayerGameweekStatsData,
    'Goals Conceded': 'goalsConceded' as keyof PlayerGameweekStatsData,
    'Penalties Saved': 'penaltiesSaved' as keyof PlayerGameweekStatsData,
    'Yellow Cards': 'yellowCards' as keyof PlayerGameweekStatsData,
    'Red Cards': 'redCards' as keyof PlayerGameweekStatsData,
    'Saves': 'saves' as keyof PlayerGameweekStatsData,
    'Bonus Points': 'bonusPoints' as keyof PlayerGameweekStatsData,
    'Fixture Minutes': 'fixtureMinutes' as keyof PlayerGameweekStatsData,
    'Updated At': 'updatedAt' as keyof PlayerGameweekStatsData
};

// Player Season Stats sheet configuration
const PLAYER_SEASON_STATS_SHEET_NAME = 'PlayerSeasonStats';
const PLAYER_SEASON_STATS_HEADERS = {
    'Player ID': 'playerId' as keyof PlayerSeasonStatsData,
    'Season': 'season' as keyof PlayerSeasonStatsData,
    'Total Minutes': 'totalMinutes' as keyof PlayerSeasonStatsData,
    'Games Played': 'gamesPlayed' as keyof PlayerSeasonStatsData,
    'Goals': 'goals' as keyof PlayerSeasonStatsData,
    'Assists': 'assists' as keyof PlayerSeasonStatsData,
    'Clean Sheets': 'cleanSheets' as keyof PlayerSeasonStatsData,
    'Goals Conceded': 'goalsConceded' as keyof PlayerSeasonStatsData,
    'Penalties Saved': 'penaltiesSaved' as keyof PlayerSeasonStatsData,
    'Yellow Cards': 'yellowCards' as keyof PlayerSeasonStatsData,
    'Red Cards': 'redCards' as keyof PlayerSeasonStatsData,
    'Saves': 'saves' as keyof PlayerSeasonStatsData,
    'Bonus Points': 'bonusPoints' as keyof PlayerSeasonStatsData,
    'Updated At': 'updatedAt' as keyof PlayerSeasonStatsData
};

// Transform functions for parsing
const PLAYER_GAMEWEEK_STATS_TRANSFORM_FUNCTIONS: Partial<Record<keyof PlayerGameweekStatsData, (value: any) => any>> = {
    gameweek: parseSheetNumber,
    minutesPlayed: parseSheetNumber,
    goals: parseSheetNumber,
    assists: parseSheetNumber,
    cleanSheets: parseSheetNumber,
    goalsConceded: parseSheetNumber,
    penaltiesSaved: parseSheetNumber,
    yellowCards: parseSheetNumber,
    redCards: parseSheetNumber,
    saves: parseSheetNumber,
    bonusPoints: parseSheetNumber,
    fixtureMinutes: parseSheetNumber,
    updatedAt: parseSheetDate
};

const PLAYER_SEASON_STATS_TRANSFORM_FUNCTIONS: Partial<Record<keyof PlayerSeasonStatsData, (value: any) => any>> = {
    totalMinutes: parseSheetNumber,
    gamesPlayed: parseSheetNumber,
    goals: parseSheetNumber,
    assists: parseSheetNumber,
    cleanSheets: parseSheetNumber,
    goalsConceded: parseSheetNumber,
    penaltiesSaved: parseSheetNumber,
    yellowCards: parseSheetNumber,
    redCards: parseSheetNumber,
    saves: parseSheetNumber,
    bonusPoints: parseSheetNumber,
    updatedAt: parseSheetDate
};

/**
 * Read all player gameweek stats from the sheet
 */
export async function readPlayerGameweekStats(
): Promise<PlayerGameweekStatsData[]> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYER_GAMEWEEK_STATS_SHEET_NAME}'!A:N`
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<PlayerGameweekStatsData>(
            rawData,
            PLAYER_GAMEWEEK_STATS_HEADERS,
            PLAYER_GAMEWEEK_STATS_TRANSFORM_FUNCTIONS
        );
    } catch (error) {
        throw createAppError(
            'PLAYER_GAMEWEEK_STATS_READ_ERROR',
            'Failed to read player gameweek stats from sheet',
            error
        );
    }
}

/**
 * Get player gameweek stats for a specific player
 */
export async function getPlayerGameweekStats(
    playerId: string
): Promise<PlayerGameweekStatsData[]> {
    try {
        const allStats = await readPlayerGameweekStats();
        return allStats
            .filter(stats => stats.playerId === playerId)
            .sort((a, b) => a.gameweek - b.gameweek);
    } catch (error) {
        throw createAppError(
            'PLAYER_GAMEWEEK_STATS_GET_ERROR',
            `Failed to get gameweek stats for player: ${playerId}`,
            error
        );
    }
}

/**
 * Get player stats for a specific gameweek
 */
export async function getGameweekPlayerStats(
    gameweek: number
): Promise<PlayerGameweekStatsData[]> {
    try {
        const allStats = await readPlayerGameweekStats();
        return allStats.filter(stats => stats.gameweek === gameweek);
    } catch (error) {
        throw createAppError(
            'GAMEWEEK_PLAYER_STATS_ERROR',
            `Failed to get player stats for gameweek: ${gameweek}`,
            error
        );
    }
}

/**
 * Add or update player gameweek stats
 */
export async function upsertPlayerGameweekStats(
    stats: PlayerGameweekStatsData[]
): Promise<void> {
    try {
        const allStats = await readPlayerGameweekStats();
        const statsMap = new Map(
            allStats.map(stat => [`${stat.playerId}-${stat.gameweek}`, stat])
        );

        // Update or add new stats
        stats.forEach(newStat => {
            const key = `${newStat.playerId}-${newStat.gameweek}`;
            statsMap.set(key, { ...newStat, updatedAt: new Date() });
        });

        const updatedStats = Array.from(statsMap.values());
        await writePlayerGameweekStats(updatedStats);
    } catch (error) {
        throw createAppError(
            'PLAYER_GAMEWEEK_STATS_UPSERT_ERROR',
            'Failed to upsert player gameweek stats',
            error
        );
    }
}

/**
 * Write player gameweek stats to the sheet
 */
export async function writePlayerGameweekStats(
    stats: PlayerGameweekStatsData[]
): Promise<void> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const transformedStats = stats.map(stat => ({
            ...stat,
            updatedAt: stat.updatedAt.toISOString()
        }));

        const sheetRows = convertToSheetRows(transformedStats, PLAYER_GAMEWEEK_STATS_HEADERS, true);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYER_GAMEWEEK_STATS_SHEET_NAME}'!A:N`
        };

        await writeSheetRange(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'PLAYER_GAMEWEEK_STATS_WRITE_ERROR',
            'Failed to write player gameweek stats to sheet',
            error
        );
    }
}

/**
 * Read all player season stats from the sheet
 */
export async function readPlayerSeasonStats(
): Promise<PlayerSeasonStatsData[]> {

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
    try {
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYER_SEASON_STATS_SHEET_NAME}'!A:N`
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<PlayerSeasonStatsData>(
            rawData,
            PLAYER_SEASON_STATS_HEADERS,
            PLAYER_SEASON_STATS_TRANSFORM_FUNCTIONS
        );
    } catch (error) {
        throw createAppError(
            'PLAYER_SEASON_STATS_READ_ERROR',
            'Failed to read player season stats from sheet',
            error
        );
    }
}

/**
 * Get player season stats for a specific player and season
 */
export async function getPlayerSeasonStats(
    playerId: string,
    season: string
): Promise<PlayerSeasonStatsData | null> {
    try {
        const allStats = await readPlayerSeasonStats();
        return allStats.find(stats =>
            stats.playerId === playerId && stats.season === season
        ) || null;
    } catch (error) {
        throw createAppError(
            'PLAYER_SEASON_STATS_GET_ERROR',
            `Failed to get season stats for player: ${playerId}, season: ${season}`,
            error
        );
    }
}

/**
 * Update or create player season stats
 */
export async function upsertPlayerSeasonStats(
    stats: PlayerSeasonStatsData[]
): Promise<void> {
    try {
        const allStats = await readPlayerSeasonStats();
        const statsMap = new Map(
            allStats.map(stat => [`${stat.playerId}-${stat.season}`, stat])
        );

        // Update or add new stats
        stats.forEach(newStat => {
            const key = `${newStat.playerId}-${newStat.season}`;
            statsMap.set(key, { ...newStat, updatedAt: new Date() });
        });

        const updatedStats = Array.from(statsMap.values());
        await writePlayerSeasonStats(updatedStats);
    } catch (error) {
        throw createAppError(
            'PLAYER_SEASON_STATS_UPSERT_ERROR',
            'Failed to upsert player season stats',
            error
        );
    }
}

/**
 * Write player season stats to the sheet
 */
export async function writePlayerSeasonStats(
    stats: PlayerSeasonStatsData[]
): Promise<void> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const transformedStats = stats.map(stat => ({
            ...stat,
            updatedAt: stat.updatedAt.toISOString()
        }));

        const sheetRows = convertToSheetRows(transformedStats, PLAYER_SEASON_STATS_HEADERS, true);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYER_SEASON_STATS_SHEET_NAME}'!A:N`
        };

        await writeSheetRange(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'PLAYER_SEASON_STATS_WRITE_ERROR',
            'Failed to write player season stats to sheet',
            error
        );
    }
}

/**
 * Calculate season stats from gameweek data
 */
export async function calculateSeasonStatsFromGameweeks(
    playerId: string,
    season: string
): Promise<PlayerSeasonStatsData> {
    try {
        const gameweekStats = await getPlayerGameweekStats(playerId);

        const seasonStats: PlayerSeasonStatsData = {
            playerId,
            season,
            totalMinutes: 0,
            gamesPlayed: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            goalsConceded: 0,
            penaltiesSaved: 0,
            yellowCards: 0,
            redCards: 0,
            saves: 0,
            bonusPoints: 0,
            updatedAt: new Date()
        };

        gameweekStats.forEach(gwStat => {
            seasonStats.totalMinutes += gwStat.minutesPlayed;
            seasonStats.goals += gwStat.goals;
            seasonStats.assists += gwStat.assists;
            seasonStats.cleanSheets += gwStat.cleanSheets;
            seasonStats.goalsConceded += gwStat.goalsConceded;
            seasonStats.penaltiesSaved += gwStat.penaltiesSaved;
            seasonStats.yellowCards += gwStat.yellowCards;
            seasonStats.redCards += gwStat.redCards;
            seasonStats.saves += gwStat.saves;
            seasonStats.bonusPoints += gwStat.bonusPoints;

            if (gwStat.minutesPlayed > 0) {
                seasonStats.gamesPlayed++;
            }
        });

        return seasonStats;
    } catch (error) {
        throw createAppError(
            'SEASON_STATS_CALCULATION_ERROR',
            `Failed to calculate season stats for player: ${playerId}`,
            error
        );
    }
}

/**
 * Batch update multiple players' stats
 */
export async function batchUpdatePlayerStats(
    gameweekStats: PlayerGameweekStatsData[],
    seasonStats: PlayerSeasonStatsData[]
): Promise<void> {
    try {
        const operations = [];

        if (gameweekStats.length > 0) {
            await upsertPlayerGameweekStats(gameweekStats);
        }

        if (seasonStats.length > 0) {
            await upsertPlayerSeasonStats(seasonStats);
        }
    } catch (error) {
        throw createAppError(
            'BATCH_PLAYER_STATS_UPDATE_ERROR',
            'Failed to batch update player stats',
            error
        );
    }
}

/**
 * Get players with stats in a specific gameweek range
 */
export async function getPlayersInGameweekRange(
    startGameweek: number,
    endGameweek: number
): Promise<string[]> {
    try {
        const allStats = await readPlayerGameweekStats();
        const playerIds = new Set<string>();

        allStats.forEach(stats => {
            if (stats.gameweek >= startGameweek && stats.gameweek <= endGameweek) {
                playerIds.add(stats.playerId);
            }
        });

        return Array.from(playerIds);
    } catch (error) {
        throw createAppError(
            'PLAYERS_GAMEWEEK_RANGE_ERROR',
            `Failed to get players in gameweek range: ${startGameweek}-${endGameweek}`,
            error
        );
    }
}

/**
 * Validate player gameweek stats data
 */
export function validatePlayerGameweekStatsData(data: Partial<PlayerGameweekStatsData>): string[] {
    const errors: string[] = [];

    if (!data.playerId || typeof data.playerId !== 'string' || data.playerId.trim().length === 0) {
        errors.push('Player ID is required and must be a non-empty string');
    }

    if (data.gameweek === undefined || data.gameweek < 1 || data.gameweek > 38) {
        errors.push('Gameweek must be between 1 and 38');
    }

    // Validate numeric fields are non-negative
    const numericFields = [
        'minutesPlayed', 'goals', 'assists', 'cleanSheets', 'goalsConceded',
        'penaltiesSaved', 'yellowCards', 'redCards', 'saves', 'bonusPoints', 'fixtureMinutes'
    ];

    numericFields.forEach(field => {
        const value = data[field as keyof PlayerGameweekStatsData];
        if (value !== undefined && (typeof value !== 'number' || value < 0)) {
            errors.push(`${field} must be a non-negative number`);
        }
    });

    return errors;
}

/**
 * Validate player season stats data
 */
export function validatePlayerSeasonStatsData(data: Partial<PlayerSeasonStatsData>): string[] {
    const errors: string[] = [];

    if (!data.playerId || typeof data.playerId !== 'string' || data.playerId.trim().length === 0) {
        errors.push('Player ID is required and must be a non-empty string');
    }

    if (!data.season || typeof data.season !== 'string' || data.season.trim().length === 0) {
        errors.push('Season is required and must be a non-empty string');
    }

    // Validate numeric fields are non-negative
    const numericFields = [
        'totalMinutes', 'gamesPlayed', 'goals', 'assists', 'cleanSheets',
        'goalsConceded', 'penaltiesSaved', 'yellowCards', 'redCards', 'saves', 'bonusPoints'
    ];

    numericFields.forEach(field => {
        const value = data[field as keyof PlayerSeasonStatsData];
        if (value !== undefined && (typeof value !== 'number' || value < 0)) {
            errors.push(`${field} must be a non-negative number`);
        }
    });

    return errors;
}
