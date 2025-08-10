/* Location: app/players/server/players.server.ts */

import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
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

    const teams = fplTeams.reduce((acc: Record<number, string>, team) => {
        acc[team.code] = team.name;
        return acc;
    }, {});

    return {
        players: availablePlayers,
        teams,
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
