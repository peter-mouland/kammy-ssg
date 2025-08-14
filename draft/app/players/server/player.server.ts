/* Location: app/players/server/player.server.ts */

import type { FplBootstrapData, FplPlayerSeasonData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData, GameweekStatWithPoints } from '../../scoring/types/scoring-types';
import type { CustomPosition, DataSource, PlayerDetailData } from '../types/player-types';

export async function getPlayerDetailData(
    playerCode: number,
    dataSource: DataSource = 'fpl',
): Promise<PlayerDetailData> {
    try {
        console.log(`🔄 Loading player detail data for player: ${playerCode}, source: ${dataSource}`);

        // Import required services
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');

        // Get basic player data - all from cache
        const [fplPlayer, fplTeams, currentGameweek] = await Promise.all([
            fplApiCache.getPlayerByCode(playerCode),
            fplApiCache.getFplTeams(),
            fplApiCache.getCurrentGameweek(),
        ]);

        if (!fplPlayer) {
            throw new Error(`Player ${playerCode} not found in FPL data`);
        }

        // Get team data and create team lookup for opponents
        const team = fplTeams.find((t) => t.code === fplPlayer.team_code);
        if (!team) {
            throw new Error(`Team ${fplPlayer.team_code} not found`);
        }

        // Create team lookup for opponent names
        const teamLookup = fplTeams.reduce(
            (acc, t) => {
                acc[t.id] = t;
                return acc;
            },
            {} as Record<number, any>,
        );

        let playerDetailedStats: FplPlayerSeasonData | null;
        if (dataSource === 'fpl') {
            // Get detailed player stats from current FPL API (all from cache)
            playerDetailedStats = await fplApiCache.getPlayerDetailedStats(fplPlayer.id);
        } else {
            // Load 2425 fixture data
            playerDetailedStats = await loadFixturesPlayerData(fplPlayer.code, dataSource);
        }

        const gameweekStats = processGameweekData(playerDetailedStats?.history || [], teamLookup);
        const seasonTotals = calculateSeasonTotals(gameweekStats, fplPlayer);

        console.log(
            `✅ Player detail data loaded for ${fplPlayer.first_name} ${fplPlayer.second_name} (${dataSource})`,
        );

        return {
            player: fplPlayer,
            team,
            position: fplPlayer.draft?.position.toLowerCase() as CustomPosition,
            gameweekStats,
            seasonTotals,
            currentGameweek: currentGameweek || 1,
            dataSource,
        };
    } catch (error) {
        console.error(`❌ Failed to load player detail data for player ${playerCode}:`, error);
        throw error;
    }
}

/**
 * Load 2425 fixture data from local files
 */
async function loadFixturesPlayerData(playerCode: number, season: string): Promise<FplPlayerSeasonData | null> {
    try {
        const bootstrap: FplBootstrapData = await import(`../../api/fixtures/${season}/fpl/bootstrap-static.json`);
        const playerId = bootstrap.elements.find((e) => e.code === playerCode)?.id;
        const playerSeasonData: FplPlayerSeasonData = await import(
            `../../api/fixtures/${season}/fpl/element-summary/${playerId}.json`
        );
        return playerSeasonData;
    } catch (_error) {
        console.log(`⚠️ No 2425 data found for player code ${playerCode}, returning empty stats`);
        return null;
    }
}

/**
 * Process and combine FPL stats with gameweek points
 */
function processGameweekData(fplHistory: any[], teamLookup: Record<number, any>): GameweekStatWithPoints[] {
    const gameweekStats: GameweekStatWithPoints[] = [];

    // Process each gameweek from FPL history
    fplHistory.forEach((gwData) => {
        const gameweek = gwData.round;

        const gameweekStat: GameweekStatWithPoints = {
            gameweek,
            // FPL stats
            minutes: gwData.minutes,
            goals: gwData.goals_scored,
            assists: gwData.assists,
            cleanSheets: gwData.clean_sheets,
            goalsConceded: gwData.goals_conceded,
            yellowCards: gwData.yellow_cards,
            redCards: gwData.red_cards,
            saves: gwData.saves,
            penaltiesSaved: gwData.penalties_saved,
            bonus: gwData.bonus,

            // Opponent and fixture info
            opponent: gwData.opponent_team,
            opponentName: teamLookup[gwData.opponent_team]?.short_name || 'Unknown',
            wasHome: gwData.was_home,
            teamHScore: gwData.team_h_score,
            teamAScore: gwData.team_a_score,

            // Custom points (if available)
            customPoints: null,

            // FPL points
            fplPoints: gwData.total_points,

            // Metadata
            generatedAt: null,
        };

        gameweekStats.push(gameweekStat);
    });

    // Sort by gameweek (most recent first)
    return gameweekStats.sort((a, b) => b.gameweek - a.gameweek);
}

