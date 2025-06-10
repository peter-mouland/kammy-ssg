// src/lib/scoring/generators.ts - High-level data generation

import type {
    CustomPosition,
    EnhancedPlayerData,
    FplPlayerData
} from '../../_shared/types';
import { convertToPlayerGameweeksStats } from './data-conversion';
import { calculateSeasonPoints, calculateGameweekPoints, getFullBreakdown } from './calculations';

const baselineStats = {
    appearance: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    goalsConceded: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    penaltiesSaved: 0,
    bonus: 0
};

/**
 * Generate season-level enhanced data
 * Used by: api-cache.ts for full player listings
 */
export function generateSeasonData(
    fplPlayers: FplPlayerData[],
    fplPlayerGameweeksById: Record<number, any>,
    sheetsPlayersById: Record<string, any>
): EnhancedPlayerData[] {
    console.log(`🔄 generateSeasonData - Processing ${fplPlayers.length} players`);

    return fplPlayers
        .filter((fplPlayer: FplPlayerData) => sheetsPlayersById[fplPlayer.id])
        .map((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];
            const gameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];
            const playerGameweekStats = convertToPlayerGameweeksStats(gameweekData);

            const position = playerSheet.position.toLowerCase() as CustomPosition;
            const breakdown = calculateSeasonPoints(playerGameweekStats, position);
            const fullBreakdown = getFullBreakdown(playerGameweekStats, position, breakdown);

            return {
                ...fplPlayer,
                draft: {
                    position: playerSheet.position,
                    pointsTotal: breakdown.points.total,
                    pointsBreakdown: fullBreakdown,
                    __generatedFor: {
                        type: 'season' as const,
                        generatedAt: new Date().toISOString()
                    }
                }
            };
        });
}

/**
 * Generate gameweek-level data for smart updates
 * Used by: gameweek-points-service.ts for selective updates
 */
export function generateGameweekData(
    fplPlayers: FplPlayerData[],
    fplPlayerGameweeksById: Record<number, any>,
    sheetsPlayersById: Record<string, any>,
    targetGameweeks: number[]
): Record<number, { draft: { gameweekPoints: Record<number, any> } }> {
    console.log(`🔄 generateGameweekData - Processing ${fplPlayers.length} players for gameweeks: ${targetGameweeks.join(', ')}`);

    const result: Record<number, { draft: { gameweekPoints: Record<number, any> } }> = {};

    fplPlayers
        .filter((fplPlayer: FplPlayerData) => sheetsPlayersById[fplPlayer.id])
        .forEach((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];
            const position = playerSheet.position.toLowerCase() as CustomPosition;

            const allGameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];
            const playerGameweekStats = convertToPlayerGameweeksStats(allGameweekData);
            const gameweekPoints: Record<number, any> = {};

            targetGameweeks.forEach(gameweek => {
                const gameweekStats = playerGameweekStats.find(gw => gw.gameweek === gameweek);

                const pointsBreakdown = calculateGameweekPoints(gameweekStats || baselineStats, position);
                gameweekPoints[gameweek] = {
                    points: pointsBreakdown,
                    stats: gameweekStats,
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        position: position,
                        noData: !gameweekStats
                    }
                };

                console.log(`✅ Player ${fplPlayer.id} GW${gameweek}: ${pointsBreakdown.total} points`);
            });

            result[fplPlayer.id] = { draft: { gameweekPoints } };
        });

    console.log(`✅ generateGameweekData - Generated points for ${Object.keys(result).length} players`);
    return result;
}
