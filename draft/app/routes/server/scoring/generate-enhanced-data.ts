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
            const pointsBreakdown = calculateSeasonPoints(playerGameweekStats, position);
            const fullBreakdown = getFullBreakdown(playerGameweekStats, position, pointsBreakdown, fplPlayer)

            return {
                ...fplPlayer,
                team_name: fplTeams[fplPlayer.team] || `Team ${fplPlayer.team}`,
                position_name: playerSheet.position, // This should now be the custom position
                custom_points: pointsBreakdown.total,
                points_breakdown: pointsBreakdown,
                full_breakdown: fullBreakdown,
                player_info: playerSheet,
                gameweek_data: gameweekData
            };
        });
}
