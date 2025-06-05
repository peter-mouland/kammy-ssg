// src/lib/fpl/stats.ts
import type {
    FplBootstrapData,
    FplPlayerData,
    PlayerGameweekStatsData,
} from '../../../types';
import type { FplPlayerGameweekData } from './api';

export const convertFplElementToCache = (element) => ({
    id: element.id,
    code: element.code,
    first_name: element.first_name,
    second_name: element.second_name,
    web_name: element.web_name,
    team_code: element.team_code,
    form: element.form,
    now_cost: element.now_cost,
})

export const convertFplElementHistoryToCache = (element) => ({
    element: element.element,
    round: element.round,
    fixture: element.fixture,
    assists: element.assists,
    bonus: element.bonus,
    clean_sheets: element.clean_sheets,
    goals_conceded: element.goals_conceded,
    goals_scored: element.goals_scored,
    minutes: element.minutes,
    own_goals: element.own_goals,
    penalties_saved: element.penalties_saved,
    penalties_missed: element.penalties_missed,
    red_cards: element.red_cards,
    saves: element.saves,
    yellow_cards: element.yellow_cards,
    team_a_score: element.team_a_score,
    team_h_score: element.team_h_score,
})

// Convert FPL gameweek data to your format
export const convertToPlayerGameweeksStats = (gameweekData: FplPlayerGameweekData[]): PlayerGameweekStatsData[] => {
    return gameweekData.map(convertToPlayerGameweekStats);
};

export const convertToPlayerGameweekStats = (gw: FplPlayerGameweekData): PlayerGameweekStatsData => {
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
};

/**
 * Convert FPL player data to gameweek stats format
 */
export function convertFplToGameweekStats(
    fplPlayer: FplPlayerData,
    gameweek: number,
    liveData?: any
): PlayerGameweekStatsData {
    // Extract live stats if available
    const liveStats = liveData?.elements?.find((element: any) => element.id === fplPlayer.id);

    return {
        playerId: fplPlayer.id.toString(),
        gameweek,
        appearance: fplPlayer.minutes || 0,
        goals: fplPlayer.goals_scored || 0,
        assists: fplPlayer.assists || 0,
        cleanSheets: fplPlayer.clean_sheets || 0,
        goalsConceded: fplPlayer.goals_conceded || 0,
        penaltiesSaved: fplPlayer.penalties_saved || 0,
        yellowCards: fplPlayer.yellow_cards || 0,
        redCards: fplPlayer.red_cards || 0,
        saves: fplPlayer.saves || 0,
        bonus: fplPlayer.bonus || 0,
        fixtureMinutes: liveStats?.stats?.minutes || fplPlayer.minutes || 0,
        updatedAt: new Date()
    };
}

/**
 * Extract all FPL players from bootstrap data
 */
export function extractFplPlayers(bootstrap: FplBootstrapData): FplPlayerData[] {
    return bootstrap.elements;
}

/**
 * Find FPL player by ID from bootstrap data
 */
export function findFplPlayer(bootstrap: FplBootstrapData, playerId: number): FplPlayerData | null {
    return bootstrap.elements.find(player => player.id === playerId) || null;
}

/**
 * Extract FPL teams from bootstrap data
 */
export function extractFplTeams(bootstrap: FplBootstrapData): Array<{ id: number; name: string; short_name: string }> {
    return bootstrap.teams;
}

/**
 * Extract FPL element types (positions) from bootstrap data
 */
export function extractFplElementTypes(bootstrap: FplBootstrapData): Array<{ id: number; singular_name: string; plural_name: string }> {
    return bootstrap.element_types;
}

/**
 * Get current gameweek from bootstrap data
 */
export function getCurrentGameweekFromBootstrap(bootstrap: FplBootstrapData): number {
    const currentEvent = bootstrap.events.find(event => event.is_current);
    return currentEvent?.id || 1;
}

/**
 * Get top performers from players list
 */
export function getTopPerformers(players: FplPlayerData[], limit = 10): FplPlayerData[] {
    return players
        .filter(player => player.minutes > 0)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit);
}

/**
 * Get players by position
 */
export function getPlayersByPosition(players: FplPlayerData[], elementType: number): FplPlayerData[] {
    return players
        .filter(player => player.element_type === elementType)
        .sort((a, b) => b.total_points - a.total_points);
}

/**
 * Get players by team
 */
export function getPlayersByTeam(players: FplPlayerData[], teamCode: number): FplPlayerData[] {
    return players
        .filter(player => player.team_code === teamCode)
        .sort((a, b) => b.total_points - a.total_points);
}

/**
 * Search players by name
 */
export function searchPlayersByName(players: FplPlayerData[], searchTerm: string): FplPlayerData[] {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return players.filter(player => {
        const firstName = player.first_name.toLowerCase();
        const secondName = player.second_name.toLowerCase();
        const webName = player.web_name.toLowerCase();

        return firstName.includes(normalizedSearch) ||
            secondName.includes(normalizedSearch) ||
            webName.includes(normalizedSearch);
    });
}

/**
 * Get player price history from detailed stats
 */
export function extractPlayerPriceHistory(playerDetailedStats: any): any[] {
    return playerDetailedStats.history || [];
}

/**
 * Get player fixtures from detailed stats
 */
export function extractPlayerFixtures(playerDetailedStats: any): any[] {
    return playerDetailedStats.fixtures || [];
}

/**
 * Calculate team strength ratings from bootstrap data
 */
export function calculateTeamStrengths(bootstrap: FplBootstrapData): Record<number, { attack: number; defence: number }> {
    const strengths: Record<number, { attack: number; defence: number }> = {};

    bootstrap.teams.forEach(team => {
        strengths[team.code] = {
            attack: (team.strength_attack_home + team.strength_attack_away) / 2,
            defence: (team.strength_defence_home + team.strength_defence_away) / 2
        };
    });

    return strengths;
}

/**
 * Extract gameweek deadlines from bootstrap data
 */
export function extractGameweekDeadlines(bootstrap: FplBootstrapData): Record<number, Date> {
    const deadlines: Record<number, Date> = {};

    bootstrap.events.forEach(event => {
        deadlines[event.id] = new Date(event.deadline_time);
    });

    return deadlines;
}

/**
 * Check if gameweek is finished from bootstrap data
 */
export function isGameweekFinished(bootstrap: FplBootstrapData, gameweek: number): boolean {
    const event = bootstrap.events.find(e => e.id === gameweek);
    return event?.finished || false;
}

/**
 * Extract dream team data from live gameweek data
 */
export function extractDreamTeam(liveData: any): {
    topPlayer: any;
    averageScore: number;
    highestScore: number;
} {
    return {
        topPlayer: liveData?.top_element || null,
        averageScore: liveData?.average_entry_score || 0,
        highestScore: liveData?.highest_score || 0
    };
}

/**
 * Batch filter players by IDs
 */
export function batchFilterPlayersData(players: FplPlayerData[], playerIds: number[]): FplPlayerData[] {
    const playerMap = new Map(players.map(player => [player.id, player]));

    return playerIds
        .map(id => playerMap.get(id))
        .filter((player): player is FplPlayerData => player !== undefined);
}

/**
 * Get player form (last 5 gameweeks average)
 */
export function getPlayerForm(player: FplPlayerData): number {
    return player ? parseFloat(player.form || '0') : 0;
}
