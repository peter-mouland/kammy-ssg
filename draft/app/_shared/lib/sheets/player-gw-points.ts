/* Location: app/_shared/lib/sheets/player-gw-points.ts */

import type { PlayerGameweekPointsRow } from '../../types/sheets-types';
import { createAppError } from './utils/common';
import { readDataFromSheetWithHeaders } from './utils/read-data-from-sheets';
import { saveDataToSheet } from './utils/write-data-to-sheets';

// Sheet configuration
const PLAYER_GW_POINTS_SHEET_NAME = 'player-gw-points';

/**
 * Store a pre-computed gameweek points table.
 *
 * This module used to compute the points itself, which meant a sheets reader ran the
 * scoring engine and `_shared` depended on the `scoring` domain. The computation now
 * lives in `scoring/server/services/player-gw-points.service.ts` and this only stores
 * what it is given. See P2.3 in `.kiro/backlog.md`.
 */
export async function writePlayerGameweekPoints(
    dataRows: PlayerGameweekPointsRow[],
    headerRows: string[],
): Promise<void> {
    try {
        if (dataRows.length === 0) {
            throw new Error('No Gameweek points data to write');
        }

        console.log(`📊 Creating sheet with ${headerRows.length} columns for ${dataRows.length} players`);

        await saveDataToSheet(PLAYER_GW_POINTS_SHEET_NAME, dataRows, headerRows, { mode: 'overwrite' });

        console.log(
            `✅ Successfully wrote Gameweek points for ${dataRows.length} players with ${headerRows.length} GWs`,
        );
    } catch (error) {
        console.error('❌ Failed to write player Gameweek points to sheet:', error);

        if (error instanceof Error) {
            console.error('Error details:', { message: error.message, stack: error.stack });
        }

        throw createAppError('PLAYER_ROUND_POINTS_WRITE_ERROR', 'Failed to write player round points to sheet', error);
    }
}

/**
 * Read existing round points data from sheet
 */
export async function readPlayerGameweekPointsFromSheet(): Promise<PlayerGameweekPointsRow[]> {
    try {
        // readDataFromSheetWithHeaders already returns objects keyed by header name.
        const { data: dataRows } =
            await readDataFromSheetWithHeaders<Record<string, unknown>>(PLAYER_GW_POINTS_SHEET_NAME);
        if (dataRows.length === 0) return [];

        return dataRows.map((row) => {
            const rowData: PlayerGameweekPointsRow = {
                playerCode: Number(row.playerCode) || 0,
                webName: String(row.webName ?? ''),
                teamName: String(row.teamName ?? ''),
                position: String(row.position ?? ''),
            };

            // Copy every gameweek points column (gw-1, gw-2, …) as a number.
            for (const key of Object.keys(row)) {
                if (key.startsWith('gw-')) {
                    const value = row[key];
                    rowData[key] = typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0;
                }
            }

            return rowData;
        });
    } catch (error) {
        throw createAppError('PLAYER_ROUND_POINTS_READ_ERROR', 'Failed to read player round points from sheet', error);
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
                topScorer: null,
            };
        }

        // Count round columns
        const sampleRow = gameweekPointsData[0];
        const gwColumns = Object.keys(sampleRow).filter((key) => key.startsWith('gw-'));

        // Calculate total points for each player
        let topScorer: { playerName: string; totalPoints: number } | null = null;
        let totalAllPoints = 0;
        let totalRoundEntries = 0;

        gameweekPointsData.forEach((player) => {
            let playerTotal = 0;

            gwColumns.forEach((roundColumn) => {
                const points = typeof player[roundColumn] === 'number' ? (player[roundColumn] as number) : 0;
                playerTotal += points;
                totalAllPoints += points;
                totalRoundEntries++;
            });

            if (!topScorer || playerTotal > topScorer.totalPoints) {
                topScorer = {
                    playerName: player.webName,
                    totalPoints: playerTotal,
                };
            }
        });

        return {
            totalPlayers: gameweekPointsData.length,
            totalRounds: gwColumns.length,
            averagePointsPerRound: totalRoundEntries > 0 ? totalAllPoints / totalRoundEntries : 0,
            topScorer,
        };
    } catch (error) {
        throw createAppError('ROUND_POINTS_SUMMARY_ERROR', 'Failed to get round points summary', error);
    }
}
