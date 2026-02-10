/* Location: app/leagues/server/team-of-the-week.server.ts */

import type { CustomPosition } from '../../players/types/player-types';
import { convertToPlayerGameweekStats } from '../../scoring/lib/data-conversion';
import { calculateGameweekPoints } from '../../scoring/lib/calculations';
import type { TeamOfTheWeekData, TeamOfTheWeekPlayer } from '../types/league-standings-types';

const POSITION_COUNTS: Record<CustomPosition, number> = {
    gk: 1,
    cb: 2,
    fb: 2,
    mid: 2,
    wa: 2,
    ca: 2,
};

export async function getTeamOfTheWeek(gameweek: number): Promise<TeamOfTheWeekData | null> {
    try {
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
        const { readPlayers } = await import('../../_shared/lib/sheets/players');

        const [liveData, fplPlayers, sheetPlayers, fplTeams] = await Promise.all([
            fplApiCache.getGameweekLiveData(gameweek),
            fplApiCache.getFplPlayers(),
            readPlayers(),
            fplApiCache.getFplTeams(),
        ]);

        // Build lookup: player code -> sheet position
        const positionByCode = new Map<number, CustomPosition>();
        for (const sp of sheetPlayers) {
            if (sp.code && sp.position) {
                positionByCode.set(sp.code, sp.position.toLowerCase() as CustomPosition);
            }
        }

        // Build lookup: fpl id -> EnhancedPlayerData
        const fplPlayerById = new Map(fplPlayers.map((p) => [p.id, p]));

        // Build teams by code lookup
        const teamsByCode: Record<number, { short_name: string }> = {};
        for (const team of fplTeams) {
            teamsByCode[team.code] = { short_name: team.short_name };
        }

        // Calculate custom points for each player with a sheet position
        const playerScores: TeamOfTheWeekPlayer[] = [];

        for (const liveElement of liveData.elements) {
            const fplPlayer = fplPlayerById.get(liveElement.id);
            if (!fplPlayer) continue;

            const position = positionByCode.get(fplPlayer.code);
            if (!position) continue;

            const gwStats = convertToPlayerGameweekStats(liveElement.stats);
            const points = calculateGameweekPoints([gwStats], position);

            playerScores.push({
                code: fplPlayer.code,
                web_name: fplPlayer.web_name,
                team_code: fplPlayer.team_code,
                position,
                points: points.total,
            });
        }

        // Group by position and pick top N
        const players: TeamOfTheWeekData['players'] = {
            gk: [],
            cb: [],
            fb: [],
            mid: [],
            wa: [],
            ca: [],
        };

        for (const pos of Object.keys(POSITION_COUNTS) as CustomPosition[]) {
            const posPlayers = playerScores
                .filter((p) => p.position === pos)
                .sort((a, b) => b.points - a.points)
                .slice(0, POSITION_COUNTS[pos]);
            players[pos] = posPlayers;
        }

        return {
            gameweek,
            players,
            teamsByCode,
        };
    } catch (error) {
        console.error(`Failed to get Team of the Week for GW${gameweek}:`, error);
        return null;
    }
}
