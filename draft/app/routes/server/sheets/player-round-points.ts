// app/routes/server/sheets/player-round-points.ts
import type { FplPlayerData, CustomPosition } from '../../../types';
import {
    readSheetRange,
    writeSheetRange,
    createAppError,
    type SheetRange
} from './common';
import { calculateGameweekPoints } from '../../../lib/scoring';

// Sheet configuration
const PLAYER_ROUND_POINTS_SHEET_NAME = 'player-round-points';

function getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
        columnNumber--; // Adjust for 0-based indexing
        result = String.fromCharCode(65 + (columnNumber % 26)) + result;
        columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
}

interface PlayerRoundPointsRow {
    playerCode: string;
    playerWebName: string;
    playerPosition: string;
    playerTeam: string;
    [key: string]: string | number; // For round points columns like "round-1", "round-2", etc.
}

interface RoundPointsData {
    playerCode: string;
    webName: string;
    teamName: string;
    position: CustomPosition;
    roundPoints: Record<number, number>; // round number -> points
}

/**
 * Generate round points data by reusing existing gameweek points logic
 */
async function generateRoundPointsData(): Promise<RoundPointsData[]> {
    console.log('🔄 Generating round points data...');

    // Import required modules
    const { fplApiCache } = await import('../fpl/api-cache');
    const { readPlayers } = await import('./players');
    const { convertToPlayerGameweeksStats } = await import('../../../lib/scoring');

    try {
        // Get required data (reusing existing logic)
        const [sheetsPlayers, fplPlayers] = await Promise.all([
            readPlayers(),
            fplApiCache.getFplPlayers()
        ]);

        // Create sheets players lookup
        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, any>, player) => {
            acc[player.id] = player;
            return acc;
        }, {});
        // Filter FPL players to only include those in sheets
        const filteredFplPlayers = fplPlayers.filter(player => sheetsPlayersById[player.id]);

        if (filteredFplPlayers.length === 0) {
            throw new Error('No players found that exist in both FPL data and sheets');
        }

        // Get detailed stats for filtered players (reusing existing method)
        const playerIds = filteredFplPlayers.map(p => p.id);
        const fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(playerIds);


        // Process each player to generate round points
        const roundPointsData: RoundPointsData[] = [];
        filteredFplPlayers.forEach((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];
            if (!playerSheet) return;

            const position = playerSheet.position.toLowerCase() as CustomPosition;
            const playerGameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];

            // Convert to your gameweek stats format (reusing existing logic)
            const playerGameweekStats = convertToPlayerGameweeksStats(playerGameweekData);

            // Calculate round points using the existing player history data
            // Each history entry represents one round for that player
            const roundPoints: Record<number, number> = {};

            playerGameweekData.forEach((historyEntry: any, index: number) => {
                // Convert this single history entry to gameweek stats format
                const singleGameStats = {
                    playerId: fplPlayer.id.toString(),
                    playerCode: fplPlayer.code.toString(),
                    gameweek: historyEntry.round,
                    appearance: historyEntry.minutes,
                    goals: historyEntry.goals_scored,
                    assists: historyEntry.assists,
                    cleanSheets: historyEntry.clean_sheets,
                    goalsConceded: historyEntry.goals_conceded,
                    yellowCards: historyEntry.yellow_cards,
                    redCards: historyEntry.red_cards,
                    saves: historyEntry.saves,
                    penaltiesSaved: historyEntry.penalties_saved,
                    bonus: historyEntry.bonus,
                    fixtureMinutes: historyEntry.minutes,
                    updatedAt: new Date()
                };

                // Calculate points for this specific round (reusing existing calculateGameweekPoints)
                const roundPointsBreakdown = calculateGameweekPoints(singleGameStats, position);
                roundPoints[historyEntry.round] = roundPointsBreakdown.total;
            });

            roundPointsData.push({
                playerCode: fplPlayer.code.toString(),
                webName: fplPlayer.web_name,
                teamName: fplPlayer.team_name,
                position,
                roundPoints
            });
        });

        console.log(`✅ Generated round points for ${roundPointsData.length} players`);
        return roundPointsData;

    } catch (error) {
        console.error('❌ Failed to generate round points data:', error);
        throw error;
    }
}

/**
 * Get all round numbers from player history data
 */
async function getAllRounds(): Promise<number[]> {
    console.log('🔄 Getting all round numbers from player history...');

    const { fplApiCache } = await import('../fpl/api-cache');
    const { readPlayers } = await import('./players');

    // Get a sample of players to determine all possible rounds
    const [sheetsPlayers, fplPlayers] = await Promise.all([
        readPlayers(),
        fplApiCache.getFplPlayers()
    ]);

    // Create sheets players lookup
    const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, any>, player) => {
        acc[player.id] = player;
        return acc;
    }, {});
    // Filter FPL players to only include those in sheets
    const filteredFplPlayers = fplPlayers.filter(player => sheetsPlayersById[player.id]);

    if (filteredFplPlayers.length === 0) {
        return [];
    }

    // Get detailed stats for a sample of players to find all round IDs
    // Get detailed stats for filtered players (reusing existing method)
    const playerIds = filteredFplPlayers.map(p => p.id);
    const fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(playerIds);

    const allRounds = new Set<number>();
    Object.values(fplPlayerGameweeksById).forEach((playerData: any) => {
        if (playerData?.history) {
            playerData.history.forEach((historyEntry: any, index: number) => {
                allRounds.add(historyEntry.round);
            });
        }
    });

    const sortedRounds = Array.from(allRounds).sort((a, b) => a - b);
    console.log(`✅ Found ${sortedRounds.length} unique rounds`);

    return sortedRounds;
}

