/* Location: app/players/server/players.server.ts */

import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { readPlayers } from '../../_shared/lib/sheets/players';
import type { PlayersSheetData } from '../../_shared/types/sheets-types';
import { calculateSeasonPoints, getFullBreakdown } from '../../scoring/lib/calculations';
import { convertToPlayerGameweekStats } from '../../scoring/lib/data-conversion';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { CustomPosition, PlayerGameweekStatsData, PlayerStatsData } from '../types/player-types';

export async function getPlayerStatsData(): Promise<PlayerStatsData> {
    const [players, fplTeams, sheetsPlayers, currentGameweekData] = await Promise.all([
        fplApiCache.getFplPlayers(),
        fplApiCache.getFplTeams(),
        readPlayers(),
        fplApiCache.getCurrentGameweekData(),
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

    const currentGameweek = currentGameweekData?.fplEvent.id || 1;
    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

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
        currentGameweekData,
        selectedGameweekData: currentGameweekData,
        availableGameweeks,
        selectedGameweek: null,
    };
}

export async function getPlayerStatsForGameweek(gameweek: number): Promise<PlayerStatsData> {
    const [players, fplTeams, sheetsPlayers, currentGameweekData, events, liveData] = await Promise.all([
        fplApiCache.getFplPlayers(),
        fplApiCache.getFplTeams(),
        readPlayers(),
        fplApiCache.getCurrentGameweekData(),
        fplApiCache.getFplEvents(),
        fplApiCache.getGameweekLiveData(gameweek),
    ]);

    const sheetsPlayersByCode = sheetsPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
        acc[player.code] = player;
        return acc;
    }, {});

    const teamsByCode = fplTeams.reduce((acc: Record<number, FplTeam>, team) => {
        acc[team.code] = team;
        return acc;
    }, {});

    const currentGameweek = currentGameweekData?.fplEvent.id || 1;
    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);
    const selectedGameweekData = events.find((e) => e.fplEvent.id === gameweek) || currentGameweekData;

    // Build a lookup of live stats by player FPL id
    const liveStatsById = new Map<number, PlayerGameweekStatsData>();
    for (const element of liveData.elements) {
        liveStatsById.set(element.id, convertToPlayerGameweekStats(element.stats));
    }

    // Build enhanced players with GW-specific points
    const enhancedPlayers: EnhancedPlayerData[] = players
        .filter((player) => sheetsPlayersByCode[player.code])
        .map((player) => {
            const gwStats = liveStatsById.get(player.id);
            const position = (sheetsPlayersByCode[player.code].position?.toLowerCase() ||
                player.draft?.position) as CustomPosition;

            if (!gwStats || gwStats.appearance === 0) {
                // Player didn't play this GW — show zero points
                const zeroStats: PlayerGameweekStatsData = {
                    appearance: 0,
                    goals: 0,
                    assists: 0,
                    cleanSheets: 0,
                    goalsConceded: 0,
                    penaltiesSaved: 0,
                    yellowCards: 0,
                    redCards: 0,
                    saves: 0,
                    bonus: 0,
                    defensiveContribution: 0,
                };
                const { points, stats } = calculateSeasonPoints([zeroStats], position);
                const fullBreakdown = getFullBreakdown([zeroStats], position, { points, stats });

                return {
                    ...player,
                    draft: {
                        ...player.draft,
                        position,
                        pointsTotal: 0,
                        pointsBreakdown: fullBreakdown,
                    },
                };
            }

            const { points, stats } = calculateSeasonPoints([gwStats], position);
            const fullBreakdown = getFullBreakdown([gwStats], position, { points, stats });

            return {
                ...player,
                draft: {
                    ...player.draft,
                    position,
                    pointsTotal: points.total,
                    pointsBreakdown: fullBreakdown,
                },
            };
        });

    return {
        players: enhancedPlayers,
        teamsByCode,
        positions: {
            gk: 'gk',
            cb: 'cb',
            fb: 'fb',
            mid: 'mid',
            wa: 'wa',
            ca: 'ca',
        },
        currentGameweekData,
        selectedGameweekData,
        availableGameweeks,
        selectedGameweek: gameweek,
    };
}
