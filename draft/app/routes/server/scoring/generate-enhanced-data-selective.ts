// src/lib/scoring/generate-enhanced-data-selective.ts
import type { CustomPosition, EnhancedPlayerData, FplPlayerData } from '../../../types';
import { convertToPlayerGameweeksStats } from '../fpl/stats';
import { calculateSeasonPoints, getFullBreakdown } from '../../../lib/points';

/**
 * Enhanced data generation with selective gameweek filtering
 * This is a wrapper around the existing generateEnhancedData function
 * that can optionally filter to specific gameweeks
 */
export const generateEnhancedDataForGameweeks = (
    fplPlayers: FplPlayerData[],
    fplPlayerGameweeksById: Record<number, any>,
    sheetsPlayersById: Record<string, any>,
    fplTeams: Record<number, string>,
    targetGameweeks?: number[]
): EnhancedPlayerData[] => {
    console.log(`🔄 generateEnhancedDataForGameweeks - Processing ${fplPlayers.length} players`);

    if (targetGameweeks) {
        console.log(`📊 Filtering to gameweeks: ${targetGameweeks.join(', ')}`);
    } else {
        console.log('📊 Processing all available gameweeks');
    }

    return fplPlayers
        .filter((fplPlayer: FplPlayerData) => sheetsPlayersById[fplPlayer.id])
        .map((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];

            // Get gameweek data and filter if targetGameweeks specified
            let gameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];

            // Apply gameweek filtering if specified
            if (targetGameweeks && targetGameweeks.length > 0) {
                const targetSet = new Set(targetGameweeks);
                gameweekData = gameweekData.filter((gw: any) => targetSet.has(gw.round));

                console.log(`🔍 Player ${fplPlayer.id}: Filtered from ${fplPlayerGameweeksById[fplPlayer.id]?.history?.length || 0} to ${gameweekData.length} gameweeks`);
            }

            // Convert to your gameweek stats format
            const playerGameweekStats = convertToPlayerGameweeksStats(gameweekData);

            // Calculate points using existing logic - unchanged!
            const position = playerSheet.position.toLowerCase() as CustomPosition;
            const breakdown = calculateSeasonPoints(playerGameweekStats, position);
            const fullBreakdown = getFullBreakdown(playerGameweekStats, position, breakdown);

            return {
                ...fplPlayer,
                draft: {
                    position: playerSheet.position,
                    pointsTotal: breakdown.points.total,
                    pointsBreakdown: fullBreakdown,
                    // Add metadata about what was generated
                    __generatedFor: targetGameweeks ? {
                        gameweeks: targetGameweeks,
                        generatedAt: new Date().toISOString(),
                        type: 'selective'
                    } : {
                        type: 'full',
                        generatedAt: new Date().toISOString()
                    }
                }
            };
        });
};

/**
 * Wrapper that maintains backward compatibility with existing generateEnhancedData
 * This allows existing code to continue working unchanged
 */
export const generateEnhancedData = (
    fplPlayers: FplPlayerData[],
    fplPlayerGameweeksById: Record<number, any>,
    sheetsPlayersById: Record<string, any>,
    fplTeams: Record<number, string>
): EnhancedPlayerData[] => {
    return generateEnhancedDataForGameweeks(
        fplPlayers,
        fplPlayerGameweeksById,
        sheetsPlayersById,
        fplTeams
        // No targetGameweeks parameter = process all gameweeks (existing behavior)
    );
};

/**
 * Utility function to get available gameweeks for a set of players
 */
export const getAvailableGameweeks = (
    fplPlayerGameweeksById: Record<number, any>
): number[] => {
    const gameweekSet = new Set<number>();

    Object.values(fplPlayerGameweeksById).forEach((playerData: any) => {
        if (playerData?.history) {
            playerData.history.forEach((gw: any) => {
                gameweekSet.add(gw.round);
            });
        }
    });

    return Array.from(gameweekSet).sort((a, b) => a - b);
};

/**
 * Utility function to get the latest gameweek with data
 */
export const getLatestGameweekWithData = (
    fplPlayerGameweeksById: Record<number, any>
): number | null => {
    const gameweeks = getAvailableGameweeks(fplPlayerGameweeksById);
    return gameweeks.length > 0 ? Math.max(...gameweeks) : null;
};

/**
 * Utility function to check if gameweek has completed data
 * (useful for determining if a gameweek is "final" or still "live")
 */
export const isGameweekComplete = (
    gameweek: number,
    fplPlayerGameweeksById: Record<number, any>,
    minimumPlayersWithData: number = 10
): boolean => {
    let playersWithData = 0;

    Object.values(fplPlayerGameweeksById).forEach((playerData: any) => {
        if (playerData?.history) {
            const hasGameweekData = playerData.history.some((gw: any) =>
                gw.round === gameweek && gw.minutes > 0
            );
            if (hasGameweekData) {
                playersWithData++;
            }
        }
    });

    return playersWithData >= minimumPlayersWithData;
};
