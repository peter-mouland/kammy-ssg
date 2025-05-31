import type { CustomPosition, EnhancedPlayerData, FplPlayerData } from '../../../types';
import { convertToPlayerGameweeksStats } from '../fpl/stats';
import { calculateSeasonPoints, getFullBreakdown } from '../../../lib/points';

export const generateEnhancedData = (fplBootstrap, fplPlayerGameweeksById, sheetsPlayersById, teams):EnhancedPlayerData[] => {
    return fplBootstrap.elements
        .filter((fplPlayer: FplPlayerData) => sheetsPlayersById[fplPlayer.id])
        .map((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];
            console.log(`Player ${fplPlayer.web_name}: FPL ID ${fplPlayer.id}, Found custom data:`, playerSheet ? `${playerSheet.firstName} ${playerSheet.lastName} - ${playerSheet.position}` : 'No match');

            // Get gameweek data and convert to your format
            const gameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];
            const playerGameweekStats = convertToPlayerGameweeksStats(gameweekData);

            // Calculate points using your existing logic
            const position = playerSheet.position.toLowerCase() as CustomPosition;
            const pointsBreakdown = calculateSeasonPoints(playerGameweekStats, position);
            const fullBreakdown = getFullBreakdown(playerGameweekStats, position, pointsBreakdown, fplPlayer)
            console.log(`Final position for ${fplPlayer.web_name}: ${playerSheet.position}`);

            return {
                ...fplPlayer,
                team_name: teams[fplPlayer.team] || `Team ${fplPlayer.team}`,
                position_name: playerSheet.position, // This should now be the custom position
                custom_points: pointsBreakdown.total,
                points_breakdown: pointsBreakdown,
                full_breakdown: fullBreakdown,
                player_info: playerSheet,
                gameweek_data: gameweekData
            };
        });
}
