import type {
    FplBootstrapData,
    FplPlayerData,
    PlayerGameweekStatsData,
    CustomPosition
} from '../../types';
import { createAppError } from '../sheets/common';

// FPL API endpoints
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const FPL_BOOTSTRAP_URL = `${FPL_BASE_URL}/bootstrap-static/`;
const FPL_PLAYER_DETAIL_URL = (playerId: number) => `${FPL_BASE_URL}/element-summary/${playerId}/`;
const FPL_GAMEWEEK_LIVE_URL = (gameweek: number) => `${FPL_BASE_URL}/event/${gameweek}/live/`;
const FPL_ENTRY_URL = (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/`;
const FPL_ENTRY_HISTORY_URL = (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/history/`;

// Cache for bootstrap data to avoid repeated requests
let bootstrapCache: { data: FplBootstrapData | null; timestamp: number } = {
    data: null,
    timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch data from FPL API with error handling
 */
async function fetchFplData<T>(url: string): Promise<T> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Fantasy Football Draft App)',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        throw createAppError(
            'FPL_API_ERROR',
            `Failed to fetch data from FPL API: ${url}`,
            error
        );
    }
}

/**
 * Get FPL bootstrap data (cached)
 */
export async function getFplBootstrapData(): Promise<FplBootstrapData> {
    const now = Date.now();

    if (bootstrapCache.data && (now - bootstrapCache.timestamp) < CACHE_DURATION) {
        return bootstrapCache.data;
    }

    try {
        const data = await fetchFplData<FplBootstrapData>(FPL_BOOTSTRAP_URL);

        bootstrapCache = {
            data,
            timestamp: now
        };

        return data;
    } catch (error) {
        throw createAppError(
            'FPL_BOOTSTRAP_ERROR',
            'Failed to fetch FPL bootstrap data',
            error
        );
    }
}

/**
 * Get all FPL players
 */
export async function getFplPlayers(): Promise<FplPlayerData[]> {
    try {
        const bootstrap = await getFplBootstrapData();
        return bootstrap.elements;
    } catch (error) {
        throw createAppError(
            'FPL_PLAYERS_ERROR',
            'Failed to get FPL players',
            error
        );
    }
}

/**
 * Get FPL player by ID
 */
export async function getFplPlayer(playerId: number): Promise<FplPlayerData | null> {
    try {
        const players = await getFplPlayers();
        return players.find(player => player.id === playerId) || null;
    } catch (error) {
        throw createAppError(
            'FPL_PLAYER_ERROR',
            `Failed to get FPL player: ${playerId}`,
            error
        );
    }
}

/**
 * Get FPL teams
 */
export async function getFplTeams(): Promise<Array<{ id: number; name: string; short_name: string }>> {
    try {
        const bootstrap = await getFplBootstrapData();
        return bootstrap.teams.map(team => ({
            id: team.id,
            name: team.name,
            short_name: team.short_name
        }));
    } catch (error) {
        throw createAppError(
            'FPL_TEAMS_ERROR',
            'Failed to get FPL teams',
            error
        );
    }
}

/**
 * Get FPL element types (positions)
 */
export async function getFplElementTypes(): Promise<Array<{ id: number; singular_name: string; plural_name: string }>> {
    try {
        const bootstrap = await getFplBootstrapData();
        return bootstrap.element_types.map(type => ({
            id: type.id,
            singular_name: type.singular_name,
            plural_name: type.plural_name
        }));
    } catch (error) {
        throw createAppError(
            'FPL_ELEMENT_TYPES_ERROR',
            'Failed to get FPL element types',
            error
        );
    }
}

/**
 * Get current gameweek
 */
export async function getCurrentGameweek(): Promise<number> {
    try {
        const bootstrap = await getFplBootstrapData();
        const currentEvent = bootstrap.events.find(event => event.is_current);
        return currentEvent?.id || 1;
    } catch (error) {
        throw createAppError(
            'CURRENT_GAMEWEEK_ERROR',
            'Failed to get current gameweek',
            error
        );
    }
}

/**
 * Get player detailed stats for all gameweeks
 */
export async function getPlayerDetailedStats(playerId: number): Promise<any> {
    try {
        const url = FPL_PLAYER_DETAIL_URL(playerId);
        return await fetchFplData(url);
    } catch (error) {
        throw createAppError(
            'PLAYER_DETAILED_STATS_ERROR',
            `Failed to get detailed stats for player: ${playerId}`,
            error
        );
    }
}

/**
 * Get live gameweek data
 */
