// app/routes/server/player-detail.server.ts
import type { PlayerDetailData, GameweekStatWithPoints } from "../../types";

export async function getPlayerDetailData(playerId: number): Promise<PlayerDetailData> {
    try {
        console.log(`🔄 Loading player detail data for player: ${playerId}`);

        // Import required services
        const { fplApiCache } = await import("./fpl/api-cache");

        // Get basic player data - all from cache
        const [fplPlayer, fplTeams, enhancedPlayers, currentGameweek] = await Promise.all([
            fplApiCache.getFplPlayer(playerId),
            fplApiCache.getFplTeams(),
            fplApiCache.getEnhancedPlayerData(),
            fplApiCache.getCurrentGameweek()
        ]);

        if (!fplPlayer) {
            throw new Error(`Player ${playerId} not found in FPL data`);
        }

        // Find enhanced player data (contains sheets position data)
        const enhancedPlayer = enhancedPlayers.find(p => p.id === playerId);
        if (!enhancedPlayer) {
            throw new Error(`Player ${playerId} not found in enhanced data - run "Generate Enhanced Data" first`);
        }

        // Get team data and create team lookup for opponents
        const team = fplTeams.find(t => t.code === fplPlayer.team_code);
        if (!team) {
            throw new Error(`Team ${fplPlayer.team_code} not found`);
        }

        // Create team lookup for opponent names
        const teamLookup = fplTeams.reduce((acc, t) => {
            acc[t.id] = t;
            return acc;
        }, {} as Record<number, any>);

        // Get detailed player stats and gameweek points (all from cache)
        const [playerDetailedStats, gameweekPointsData] = await Promise.all([
            fplApiCache.getPlayerDetailedStats(playerId),
            getPlayerGameweekPoints(playerId)
        ]);

        // Process gameweek data
        const gameweekStats = processGameweekData(
            playerDetailedStats.history || [],
            gameweekPointsData,
            enhancedPlayer.position,
            teamLookup
        );

        // Calculate season totals
        const seasonTotals = calculateSeasonTotals(gameweekStats);

        console.log(`✅ Player detail data loaded for ${fplPlayer.first_name} ${fplPlayer.second_name}`);

        return {
            player: fplPlayer,
            team,
            position: enhancedPlayer.position,
            gameweekStats,
            seasonTotals,
            currentGameweek: currentGameweek || 1
        };

    } catch (error) {
        console.error(`❌ Failed to load player detail data for player ${playerId}:`, error);
        throw error;
    }
}

/**
 * Get gameweek points data for a player
 */
async function getPlayerGameweekPoints(playerId: number): Promise<Record<number, any> | null> {
    try {
        const { fplApiCache } = await import("./fpl/api-cache");

        // Get element summary which contains gameweek points
        const elementSummary = await fplApiCache['fplCache'].getElementGameweek(playerId);

        if (elementSummary?.draft?.gameweekPoints) {
            return elementSummary.draft.gameweekPoints;
        }

        return null;
    } catch (error) {
        console.error(`Error getting gameweek points for player ${playerId}:`, error);
        return null;
    }
}

/**
 * Process and combine FPL stats with gameweek points
 */
function processGameweekData(
    fplHistory: any[],
    gameweekPointsData: Record<number, any> | null,
    position: string,
    teamLookup: Record<number, any>
): GameweekStatWithPoints[] {
    const gameweekStats: GameweekStatWithPoints[] = [];

    // Process each gameweek from FPL history
    fplHistory.forEach(gwData => {
        const gameweek = gwData.round;
        const pointsData = gameweekPointsData?.[gameweek];

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
            customPoints: pointsData ? {
                appearance: pointsData.points?.appearance || 0,
                goals: pointsData.points?.goals || 0,
                assists: pointsData.points?.assists || 0,
                cleanSheets: pointsData.points?.cleanSheets || 0,
                goalsConceded: pointsData.points?.goalsConceded || 0,
                yellowCards: pointsData.points?.yellowCards || 0,
                redCards: pointsData.points?.redCards || 0,
                saves: pointsData.points?.saves || 0,
                penaltiesSaved: pointsData.points?.penaltiesSaved || 0,
                bonus: pointsData.points?.bonus || 0,
                total: pointsData.points?.total || 0
            } : null,

            // FPL points
            fplPoints: gwData.total_points,

            // Metadata
            generatedAt: pointsData?.metadata?.generatedAt || null
        };

        gameweekStats.push(gameweekStat);
    });

    // Sort by gameweek (most recent first)
    return gameweekStats.sort((a, b) => b.gameweek - a.gameweek);
}

/**
 * Calculate season totals from gameweek data
 */
function calculateSeasonTotals(gameweekStats: GameweekStatWithPoints[]) {
    const totals = {
        // Basic stats
        gamesPlayed: gameweekStats.filter(gw => gw.minutes > 0).length,
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
        totalCustomPoints: gameweekStats.reduce((sum, gw) => sum + (gw.customPoints?.total || 0), 0),

        // Averages
        averageMinutes: 0,
        averageFplPoints: 0,
        averageCustomPoints: 0,

        // Performance metrics
        goalsPerGame: 0,
        assistsPerGame: 0,
        cleanSheetPercentage: 0
    };

    // Calculate averages (only for games played)
    if (totals.gamesPlayed > 0) {
        totals.averageMinutes = Math.round(totals.totalMinutes / totals.gamesPlayed);
        totals.averageFplPoints = Math.round((totals.totalFplPoints / totals.gamesPlayed) * 10) / 10;
        totals.averageCustomPoints = Math.round((totals.totalCustomPoints / totals.gamesPlayed) * 10) / 10;
        totals.goalsPerGame = Math.round((totals.goals / totals.gamesPlayed) * 100) / 100;
        totals.assistsPerGame = Math.round((totals.assists / totals.gamesPlayed) * 100) / 100;
        totals.cleanSheetPercentage = Math.round((totals.cleanSheets / totals.gamesPlayed) * 100);
    }

    return totals;
}
