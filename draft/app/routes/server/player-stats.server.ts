// src/routes/server/player-stats.server.ts
import { fplApiCache } from "./fpl/api-cache";
import type { PlayerStatsData } from "../../types";

export async function getPlayerStatsData(): Promise<PlayerStatsData> {

    const [enhancedPlayers, fplTeams] = await Promise.all([
        fplApiCache.getEnhancedPlayerData(),
        fplApiCache.getFplTeams()
    ]);

    const teams = fplTeams.reduce((acc: Record<number, string>, team) => {
        acc[team.id] = team.name;
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
