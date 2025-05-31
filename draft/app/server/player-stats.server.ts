import { getFplBootstrapData } from "./fpl/api";
import { readPlayers } from "./sheets/players";
import type { FplTeamData, PlayerData } from "../types";
import type { RefreshOptions, PlayerStatsData } from './cache/types';
import { getCacheOperationStatus } from './cache/operations';
import { getSeasonStats } from './cache/season-stats';
import { generateFreshPlayerData } from './cache/data-generator';
import { refreshPlayerCache } from './cache/refresh';
import { getSeasonPointsBreakdown } from './cache/gameweek-storage'; // Add this import

export async function getFastPlayerStatsData() {

    try {
        console.log('Loading fast player stats data with custom points...');

        const [bootstrapData, playersData] = await Promise.all([
            getFplBootstrapData(),
            readPlayers()
        ]);

        const playerIds = bootstrapData.elements.map(p => p.id);
        const seasonStatsMap = await getSeasonStats(playerIds);

        // Create lookup maps
        const teams = bootstrapData.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
            acc[team.id] = team.name;
            return acc;
        }, {});

        const playersLookup = playersData.reduce((acc: Record<string, PlayerData>, player: PlayerData) => {
            acc[player.id] = player;
            return acc;
        }, {});

        // Combine FPL data with cached season stats AND custom points
        const players = await Promise.all(
            bootstrapData.elements
                .filter((player) => playersLookup[player.id])
                .map(async (player) => {
                    const playerSheet = playersLookup[player.id];
                    const seasonStats = seasonStatsMap.get(player.id);
                    const season = await getSeasonPointsBreakdown(player.id);
                    const customPoints = season.breakdown.total;
                    const pointsExplanations = season.breakdown.explanations;
                    const pointsBreakdown = season.breakdown;

                    return {
                        id: player.id,
                        web_name: player.web_name,
                        team_name: teams[player.team] || `Team ${player.team}`,
                        position_name: playerSheet.position,
                        stats: seasonStats,
                        custom_points: customPoints, // Include custom points!
                        total_points: player.total_points, // Include FPL points
                        points_explanations: pointsExplanations, // Include explanations
                        points_breakdown: pointsBreakdown // Include actual breakdown values
                    };
                })
        );

        console.log(`Loaded fast stats for ${players.length} players with custom points`);

        return {
            players,
            teams,
            positions: {
                'gk': 'gk',
                'cb': 'cb',
                'fb': 'fb',
                'mid': 'mid',
                'wa': 'wa',
                'ca': 'ca'
            }
        };
    } catch (error) {
        console.error('Error in getFastPlayerStatsData:', error);
        throw error;
    }
}

export async function getPlayerStatsData(options: RefreshOptions = {}) {
    const { useCacheFirst = true, ...refreshOptions } = options;

    try {
        // Check if cache operation is currently running
        const operationStatus = await getCacheOperationStatus();
        const isRefreshing = operationStatus?.status === 'running';

        // If refreshing, return with status but no data (to avoid conflicts)
        if (isRefreshing) {
            return {
                players: [],
                teams: {},
                positions: {},
                cacheStatus: {
                    isRefreshing: true,
                    operationType: operationStatus?.operationType,
                    progress: operationStatus?.progress
                }
            };
        }

        // For fast player page loading, use season stats with custom points
        if (useCacheFirst && !refreshOptions.forceFullRefresh && !refreshOptions.clearAll) {
            console.log('Using fast player stats data with custom points');
            const fastData = await getFastPlayerStatsData();
            return {
                players: fastData.players, // remove player_info and gameweek_data? ???
                teams: fastData.teams,
                positions: fastData.positions,
                cacheStatus: {
                    isRefreshing: false
                }
            };
        }

        // For detailed view or refresh, use full data
        console.log('Loading full player data with gameweek details');
        const { players, currentGameweek } = await generateFreshPlayerData(refreshOptions);

        const bootstrapData = await getFplBootstrapData();

        return {
            players,
            teams: bootstrapData.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
                acc[team.id] = team.name;
                return acc;
            }, {}),
            positions: {
                'gk': 'gk',
                'cb': 'cb',
                'fb': 'fb',
                'mid': 'mid',
                'wa': 'wa',
                'ca': 'ca'
            },
            cacheStatus: {
                isRefreshing: false
            }
        };

    } catch (error) {
        console.error('Error in getPlayerStatsData:', error);
        throw error;
    }
}

// Export cache functions
export { refreshPlayerCache };
export { getCacheOperationStatus as getCacheRefreshStatus };
