/* Location: app/scoring/lib/data-conversion.ts */

import type { FplPlayerGameweekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayerGameweekStatsData } from '../../players/types/player-types';
import type { GameweekStatWithPoints } from '../types/scoring-types';

/**
 * Convert FPL gameweek data to internal format
 */
export function convertToSingleGameweeksStats(gameweekData: PlayerGameweekStatsData[]): PlayerGameweekStatsData {
    return gameweekData.reduce(
        (acc, curr) => ({
            appearance: acc.appearance + curr.appearance,
            goals: acc.goals + curr.goals,
            assists: acc.assists + curr.assists,
            cleanSheets: acc.cleanSheets + curr.cleanSheets,
            goalsConceded: acc.goalsConceded + curr.goalsConceded,
            yellowCards: acc.yellowCards + curr.yellowCards,
            redCards: acc.redCards + curr.redCards,
            saves: acc.saves + curr.saves,
            penaltiesSaved: acc.penaltiesSaved + curr.penaltiesSaved,
            defensiveContribution: acc.defensiveContribution + curr.defensiveContribution,
            bonus: acc.bonus + curr.bonus,
        }),
        {
            appearance: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            goalsConceded: 0,
            yellowCards: 0,
            redCards: 0,
            saves: 0,
            penaltiesSaved: 0,
            defensiveContribution: 0,
            bonus: 0,
        },
    );
}

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
        defensiveContribution: gw.defensive_contribution,
    };
}
/**
 * Convert single FPL gameweek record to internal format
 */
export function convertToGameweekStats(gw: GameweekStatWithPoints): PlayerGameweekStatsData {
    return {
        appearance: gw.minutes,
        goals: gw.goals,
        assists: gw.assists,
        cleanSheets: gw.cleanSheets,
        goalsConceded: gw.goalsConceded,
        yellowCards: gw.yellowCards,
        redCards: gw.redCards,
        saves: gw.saves,
        penaltiesSaved: gw.penaltiesSaved,
        bonus: gw.bonus,
        defensiveContribution: gw.defensiveContribution,
    };
}