export async function getLiveGameweekData(gameweek: number): Promise<any> {
    try {
        const url = FPL_GAMEWEEK_LIVE_URL(gameweek);
        return await fetchFplData(url);
    } catch (error) {
        throw createAppError(
            'LIVE_GAMEWEEK_ERROR',
            `Failed to get live data for gameweek: ${gameweek}`,
            error
        );
    }
}

/**
 * Get FPL entry (team) data
 */
export async function getFplEntryData(entryId: number): Promise<any> {
    try {
        const url = FPL_ENTRY_URL(entryId);
        return await fetchFplData(url);
    } catch (error) {
        throw createAppError(
            'FPL_ENTRY_ERROR',
            `Failed to get FPL entry data: ${entryId}`,
            error
        );
    }
}

/**
 * Get FPL entry history
 */
export async function getFplEntryHistory(entryId: number): Promise<any> {
    try {
        const url = FPL_ENTRY_HISTORY_URL(entryId);
        return await fetchFplData(url);
    } catch (error) {
        throw createAppError(
            'FPL_ENTRY_HISTORY_ERROR',
            `Failed to get FPL entry history: ${entryId}`,
            error
        );
    }
}

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
        minutesPlayed: fplPlayer.minutes || 0,
        goals: fplPlayer.goals_scored || 0,
        assists: fplPlayer.assists || 0,
        cleanSheets: fplPlayer.clean_sheets || 0,
        goalsConceded: fplPlayer.goals_conceded || 0,
        penaltiesSaved: fplPlayer.penalties_saved || 0,
        yellowCards: fplPlayer.yellow_cards || 0,
        redCards: fplPlayer.red_cards || 0,
        saves: fplPlayer.saves || 0,
        bonusPoints: fplPlayer.bonus || 0,
        fixtureMinutes: liveStats?.stats?.minutes || fplPlayer.minutes || 0,
        updatedAt: new Date()
    };
}

/**
 * Map FPL position to custom position
 */
export function mapFplPositionToCustom(
    elementType: number,
    playerName: string,
    teamId: number
): CustomPosition {
    // Basic mapping - this would need to be enhanced with actual player data
    switch (elementType) {
        case 1:
            return 'gk';
        case 2:
            // Defenders - would need logic to differentiate between fb and cb
            // For now, default to fb but this should be enhanced
            return 'fb';
        case 3:
            return 'mid';
        case 4:
            // Forwards - would need logic to differentiate between wa and ca
            // For now, default to ca but this should be enhanced
            return 'ca';
        default:
            return 'mid';
    }
}

/**
 * Get top performers for current gameweek
 */
export async function getTopPerformers(limit = 10): Promise<FplPlayerData[]> {
    try {
        const players = await getFplPlayers();
        return players
            .filter(player => player.minutes > 0)
            .sort((a, b) => b.total_points - a.total_points)
            .slice(0, limit);
    } catch (error) {
        throw createAppError(
            'TOP_PERFORMERS_ERROR',
            'Failed to get top performers',
            error
        );
    }
}

/**
 * Get players by position
 */
export async function getPlayersByPosition(elementType: number): Promise<FplPlayerData[]> {
    try {
        const players = await getFplPlayers();
        return players
            .filter(player => player.element_type === elementType)
            .sort((a, b) => b.total_points - a.total_points);
    } catch (error) {
        throw createAppError(
            'PLAYERS_BY_POSITION_ERROR',
            `Failed to get players by position: ${elementType}`,
            error
        );
    }
}

/**
 * Get players by team
 */
export async function getPlayersByTeam(teamId: number): Promise<FplPlayerData[]> {
    try {
        const players = await getFplPlayers();
        return players
            .filter(player => player.team === teamId)
            .sort((a, b) => b.total_points - a.total_points);
    } catch (error) {
        throw createAppError(
            'PLAYERS_BY_TEAM_ERROR',
            `Failed to get players by team: ${teamId}`,
            error
        );
    }
}

/**
 * Search players by name
 */
export async function searchPlayersByName(searchTerm: string): Promise<FplPlayerData[]> {
    try {
        const players = await getFplPlayers();
        const normalizedSearch = searchTerm.toLowerCase().trim();

        return players.filter(player => {
            const firstName = player.first_name.toLowerCase();
            const secondName = player.second_name.toLowerCase();
            const webName = player.web_name.toLowerCase();

            return firstName.includes(normalizedSearch) ||
                secondName.includes(normalizedSearch) ||
                webName.includes(normalizedSearch);
        });
    } catch (error) {
        throw createAppError(
            'PLAYER_SEARCH_ERROR',
            `Failed to search players by name: ${searchTerm}`,
            error
        );
    }
}

/**
 * Get player price history
 */
