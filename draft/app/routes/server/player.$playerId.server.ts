import { data } from 'react-router';
import type { CustomPosition, PointsBreakdown } from '../../types';
import { calculateGameweekPoints } from '../../lib/points';
import { fplApi } from "./fpl/api"
import { getPlayerGameweekStats, getPlayerSeasonStats } from "./sheets/player-stats"

export const playerLoader = async (playerId) => {
    if (isNaN(playerId)) {
        throw new Response("Invalid player ID", { status: 400 });
    }

    // Fetch player data in parallel
    const [player, playerDetail, gameweekStats, seasonStats] = await Promise.all([
        fplApi.getFplPlayer(playerId),
        fplApi.getPlayerDetailedStats(playerId),
        getPlayerGameweekStats(playerId.toString()),
        getPlayerSeasonStats(playerId.toString(), "2024-25")
    ]);

    if (!player) {
        throw new Response("Player not found", { status: 404 });
    }

    // Map FPL position to custom position (simplified mapping)
    const position: CustomPosition = player.element_type === 1 ? 'gk' :
        player.element_type === 2 ? 'fb' :
            player.element_type === 3 ? 'mid' : 'ca';

    // Calculate custom points for each gameweek
    const customPoints: PointsBreakdown[] = gameweekStats.map(stats =>
        calculateGameweekPoints(stats, position)
    );

    return data<LoaderData>({
        player,
        gameweekStats,
        seasonStats,
        customPoints,
        position
    });
}
