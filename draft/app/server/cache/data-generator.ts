import { getFplBootstrapData, getBatchPlayerGameweekData } from "../fpl/api";
import { convertToPlayerGameweekStats } from "../fpl/stats";
import { readPlayers } from "../sheets/players";
import { calculateSeasonPoints, calculateGameweekPoints } from "../../lib/points";
import type { FplPlayerGameweekData, FplPlayerData, FplTeamData, PlayerData, CustomPosition, PlayerGameweekStatsData } from "../../types";
import type { RefreshOptions, EnhancedPlayerData } from './types';
import { getCacheMetadata, getCachedGameweekData, cacheGameweekData, clearAllCache } from './storage';

async function isGameweekFinished(gameweek: number): Promise<boolean> {
    try {
        const bootstrapData = await getFplBootstrapData();
        const gameweekEvent = bootstrapData.events.find(event => event.id === gameweek);

        if (!gameweekEvent) return false;

        // Gameweek is finished if it's marked as finished and not current
        return gameweekEvent.finished && !gameweekEvent.is_current;
    } catch {
        return false;
    }
}

async function getGameweeksToUpdate(currentGameweek: number, metadata: any | null, forceCurrentOnly: boolean = false): Promise<number[]> {
    if (forceCurrentOnly) {
        // Quick refresh - only current gameweek
        return [currentGameweek];
    }

    const gameweeksToUpdate: number[] = [];

    if (!metadata) {
        // No cache exists, need all gameweeks up to current
        return Array.from({ length: currentGameweek }, (_, i) => i + 1);
    }

    // Always update current gameweek (it might still be changing)
    gameweeksToUpdate.push(currentGameweek);

    // Check if previous gameweek is final
    if (currentGameweek > 1) {
        const previousGameweek = currentGameweek - 1;
        const isPreviousFinished = await isGameweekFinished(previousGameweek);

        // Update previous gameweek if it's finished but not marked as final in our cache
        if (isPreviousFinished && !metadata.gameweeksProcessed.includes(previousGameweek)) {
            gameweeksToUpdate.push(previousGameweek);
        }
    }

    console.log(`Gameweeks to update: ${gameweeksToUpdate.join(', ')}`);
    return gameweeksToUpdate;
}

export async function generateFreshPlayerData(options: RefreshOptions = {}): Promise<{ players: EnhancedPlayerData[], currentGameweek: number }> {
    const { forceFullRefresh = false, clearAll = false, specificGameweeks, quickRefresh = false } = options;

    console.log('Generating fresh player data...', { forceFullRefresh, clearAll, specificGameweeks, quickRefresh });

    const [bootstrapData, playersData] = await Promise.all([
        getFplBootstrapData(),
        readPlayers()
    ]);

    const currentGameweek = bootstrapData.events.find(event => event.is_current)?.id || 1;
    const metadata = await getCacheMetadata();

    // Determine which gameweeks to update
    let gameweeksToUpdate: number[];
    if (specificGameweeks) {
        gameweeksToUpdate = specificGameweeks;
    } else if (forceFullRefresh || !metadata) {
        gameweeksToUpdate = Array.from({ length: currentGameweek }, (_, i) => i + 1);
    } else {
        gameweeksToUpdate = await getGameweeksToUpdate(currentGameweek, metadata, quickRefresh);
    }

    console.log(`Updating gameweeks: ${gameweeksToUpdate.join(', ')}`);

    // Get active players
    const playerIds = bootstrapData.elements
        .map(p => p.id);

    // Get existing cached gameweek data (only if not clearing all)
    // Now this reads from the aggregated player documents
    let cachedGameweekData = new Map<string, any>();
    if (!clearAll) {
        cachedGameweekData = await getCachedGameweekData(playerIds, gameweeksToUpdate);
    }

    // Fetch fresh data only for gameweeks that need updating
    const playersNeedingFreshData = playerIds.filter(playerId => {
        if (clearAll) {
            // If clearing all, fetch all players
            return true;
        }
        return gameweeksToUpdate.some(gw => {
            const key = `${playerId}-${gw}`;
            const cached = cachedGameweekData.get(key);
            // Fetch if not cached, or if it's the current gameweek (might still be changing)
            return !cached || (!cached.isFinal && gw === currentGameweek);
        });
    });

    console.log(`Fetching fresh data for ${playersNeedingFreshData.length} players`);

    let freshGameweekData: Record<number, any> = {};
    if (playersNeedingFreshData.length > 0) {
        freshGameweekData = await getBatchPlayerGameweekData(playersNeedingFreshData, 25);
    }

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
    console.log('Sample lookup keys:', Object.keys(playersLookup).slice(0, 10));

    // Process all players
    const enhancedPlayers: EnhancedPlayerData[] = await Promise.all(
        bootstrapData.elements
            .filter((player: FplPlayerData) => playersLookup[player.id])
            .map(async (player: FplPlayerData) => {
                // Try to find custom player data
                const playerSheet = playersLookup[player.id];

                console.log(`Player ${player.web_name}: FPL ID ${player.id}, Found custom data:`, playerSheet ? `${playerSheet.firstName} ${playerSheet.lastName} - ${playerSheet.position}` : 'No match');

                // Determine position
                const customPosition = playerSheet.position?.toLowerCase() as CustomPosition;

                // Combine cached and fresh gameweek data
                const allGameweekData: FplPlayerGameweekData[] = [];
                const allGameweekStats: PlayerGameweekStatsData[] = [];

                for (let gw = 1; gw <= currentGameweek; gw++) {
                    const cacheKey = `${player.id}-${gw}`;
                    const cached = cachedGameweekData.get(cacheKey);

                    if (cached && cached.isFinal && !clearAll) {
                        // Use cached data for final gameweeks (unless clearing all)
                        allGameweekData.push(cached.data);
                        allGameweekStats.push(convertToPlayerGameweekStats(cached.data));
                    } else {
                        // Use fresh data for current/recent gameweeks or when clearing all
                        const freshData = freshGameweekData[player.id]?.history?.find((h: any) => h.round === gw);
                        if (freshData) {
                            allGameweekData.push(freshData);
                            allGameweekStats.push(convertToPlayerGameweekStats(freshData));

                            // Cache the fresh data in the player's aggregated document
                            if (!clearAll) {
                                const gwBreakdown = calculateGameweekPoints(
                                    convertToPlayerGameweekStats(freshData),
                                    customPosition
                                );
                                const isFinal = await isGameweekFinished(gw);
                                await cacheGameweekData(player.id, gw, freshData, gwBreakdown, isFinal);
                            }
                        }
                    }
                }

                // Calculate season points
                const pointsBreakdown = calculateSeasonPoints(allGameweekStats, customPosition);

                console.log(`${player.web_name} (${playerSheet.position}): ${pointsBreakdown.total}`);

                return {
                    ...player,
                    team_name: teams[player.team] || `Team ${player.team}`,
                    position_name: playerSheet.position,
                    custom_points: pointsBreakdown.total,
                    points_breakdown: pointsBreakdown,
                    player_info: playerSheet,
                    gameweek_data: allGameweekData
                };
            })
        );

    // If clearing all, now clear the cache AFTER we have fresh data ready
    if (clearAll) {
        console.log('Fresh data generated, now clearing old cache...');
        await clearAllCache();
    }

    return { players: enhancedPlayers, currentGameweek };
}
