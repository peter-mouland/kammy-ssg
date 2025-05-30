
// Convert FPL gameweek data to your format
import type { FplPlayerGameweekData } from './api';
import type { PlayerGameweekStatsData } from '../../types';

export const convertToPlayerGameweeksStats = (gameweekData: FplPlayerGameweekData[]): PlayerGameweekStatsData[] => {
    return gameweekData.map(convertToPlayerGameweekStats);
};

export const convertToPlayerGameweekStats = (gw: FplPlayerGameweekData): PlayerGameweekStatsData => {
    return {
        gameweek: gw.round,
        minutesPlayed: gw.minutes,
        goals: gw.goals_scored,
        assists: gw.assists,
        cleanSheets: gw.clean_sheets,
        goalsConceded: gw.goals_conceded,
        yellowCards: gw.yellow_cards,
        redCards: gw.red_cards,
        saves: gw.saves,
        penaltiesSaved: gw.penalties_saved,
        bonus: gw.bonus
    };
};
