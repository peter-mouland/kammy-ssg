import type { CustomPosition, EnhancedPlayerData, FplPlayerData } from '../../../types';
import { convertToPlayerGameweeksStats } from '../fpl/stats';
import { calculateSeasonPoints, getFullBreakdown } from '../../../lib/points';

export const generateEnhancedData = (fplPlayers, fplPlayerGameweeksById, sheetsPlayersById, fplTeams):EnhancedPlayerData[] => {
    return fplPlayers
        .filter((fplPlayer: FplPlayerData) => sheetsPlayersById[fplPlayer.id])
        .map((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];

            // Get gameweek data and convert to your format
            const gameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];
            const playerGameweekStats = convertToPlayerGameweeksStats(gameweekData);

            // Calculate points using your existing logic
            const position = playerSheet.position.toLowerCase() as CustomPosition;
            const breakdown = calculateSeasonPoints(playerGameweekStats, position);
            const fullBreakdown = getFullBreakdown(playerGameweekStats, position, breakdown)

            return {
                ...fplPlayer,
                draft: {
                    position: playerSheet.position,
                    pointsTotal: breakdown.points.total,
                    pointsBreakdown: fullBreakdown, // todo : move to elements-[id] docs
                }
            };
        });
}
