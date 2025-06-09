// src/lib/scoring/data-conversion.ts - Data transformation utilities

import type {
    FplPlayerGameweekData,
    PlayerGameweekStatsData
} from '../../../types';

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
        playerId: gw.element.toString(),
        gameweek: gw.round,
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
        fixtureMinutes: gw.minutes,
        updatedAt: new Date()
    };
}
