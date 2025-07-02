/* Location: app/scoring/lib/generators.ts */

import type { FplPlayerData, FplPlayerSeasonData, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition, PlayerGameweekStatsData } from '../../players/types/player-types';
import type { TeamPositionSlot } from '../../teams/types/team-types';
import type { EnhancedPlayerData, Points } from '../types/scoring-types';
import { calculateGameweekPoints, calculateSeasonPoints, getFullBreakdown } from './calculations';
import {
    convertToPlayerGameweekStats,
    convertToPlayerGameweeksStats,
    convertToSingleGameweeksStats,
} from './data-conversion';

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

export type GamweekPointsAndStats = {
    points: Points;
    stats: PlayerGameweekStatsData;
    metadata: unknown;
};

/**
 * Generate gameweek-level data for smart updates
 * Used by: gameweek-points-service.ts for selective updates
 */
export function generateGameweekData(
    fplPlayers: TeamPositionSlot['player'][],
    fplPlayerGameweeksById: Record<number, FplPlayerSeasonData>, // playerId, data
    targetGameweeks: number[],
) {
    console.log(
        `🔄 generateGameweekData - Processing ${fplPlayers.length} players for gameweeks: ${targetGameweeks.join(', ')}`,
    );

    const result: Record<FplPlayerData['id'], Record<GameWeekData['fplEvent']['id'], GamweekPointsAndStats>> = {};

    fplPlayers.forEach((fplPlayer) => {
        const position = fplPlayer.playerPosition.toLowerCase() as CustomPosition;
        const allGameweekData = fplPlayerGameweeksById[fplPlayer.playerId]?.history || [];
        const gameweekPoints: Record<GameWeekData['fplEvent']['id'], GamweekPointsAndStats> = {};

        targetGameweeks.forEach((gameweek) => {
            const gameweekData = allGameweekData.filter((gw) => gw.round === gameweek); // step 1: find gw's (account for double gw's)
            const gameweekStats = convertToPlayerGameweeksStats(gameweekData); // step 2: remove gw from stats

            if (!gameweekStats) {
                console.error(`🚨 no stats for gw${gameweek}`);
                console.log(` - max history : ${allGameweekData.length}`);
                console.log(` - player : ${fplPlayer.playerId} ${fplPlayer.playerName} ${position}`);
            }

            const points = calculateGameweekPoints(gameweekStats || [baselineStats], position);
            gameweekPoints[gameweek] = {
                points: points || null, // not all players have been playing since gw 1
                stats: convertToSingleGameweeksStats(gameweekStats) || null, // not all players have been playing since gw 1
                metadata: {
                    generatedAt: new Date().toISOString(),
                    position: position,
                    noData: !gameweekStats,
                },
            };

            console.log(`✅ Player ${fplPlayer.playerId} GW${gameweek}: ${points.total} points`);
        });

        result[fplPlayer.playerId] = gameweekPoints;
    });

    console.log(`✅ generateGameweekData - Generated points for ${Object.keys(result).length} players`);
    return result;
}
