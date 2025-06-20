/* Location: app/scoring/lib/generators.ts */

import type { EnhancedPlayerData } from '../types/scoring-types';
import type { CustomPosition, PlayerSheetsData } from '../../players/types/player-types';
import { convertToPlayerGameweeksStats, convertToPlayerGameweekStats } from './data-conversion';
import { calculateSeasonPoints, calculateGameweekPoints, getFullBreakdown } from './calculations';
import type { FplPlayerSeasonData } from '../../_shared/lib/fpl/fpl-types';

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
    bonus: 0,
};

/**
 * Generate season-level enhanced data
 * Used by: api-cache.ts for full player listings
 */
export function generateSeasonData(
    fplPlayers: EnhancedPlayerData[],
    fplPlayerGameweeksById: Record<number, any>,
    sheetsPlayersById: Record<string, any>,
): EnhancedPlayerData[] {
    console.log(`🔄 generateSeasonData - Processing ${fplPlayers.length} players`);

    return fplPlayers
        .filter((fplPlayer) => sheetsPlayersById[fplPlayer.id])
        .map((fplPlayer) => {
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
                        generatedAt: new Date().toISOString(),
                    },
                },
            };
        });
}

/**
 * Generate gameweek-level data for smart updates
 * Used by: gameweek-points-service.ts for selective updates
 */
export function generateGameweekData(
    fplPlayers: EnhancedPlayerData[],
    fplPlayerGameweeksById: Record<number, FplPlayerSeasonData>,
    sheetsPlayersById: Record<number, PlayerSheetsData>,
    targetGameweeks: number[],
): Record<number, { draft: { gameweekPoints: Record<number, any> } }> {
    console.log(
        `🔄 generateGameweekData - Processing ${fplPlayers.length} players for gameweeks: ${targetGameweeks.join(', ')}`,
    );

    const result: Record<number, { draft: { gameweekPoints: Record<number, any> } }> = {};

    fplPlayers
        .filter((fplPlayer) => sheetsPlayersById[fplPlayer.id])
        .forEach((fplPlayer) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];
            const position = playerSheet.position.toLowerCase() as CustomPosition;

            const allGameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];
            const gameweekPoints: Record<number, any> = {};

            targetGameweeks.forEach((gameweek) => {
                const gameweekData = allGameweekData.find((gw) => gw.round === gameweek); // step 1: find gw
                const gameweekStats = gameweekData ? convertToPlayerGameweekStats(gameweekData) : null; // step 2: remove gw from stats

                if (!gameweekStats) {
                    console.error(`🚨 no stats for gw${gameweek}`);
                    console.log(` - max history : ${allGameweekData.length}`);
                    console.log(` - player : ${fplPlayer.id} ${fplPlayer.web_name} ${position}`);
                }

                const pointsBreakdown = calculateGameweekPoints(gameweekStats || baselineStats, position);
                gameweekPoints[gameweek] = {
                    points: pointsBreakdown || null, // not all players have been playing since gw 1
                    stats: gameweekStats || null, // not all players have been playing since gw 1
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        position: position,
                        noData: !gameweekStats,
                    },
                };

                console.log(`✅ Player ${fplPlayer.id} GW${gameweek}: ${pointsBreakdown.total} points`);
            });

            result[fplPlayer.id] = { draft: { gameweekPoints } };
        });

    console.log(`✅ generateGameweekData - Generated points for ${Object.keys(result).length} players`);
    return result;
}