/**
 * Calculate season totals from gameweek data
 */
function calculateSeasonTotals(gameweekStats: GameweekStatWithPoints[], fplPlayer: EnhancedPlayerData) {
    const totals = {
        // Basic stats
        gamesPlayed: gameweekStats.filter((gw) => gw.minutes > 0).length,
        totalMinutes: gameweekStats.reduce((sum, gw) => sum + gw.minutes, 0),
        goals: gameweekStats.reduce((sum, gw) => sum + gw.goals, 0),
        assists: gameweekStats.reduce((sum, gw) => sum + gw.assists, 0),
        cleanSheets: gameweekStats.reduce((sum, gw) => sum + gw.cleanSheets, 0),
        goalsConceded: gameweekStats.reduce((sum, gw) => sum + gw.goalsConceded, 0),
        yellowCards: gameweekStats.reduce((sum, gw) => sum + gw.yellowCards, 0),
        redCards: gameweekStats.reduce((sum, gw) => sum + gw.redCards, 0),
        saves: gameweekStats.reduce((sum, gw) => sum + gw.saves, 0),
        penaltiesSaved: gameweekStats.reduce((sum, gw) => sum + gw.penaltiesSaved, 0),
        bonus: gameweekStats.reduce((sum, gw) => sum + gw.bonus, 0),

        // Points
        totalFplPoints: gameweekStats.reduce((sum, gw) => sum + gw.fplPoints, 0),
        totalCustomPoints: fplPlayer.draft.pointsTotal,

        // Averages
        averageMinutes: 0,
        averageFplPoints: 0,
        averageCustomPoints: 0,
        form: 0,

        // Performance metrics
        goalsPerGame: 0,
        savesPerGame: 0,
        assistsPerGame: 0,
        cleanSheetPercentage: 0,
        savesPerGamePercentage: 0,
    };

    // Calculate averages (only for games played)
    if (totals.gamesPlayed > 0) {
        totals.averageMinutes = Math.round(totals.totalMinutes / totals.gamesPlayed);
        totals.averageFplPoints = Math.round((totals.totalFplPoints / totals.gamesPlayed) * 10) / 10;
        totals.averageCustomPoints = Math.round((fplPlayer.draft.pointsTotal / totals.gamesPlayed) * 10) / 10;
        totals.goalsPerGame = Math.round((totals.goals / totals.gamesPlayed) * 100) / 100;
        totals.savesPerGame = Math.round((totals.saves / totals.gamesPlayed) * 100) / 100;
        const maxSavesPerGame = 8; // Reasonable max for a busy goalkeeper
        totals.savesPerGamePercentage = Math.min((totals.savesPerGame / maxSavesPerGame) * 100, 100);
        totals.assistsPerGame = Math.round((totals.assists / totals.gamesPlayed) * 100) / 100;
        totals.cleanSheetPercentage = Math.round((totals.cleanSheets / totals.gamesPlayed) * 100);
        totals.form = calculateForm(gameweekStats);
    }

    return totals;
}

/**
 * Calculate form - average FPL points over last 5 played games
 */
function calculateForm(gameweekStats: GameweekStatWithPoints[], lastNGames = 5): number {
    const playedGames = gameweekStats.filter((gw) => gw.minutes > 0).slice(0, lastNGames);

    if (playedGames.length === 0) return 0;

    const totalPoints = playedGames.reduce((sum, gw) => sum + gw.fplPoints, 0);
    return Math.round((totalPoints / playedGames.length) * 10) / 10; // Round to 1 decimal
}
