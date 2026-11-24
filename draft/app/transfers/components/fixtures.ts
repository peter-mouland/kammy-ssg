/* Location: app/transfers/components/fixtures.ts */

import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { PlayerDetailData } from '../../players';
import type { SeasonTotals } from '../../scoring';

const ARSENAL = { id: 1, code: 3, name: 'Arsenal', short_name: 'ARS' } as FplTeam;

/**
 * What the player detail endpoint returns, for a player with a quiet season: enough for
 * the player page's content to render. Tests name the player and their points.
 */
export function makePlayerDetailData({
    code,
    firstName,
    secondName,
    position = 'cb',
    pointsTotal = 40,
}: {
    code: number;
    firstName: string;
    secondName: string;
    position?: CustomPosition;
    pointsTotal?: number;
}): PlayerDetailData {
    return {
        player: {
            id: code,
            code,
            first_name: firstName,
            second_name: secondName,
            web_name: secondName,
            team_code: ARSENAL.code,
            draft: { position, pointsTotal, pointsBreakdown: {} },
        } as unknown as EnhancedPlayerData,
        team: { id: ARSENAL.id, name: ARSENAL.name, short_name: ARSENAL.short_name },
        position,
        gameweekStats: [],
        seasonTotals: {
            gamesPlayed: 0,
            averageMinutes: 0,
            averageCustomPoints: 0,
            form: 0,
            goals: 0,
            assists: 0,
            goalsPerGame: 0,
            assistsPerGame: 0,
            cleanSheets: 0,
            cleanSheetPercentage: 0,
        } as unknown as SeasonTotals,
        currentGameweek: 12,
        fixtures: [],
        fplTeamsById: { [ARSENAL.id]: ARSENAL },
        fplEvents: [],
    };
}
