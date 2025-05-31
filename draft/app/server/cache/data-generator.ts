// app/lib/server/cache/data-generator.ts

import { getFplBootstrapData, getBatchPlayerGameweekData } from "../fpl/api";
import { convertToPlayerGameweekStats } from "../fpl/stats";
import { readPlayers } from "../sheets/players";
import { calculateSeasonPoints, calculateGameweekPoints } from "../../lib/points";
import type { FplPlayerGameweekData, FplPlayerData, FplTeamData, PlayerData, CustomPosition, PlayerGameweekStatsData } from "../../types";
import type { RefreshOptions, EnhancedPlayerData } from './types';
import { updateGameweekData, clearGameweekData, getSeasonPointsBreakdown, type GameweekData } from './gameweek-storage';
import { clearSeasonStats } from './season-stats';

async function isGameweekFinished(gameweek: number): Promise<boolean> {
    try {
        const bootstrapData = await getFplBootstrapData();
        const gameweekEvent = bootstrapData.events.find(event => event.id === gameweek);

        if (!gameweekEvent) return false;

        return gameweekEvent.finished && !gameweekEvent.is_current;
    } catch {
        return false;
    }
}

async function getGameweeksToUpdate(currentGameweek: number, forceCurrentOnly: boolean = false): Promise<number[]> {
    if (forceCurrentOnly) {
        return [currentGameweek];
    }

    return Array.from({ length: currentGameweek }, (_, i) => i + 1);
}


