/* Location: app/scoring/lib/data-conversion.ts */

import type { FplPlayerGameweekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayerGameweekStatsData } from '../../players/types/player-types';

/**
 * Convert FPL gameweek data to internal format
 */
export function convertToPlayerGameweeksStats(gameweekData: FplPlayerGameweekData[]): PlayerGameweekStatsData[] {
    return gameweekData.map(convertToPlayerGameweekStats);
}

/**
 * Convert single FPL gameweek record to internal format
 */
export function convertToPlayerGameweekStats(gw: FplPlayerGameweekData): PlayerGameweekStatsData {
    return {
        appearance: gw.minutes,
        goals: gw.goals_scored,
        assists: gw.assists,
        cleanSheets: gw.clean_sheets,
        goalsConceded: gw.goals_conceded,
        yellowCards: gw.yellow_cards,
        redCards: gw.red_cards,
        saves: gw.saves,
        penaltiesSaved: gw.penalties_saved,
        bonus: gw.bonus,
    };
}
