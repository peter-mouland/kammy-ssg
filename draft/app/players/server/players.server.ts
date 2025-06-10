import { fplApiCache } from "../../_shared/lib/fpl/api-cache";
import type { PlayerStatsData } from "../../_shared/types";

export async function getPlayerStatsData(): Promise<PlayerStatsData> {

    const [enhancedPlayers, fplTeams] = await Promise.all([
        fplApiCache.getEnhancedPlayerData(),
        fplApiCache.getFplTeams()
    ]);

    const teams = fplTeams.reduce((acc: Record<number, string>, team) => {
        acc[team.code] = team.name;
        return acc;
    }, {});

    return {
        players: enhancedPlayers,
        teams,
        positions: {
            'gk': 'gk',
            'cb': 'cb',
            'fb': 'fb',
            'mid': 'mid',
            'wa': 'wa',
            'ca': 'ca'
        }
    };
}