export async function getPlayerPriceHistory(playerId: number): Promise<any[]> {
    try {
        const playerDetail = await getPlayerDetailedStats(playerId);
        return playerDetail.history || [];
    } catch (error) {
        throw createAppError(
            'PLAYER_PRICE_HISTORY_ERROR',
            `Failed to get price history for player: ${playerId}`,
            error
        );
    }
}

/**
 * Get player fixtures
 */
export async function getPlayerFixtures(playerId: number): Promise<any[]> {
    try {
        const playerDetail = await getPlayerDetailedStats(playerId);
        return playerDetail.fixtures || [];
    } catch (error) {
        throw createAppError(
            'PLAYER_FIXTURES_ERROR',
            `Failed to get fixtures for player: ${playerId}`,
            error
        );
    }
}

/**
 * Get team strength ratings
 */
export async function getTeamStrengths(): Promise<Record<number, { attack: number; defence: number }>> {
    try {
        const bootstrap = await getFplBootstrapData();
        const strengths: Record<number, { attack: number; defence: number }> = {};

        bootstrap.teams.forEach(team => {
            strengths[team.id] = {
                attack: (team.strength_attack_home + team.strength_attack_away) / 2,
                defence: (team.strength_defence_home + team.strength_defence_away) / 2
            };
        });

        return strengths;
    } catch (error) {
        throw createAppError(
            'TEAM_STRENGTHS_ERROR',
            'Failed to get team strengths',
            error
        );
    }
}

/**
 * Get gameweek deadlines
 */
export async function getGameweekDeadlines(): Promise<Record<number, Date>> {
    try {
        const bootstrap = await getFplBootstrapData();
        const deadlines: Record<number, Date> = {};

        bootstrap.events.forEach(event => {
            deadlines[event.id] = new Date(event.deadline_time);
        });

        return deadlines;
    } catch (error) {
        throw createAppError(
            'GAMEWEEK_DEADLINES_ERROR',
            'Failed to get gameweek deadlines',
            error
        );
    }
}

/**
 * Check if gameweek is finished
 */
export async function isGameweekFinished(gameweek: number): Promise<boolean> {
    try {
        const bootstrap = await getFplBootstrapData();
        const event = bootstrap.events.find(e => e.id === gameweek);
        return event?.finished || false;
    } catch (error) {
        throw createAppError(
            'GAMEWEEK_FINISHED_CHECK_ERROR',
            `Failed to check if gameweek is finished: ${gameweek}`,
            error
        );
    }
}

/**
 * Get dream team for a gameweek
 */
export async function getDreamTeam(gameweek: number): Promise<any> {
    try {
        const liveData = await getLiveGameweekData(gameweek);
        return {
            topPlayer: liveData?.top_element || null,
            averageScore: liveData?.average_entry_score || 0,
            highestScore: liveData?.highest_score || 0
        };
    } catch (error) {
        throw createAppError(
            'DREAM_TEAM_ERROR',
            `Failed to get dream team for gameweek: ${gameweek}`,
            error
        );
    }
}

/**
 * Get player ownership percentage
 */
export async function getPlayerOwnership(playerId: number): Promise<number> {
    try {
        const player = await getFplPlayer(playerId);
        return player?.selected_by_percent || 0;
    } catch (error) {
        throw createAppError(
            'PLAYER_OWNERSHIP_ERROR',
            `Failed to get ownership for player: ${playerId}`,
            error
        );
    }
}

/**
 * Batch fetch multiple players' data
 */
export async function batchFetchPlayersData(playerIds: number[]): Promise<FplPlayerData[]> {
    try {
        const allPlayers = await getFplPlayers();
        const playerMap = new Map(allPlayers.map(player => [player.id, player]));

        return playerIds
            .map(id => playerMap.get(id))
            .filter((player): player is FplPlayerData => player !== undefined);
    } catch (error) {
        throw createAppError(
            'BATCH_PLAYERS_ERROR',
            'Failed to batch fetch players data',
            error
        );
    }
}

/**
 * Get player form (last 5 gameweeks average)
 */
export async function getPlayerForm(playerId: number): Promise<number> {
    try {
        const player = await getFplPlayer(playerId);
        return player ? parseFloat(player.form || '0') : 0;
    } catch (error) {
        throw createAppError(
            'PLAYER_FORM_ERROR',
            `Failed to get form for player: ${playerId}`,
            error
        );
    }
}

/**
 * Clear bootstrap cache (useful for testing or forced refresh)
 */
export function clearBootstrapCache(): void {
    bootstrapCache = {
        data: null,
        timestamp: 0
    };
}