/**
 * Write rounf points data to Google Sheets
 */
export async function writePlayerRoundPointsToSheet(): Promise<void> {
    try {
        console.log('🔄 Writing player round points to sheet...');

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

        // Generate the data
        const [roundPointsData, allRounds] = await Promise.all([
            generateRoundPointsData(),
            getAllRounds()
        ]);

        if (roundPointsData.length === 0) {
            throw new Error('No round points data to write');
        }

        // Create headers
        const baseHeaders = ['player code', 'player web_name', 'player position', 'player team'];
        const roundHeaders = allRounds.map(round => `round-${round}`);
        const headers = [...baseHeaders, ...roundHeaders];

        console.log(`📊 Creating sheet with ${headers.length} columns for ${roundPointsData.length} players`);

        // Create rows
        const rows: (string | number)[][] = [headers];

        roundPointsData.forEach(playerData => {
            const row: (string | number)[] = [
                playerData.playerCode,
                playerData.webName,
                playerData.position,
                playerData.teamName,
            ];

            // Add round points in the correct column order
            allRounds.forEach(round => {
                row.push(playerData.roundPoints[round] || 0);
            });

            rows.push(row);
        });

        const rangeEnd = getColumnLetter(headers.length);

        // Write to sheet with proper range
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYER_ROUND_POINTS_SHEET_NAME}'!A1:${rangeEnd}${rows.length}`
        };

        console.log(`📝 Writing to range: ${sheetRange.range}`);

        await writeSheetRange(sheetRange, rows);

        console.log(`✅ Successfully wrote round points for ${roundPointsData.length} players with ${allRounds.length} round`);

    } catch (error) {
        console.error('❌ Failed to write player round points to sheet:', error);

        // Add more detailed error logging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
        }

        throw createAppError(
            'PLAYER_ROUND_POINTS_WRITE_ERROR',
            'Failed to write player round points to sheet',
            error
        );
    }
}

/**
 * Read existing round points data from sheet
 */
export async function readPlayerRoundPointsFromSheet(): Promise<PlayerRoundPointsRow[]> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYER_ROUND_POINTS_SHEET_NAME}'!A:ZZ` // Wide range to capture all round columns
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        const headers = rawData[0];
        const dataRows = rawData.slice(1);

        // Parse data into objects
        const roundPointsRows: PlayerRoundPointsRow[] = dataRows.map(row => {
            const rowData: PlayerRoundPointsRow = {
                playerCode: '',
                playerWebName: '',
                playerTeam: '',
                playerPosition: ''
            };

            headers.forEach((header: string, index: number) => {
                const value = row[index] || '';

                if (header === 'player code') {
                    rowData.playerCode = value.toString();
                } else if (header === 'player web_name') {
                    rowData.playerWebName = value.toString();
                } else if (header === 'player team') {
                    rowData.playerTeam = value.toString();
                } else if (header === 'player position') {
                    rowData.playerPosition = value.toString();
                } else if (header.startsWith('round-')) {
                    // Parse round points columns
                    rowData[header] = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;
                }
            });

            return rowData;
        });

        return roundPointsRows;

    } catch (error) {
        throw createAppError(
            'PLAYER_ROUND_POINTS_READ_ERROR',
            'Failed to read player round points from sheet',
            error
        );
    }
}

/**
 * Get round points summary statistics
 */
export async function getRoundPointsSummary(): Promise<{
    totalPlayers: number;
    totalRounds: number;
    averagePointsPerRound: number;
    topScorer: { playerName: string; totalPoints: number } | null;
}> {
    try {
        const roundPointsData = await readPlayerRoundPointsFromSheet();

        if (roundPointsData.length === 0) {
            return {
                totalPlayers: 0,
                totalRounds: 0,
                averagePointsPerRound: 0,
                topScorer: null
            };
        }

        // Count round columns
        const sampleRow = roundPointsData[0];
        const roundColumns = Object.keys(sampleRow).filter(key =>
            key.startsWith('round-')
        );

        // Calculate total points for each player
        let topScorer: { playerName: string; totalPoints: number } | null = null;
        let totalAllPoints = 0;
        let totalRoundEntries = 0;

        roundPointsData.forEach(player => {
            let playerTotal = 0;

            roundColumns.forEach(roundColumn => {
                const points = typeof player[roundColumn] === 'number' ? player[roundColumn] as number : 0;
                playerTotal += points;
                totalAllPoints += points;
                totalRoundEntries++;
            });

            if (!topScorer || playerTotal > topScorer.totalPoints) {
                topScorer = {
                    playerName: player.playerWebName,
                    totalPoints: playerTotal
                };
            }
        });

        return {
            totalPlayers: roundPointsData.length,
            totalRounds: roundColumns.length,
            averagePointsPerRound: totalRoundEntries > 0 ? totalAllPoints / totalRoundEntries : 0,
            topScorer
        };

    } catch (error) {
        throw createAppError(
            'ROUND_POINTS_SUMMARY_ERROR',
            'Failed to get round points summary',
            error
        );
    }
}
