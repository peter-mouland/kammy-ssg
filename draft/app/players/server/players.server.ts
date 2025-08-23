/* Location: app/players/server/players.server.ts */

import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { readPlayers } from '../../_shared/lib/sheets/players';
import type { PlayersSheetData } from '../../_shared/types/sheets-types';
import type { PlayerStatsData } from '../types/player-types';

export async function getPlayerStatsData(): Promise<PlayerStatsData> {
    const [players, fplTeams, sheetsPlayers] = await Promise.all([
        fplApiCache.getFplPlayers(),
        fplApiCache.getFplTeams(),
        readPlayers(),
    ]);

    const sheetsPlayersByCode = sheetsPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
        acc[player.code] = player;
        return acc;
    }, {});
    const availablePlayers = players.filter((player) => sheetsPlayersByCode[player.code]);

    const teamsByCode = fplTeams.reduce((acc: Record<number, FplTeam>, team) => {
        acc[team.code] = team;
        return acc;
    }, {});

    return {
        players: availablePlayers,
        teamsByCode,
        positions: {
            gk: 'gk',
            cb: 'cb',
            fb: 'fb',
            mid: 'mid',
            wa: 'wa',
            ca: 'ca',
        },
    };
}
