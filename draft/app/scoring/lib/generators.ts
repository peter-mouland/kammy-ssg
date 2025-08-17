/* Location: app/scoring/lib/generators.ts */

import type { FplPlayerData, FplPlayerSeasonData, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition, PlayerGameweekStatsData } from '../../players/types/player-types';
import type { TeamPositionSlot } from '../../teams/types/team-types';
import type { EnhancedPlayerData, Points } from '../types/scoring-types';
import { calculateGameweekPoints, calculateSeasonPoints, getFullBreakdown } from './calculations';
import { convertToPlayerGameweeksStats, convertToSingleGameweeksStats } from './data-conversion';

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
    defensiveContribution: 0,
    bonus: 0,
};

/**
 * Generate season-level enhanced data
 * Used by: api-cache.ts for full player listings
 */
export function generateSeasonData(
    fplPlayers: EnhancedPlayerData[],
    fplPlayerGameweeksById: Record<number, any>,
    sheetsPlayersByCode: Record<string, any>,
): EnhancedPlayerData[] {
    console.log(`🔄 generateSeasonData - Processing ${fplPlayers.length} players`);

    return fplPlayers
        .filter((fplPlayer) => sheetsPlayersByCode[fplPlayer.code])
        .map((fplPlayer) => {
            const playerSheet = sheetsPlayersByCode[fplPlayer.code];
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

type GameweekPointsAndStats = {
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
    gameweek: number,
) {
    console.log(`🔄 generateGameweekData - Processing ${fplPlayers.length} players for gameweek: ${gameweek}`);

    const result: Record<FplPlayerData['id'], Record<GameWeekData['fplEvent']['id'], GameweekPointsAndStats>> = {};

    fplPlayers.forEach((fplPlayer) => {
        const position = fplPlayer.playerPosition.toLowerCase() as CustomPosition;
        // @ts-ignore
        if (position === 'sub') {
            throw new Error('position should never be SUB here, please check draft data and re-submit');
        }
        const allGameweekData = fplPlayerGameweeksById[fplPlayer.playerId]?.history || [];
        const gameweekPoints: Record<GameWeekData['fplEvent']['id'], GameweekPointsAndStats> = {};

        const gameweekData = allGameweekData.filter((gw) => gw.round === gameweek); // step 1: find gw's (account for double gw's)
        let points;
        let stats;
        let gameweekStats;
        try {
            gameweekStats = convertToPlayerGameweeksStats(gameweekData); // step 2: remove gw from stats
        } catch (e) {
            console.error('🚨 error in convertToPlayerGameweeksStats');
            throw new Error(e.message);
        }
        if (!gameweekStats.length) {
            console.error(`🚨 no stats for gw${gameweek}`);
            console.log(` - max history : ${allGameweekData.length}`);
            console.log(` - player : ${fplPlayer.playerId} ${fplPlayer.playerName} ${position}`);
        }

        try {
            points = calculateGameweekPoints(gameweekStats || [baselineStats], position);
        } catch (e) {
            console.error('issue in calculateGameweekPoints');
            throw new Error(e.message);
        }
        try {
            stats = convertToSingleGameweeksStats(gameweekStats);
        } catch (e) {
            console.error('issue in convertToSingleGameweeksStats');
            throw new Error(e.message);
        }
        gameweekPoints[gameweek] = {
            points: points || null, // not all players have been playing since gw 1
            stats: stats || null, // not all players have been playing since gw 1
            metadata: {
                generatedAt: new Date().toISOString(),
                position: position,
                noData: !gameweekStats.length,
            },
        };

        console.log(
            `✅ ${fplPlayer.playerName} (${fplPlayer.playerId}): GW${gameweek} w/ ${points.total}pts (has Stats:${!!stats})`,
        );

        result[fplPlayer.playerId] = gameweekPoints;
    });

    console.log(`✅ generateGameweekData - Generated points for ${Object.keys(result).length} players`);
    return result;
}