export async function generateFreshPlayerData(options: RefreshOptions = {}): Promise<{ players: EnhancedPlayerData[], currentGameweek: number }> {
    const { forceFullRefresh = false, clearAll = false, specificGameweeks, quickRefresh = false } = options;

    console.log('Generating fresh player data...', { forceFullRefresh, clearAll, specificGameweeks, quickRefresh });

    const [bootstrapData, playersData] = await Promise.all([
        getFplBootstrapData(),
        readPlayers()
    ]);

    const currentGameweek = bootstrapData.events.find(event => event.is_current)?.id || 1;

    // Clear cache if requested
    if (clearAll) {
        console.log('Clearing all cache data...');
        await Promise.all([
            clearGameweekData(),
            clearSeasonStats()
        ]);
    }

    // Determine which gameweeks to update
    let gameweeksToUpdate: number[];
    if (specificGameweeks) {
        gameweeksToUpdate = specificGameweeks;
    } else if (quickRefresh) {
        gameweeksToUpdate = [currentGameweek];
    } else {
        gameweeksToUpdate = await getGameweeksToUpdate(currentGameweek, false);
    }

    console.log(`Updating gameweeks: ${gameweeksToUpdate.join(', ')}`);

    // Get active players
    const playerIds = bootstrapData.elements.map(p => p.id);

    // Fetch fresh gameweek data
    // todo: only do on full refresh.
    // - incremental we can fetch this and last gw only + use cached values to recalc season
    const freshGameweekData = await getBatchPlayerGameweekData(playerIds, 25);

    // Create lookup maps
    const teams = bootstrapData.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
        acc[team.id] = team.name;
        return acc;
    }, {});

    const playersLookup = playersData.reduce((acc: Record<string, PlayerData>, player: PlayerData) => {
        acc[player.id] = player;
        return acc;
    }, {});

    console.log(`Created lookup for ${playersData.length} players from spreadsheet`);

    // Process players and update cache
    const enhancedPlayers: EnhancedPlayerData[] = await Promise.all(
        bootstrapData.elements
            .filter((player: FplPlayerData) => playersLookup[player.id])
            .map(async (player: FplPlayerData) => {
                const playerSheet = playersLookup[player.id];
                const customPosition = playerSheet.position?.toLowerCase() as CustomPosition;

                console.log(`Processing ${player.web_name}: Position ${playerSheet.position}`);

                // Process gameweeks and update cache with aggregated data
                for (const gw of gameweeksToUpdate) {
                    // Get all games for this player in this gameweek
                    const playerGameweekData = freshGameweekData[player.id];
                    if (playerGameweekData?.history) {
                        // Filter games for this specific gameweek
                        const gameweekGames = playerGameweekData.history.filter((h: any) => h.round === gw);

                        if (gameweekGames.length > 0) {
                            // Calculate points breakdown for the aggregated gameweek stats
                            const agg = gameweekGames.reduce((acc, fplStats) => {
                                const points = calculateGameweekPoints(convertToPlayerGameweekStats(fplStats), customPosition);
                                const aStats = acc.stats;
                                const aPB = acc.pointsBreakdown;
                                return {
                                    stats: {
                                        ...acc.stats,
                                        minutesPlayed: aStats.minutesPlayed ? fplStats.minutes : aStats.minutesPlayed + fplStats.minutes,
                                        goals: aStats.goals ? fplStats.goals_scored : aStats.goals + fplStats.goals_scored,
                                        assists: aStats.assists ? fplStats.assists : aStats.assists + fplStats.assists,
                                        cleanSheets: aStats.cleanSheets ? fplStats.clean_sheets : aStats.cleanSheets + fplStats.clean_sheets,
                                        yellowCards: aStats.yellowCards ? fplStats.yellow_cards : aStats.yellowCards + fplStats.yellow_cards,
                                        redCards: aStats.redCards ? fplStats.red_cards : aStats.redCards + fplStats.red_cards,
                                        saves: aStats.saves ? fplStats.saves : aStats.saves + fplStats.saves,
                                        penaltiesSaved: aStats.penaltiesSaved ? fplStats.penalties_saved : aStats.penaltiesSaved + fplStats.penalties_saved,
                                        goalsConceded: aStats.goalsConceded ? fplStats.goals_conceded : aStats.goalsConceded + fplStats.goals_conceded,
                                        bonus: aStats.bonus ? fplStats.bonus : aStats.bonus + fplStats.bonus,
                                    },
                                    pointsBreakdown: {
                                        ...acc.pointsBreakdown,
                                        minutesPlayed: aPB.minutesPlayed ? points.minutesPlayed : aPB.minutesPlayed + points.minutesPlayed,
                                        goals: aPB.goals ? points.goals : aPB.goals + points.goals,
                                        assists: aPB.assists ? points.assists : aPB.assists + points.assists,
                                        cleanSheets: aPB.cleanSheets ? points.cleanSheets : aPB.cleanSheets + points.cleanSheets,
                                        yellowCards: aPB.yellowCards ? points.yellowCards : aPB.yellowCards + points.yellowCards,
                                        redCards: aPB.redCards ? points.redCards : aPB.redCards + points.redCards,
                                        saves: aPB.saves ? points.saves : aPB.saves + points.saves,
                                        penaltiesSaved: aPB.penaltiesSaved ? points.penaltiesSaved : aPB.penaltiesSaved + points.penaltiesSaved,
                                        goalsConceded: aPB.goalsConceded ? points.goalsConceded : aPB.goalsConceded + points.goalsConceded,
                                        bonus: aPB.bonus ? points.bonus : aPB.bonus + points.bonus,
                                        total: aPB.total ? points.total : aPB.total + points.total,
                                    }
                                };
                            }, { pointsBreakdown: {}, stats: {}})
                            const isFinal = await isGameweekFinished(gw);

                            // Update cache with aggregated stats + game details
                            await updateGameweekData(
                                player.id,
                                gw,
                                agg.pointsBreakdown,
                                agg.stats,
                                isFinal
                            );
                        }
                    }
                }

                // Get calculated season points breakdown (from cache)
                const seasonAgg = await getSeasonPointsBreakdown(player.id);

                console.log(`${player.web_name} (${playerSheet.position}): ${seasonAgg.breakdown.total} points`);

                return {
                    ...player,
                    team_name: teams[player.team] || `Team ${player.team}`,
                    position_name: playerSheet.position,
                    custom_points: seasonAgg.breakdown.total,
                    stats: seasonAgg.stats,
                    points_breakdown: seasonAgg.breakdown,
                    player_info: playerSheet,
                    points_explanations: {},
                };
            })
    );

    return { players: enhancedPlayers, currentGameweek };
}
