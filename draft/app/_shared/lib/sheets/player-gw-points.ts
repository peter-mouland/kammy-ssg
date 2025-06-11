// app/routes/server/sheets/player-gw-points.ts
import type { FplPlayerData, CustomPosition } from '../../types';
import { createAppError } from './utils/common';
import { saveDataToSheet } from './utils/write-data-to-sheets';
import { readDataFromSheetWithHeaders } from './utils/read-data-from-sheets';
import { calculateGameweekPoints, convertToPlayerGameweekStats } from '../../../scoring/lib'; // todo: should sheets have domains in it?

// Sheet configuration
const PLAYER_GW_POINTS_SHEET_NAME = 'player-gw-points';

interface PlayerGameweekPointsRow {
    playerCode: string;
    webName: string;
    position: string;
    teamName: string;
    [key: string]: string | number; // For Gameweek points columns like "gw-1", "gw-2", etc.
}

/**
 * Generate Gameweek points data by reusing existing gameweek points logic
 */
async function generateGameweekPointsData(): Promise<{ dataRows: PlayerGameweekPointsRow[], headerRows: string[] }> {
    console.log('🔄 Generating Gameweek points data...');

    // Import required modules
    const { fplApiCache } = await import('../fpl/api-cache');
    const { readPlayers } = await import('./players');
    const baseHeaders = ['playerCode', 'webName', 'position', 'teamName'];
    const colHeaders = new Set<string>()

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

        // Process each player to generate Gameweek points
        const dataRows : PlayerGameweekPointsRow[] = [];
        filteredFplPlayers.forEach((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];
            if (!playerSheet) return;

            const position = playerSheet.position.toLowerCase() as CustomPosition;
            const playerGameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];
            const gameweekPoints = new Map<string, number>(); // we need an ordered object
            let colCount = 0;
            playerGameweekData.forEach((historyEntry: any, index: number) => {
                colCount++
                const singleGameStats = convertToPlayerGameweekStats(historyEntry);
                const gameweekPointsBreakdown = calculateGameweekPoints(singleGameStats, position);
                let colKey = `gw-${historyEntry.round}`;
                if (gameweekPoints.has(colKey)) colKey = colKey + '-b'
                gameweekPoints.set(colKey, gameweekPointsBreakdown.total);
                colHeaders.add(colKey)
            });

            dataRows.push({
                playerCode: fplPlayer.code.toString(),
                webName: fplPlayer.web_name,
                teamName: fplPlayer.team_name,
                position,
                ...Object.fromEntries(gameweekPoints)
            });
        });

        console.log(`✅ Generated Gameweek points for ${dataRows.length} players`);
        const headerRows = [
            ...baseHeaders,
            ...[...colHeaders]
                .sort((a, b) => (
                    parseInt(a.replace(/\D/g, ''), 10) > parseInt(b.replace(/\D/g, ''), 10) ? 1 : -1)
                )
        ]
        return { headerRows, dataRows };

    } catch (error) {
        console.error('❌ Failed to generate Gameweek points data:', error);
        throw error;
    }
}

/**
 * Write Gameweek points data to Google Sheets
 */
export async function writePlayerGameweekPointsToSheet(): Promise<void> {
    try {
        console.log('🔄 Writing player Gameweek points to sheet...');

        const { dataRows, headerRows } = await generateGameweekPointsData();
        if (dataRows.length === 0) {
            throw new Error('No Gameweek points data to write');
        }

        console.log(`📊 Creating sheet with ${headerRows.length} columns for ${dataRows.length} players`);

        await saveDataToSheet(PLAYER_GW_POINTS_SHEET_NAME, dataRows, headerRows, { mode: 'overwrite' });

        console.log(`✅ Successfully wrote Gameweek points for ${dataRows.length} players with ${headerRows.length} GWs`);

    } catch (error) {
        console.error('❌ Failed to write player Gameweek points to sheet:', error);

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
export async function readPlayerGameweekPointsFromSheet(): Promise<PlayerGameweekPointsRow[]> {
    try {
        const { headers, data: dataRows } = await readDataFromSheetWithHeaders(PLAYER_GW_POINTS_SHEET_NAME)
        if (dataRows.length === 0) return [];

        // Parse data into objects
        return dataRows.map(row => {
            const rowData: PlayerGameweekPointsRow = {
                playerCode: '',
                webName: '',
                teamName: '',
                position: ''
            };

            headers.forEach((header: string, index: number) => {
                const value = row[index] || '';

                if (header === 'playerCode') {
                    rowData.playerCode = value.toString();
                } else if (header === 'webName') {
                    rowData.webName = value.toString();
                } else if (header === 'teamName') {
                    rowData.team = value.toString();
                } else if (header === 'position') {
                    rowData.position = value.toString();
                } else if (header.startsWith('gw-')) {
                    // Parse round points columns
                    rowData[header] = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;
                }
            });

            return rowData;
        });
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
export async function getGameweekPointsSummary(): Promise<{
    totalPlayers: number;
    totalRounds: number;
    averagePointsPerRound: number;
    topScorer: { playerName: string; totalPoints: number } | null;
}> {
    try {
        const gameweekPointsData = await readPlayerGameweekPointsFromSheet();

        if (gameweekPointsData.length === 0) {
            return {
                totalPlayers: 0,
                totalRounds: 0,
                averagePointsPerRound: 0,
                topScorer: null
            };
        }

        // Count round columns
        const sampleRow = gameweekPointsData[0];
        const gwColumns = Object.keys(sampleRow).filter(key =>
            key.startsWith('gw-')
        );

        // Calculate total points for each player
        let topScorer: { playerName: string; totalPoints: number } | null = null;
        let totalAllPoints = 0;
        let totalRoundEntries = 0;

        gameweekPointsData.forEach(player => {
            let playerTotal = 0;

            gwColumns.forEach(roundColumn => {
                const points = typeof player[roundColumn] === 'number' ? player[roundColumn] as number : 0;
                playerTotal += points;
                totalAllPoints += points;
                totalRoundEntries++;
            });

            if (!topScorer || playerTotal > topScorer.totalPoints) {
                topScorer = {
                    playerName: player.webName,
                    totalPoints: playerTotal
                };
            }
        });

        return {
            totalPlayers: gameweekPointsData.length,
            totalRounds: gwColumns.length,
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
