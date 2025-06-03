// src/lib/scoring/generate-gameweek-points.ts
import type { CustomPosition, FplPlayerData } from '../../../types';
import { convertToPlayerGameweeksStats } from '../fpl/stats';
import { calculateGameweekPoints } from '../../../lib/points';

/**
 * Generate gameweek points data structure for specific gameweeks
 * This creates the precise data structure we want to store in element summaries
 */
export const generateGameweekPointsData = (
    fplPlayers: FplPlayerData[],
    fplPlayerGameweeksById: Record<number, any>,
    sheetsPlayersById: Record<string, any>,
    targetGameweeks: number[]
): Record<number, { draft: { gameweekPoints: Record<number, any> } }> => {
    console.log(`🔄 generateGameweekPointsData - Processing ${fplPlayers.length} players for gameweeks: ${targetGameweeks.join(', ')}`);

    const result: Record<number, { draft: { gameweekPoints: Record<number, any> } }> = {};

    fplPlayers
        .filter((fplPlayer: FplPlayerData) => sheetsPlayersById[fplPlayer.id])
        .forEach((fplPlayer: FplPlayerData) => {
            const playerSheet = sheetsPlayersById[fplPlayer.id];
            const position = playerSheet.position.toLowerCase() as CustomPosition;

            // Get all gameweek data for this player
            const allGameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];

            // Convert to your gameweek stats format
            const playerGameweekStats = convertToPlayerGameweeksStats(allGameweekData);

            // Create gameweek points object for only the target gameweeks
            const gameweekPoints: Record<number, any> = {};

            targetGameweeks.forEach(gameweek => {
                // Find the stats for this specific gameweek
                const gameweekStats = playerGameweekStats.find(gw => gw.gameweek === gameweek);

                if (gameweekStats) {
                    // Calculate points for this specific gameweek
                    const pointsBreakdown = calculateGameweekPoints(gameweekStats, position);

                    gameweekPoints[gameweek] = {
                        points: pointsBreakdown,
                        stats: {
                            appearance: gameweekStats.appearance,
                            goals: gameweekStats.goals,
                            assists: gameweekStats.assists,
                            cleanSheets: gameweekStats.cleanSheets,
                            goalsConceded: gameweekStats.goalsConceded,
                            yellowCards: gameweekStats.yellowCards,
                            redCards: gameweekStats.redCards,
                            saves: gameweekStats.saves,
                            penaltiesSaved: gameweekStats.penaltiesSaved,
                            bonus: gameweekStats.bonus
                        },
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            position: position
                        }
                    };

                    console.log(`✅ Player ${fplPlayer.id} GW${gameweek}: ${pointsBreakdown.total} points`);
                } else {
                    // No data for this gameweek (player didn't play or gameweek hasn't happened)
                    gameweekPoints[gameweek] = {
                        points: {
                            appearance: 0,
                            goals: 0,
                            assists: 0,
                            cleanSheets: 0,
                            yellowCards: 0,
                            redCards: 0,
                            saves: 0,
                            penaltiesSaved: 0,
                            goalsConceded: 0,
                            bonus: 0,
                            total: 0
                        },
                        stats: {
                            appearance: 0,
                            goals: 0,
                            assists: 0,
                            cleanSheets: 0,
                            goalsConceded: 0,
                            yellowCards: 0,
                            redCards: 0,
                            saves: 0,
                            penaltiesSaved: 0,
                            bonus: 0
                        },
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            position: position,
                            noData: true
                        }
                    };

                    console.log(`ℹ️ Player ${fplPlayer.id} GW${gameweek}: No data available`);
                }
            });

            // Create the structure that matches what updateElementSummariesWithDraft expects
            result[fplPlayer.id] = {
                draft: {
                    gameweekPoints
                }
            };
        });

    console.log(`✅ generateGameweekPointsData - Generated points for ${Object.keys(result).length} players`);
    return result;
};

/**
 * Utility function to calculate season totals from gameweek points
 * This can be used to get current season total from the gameweek-specific data
 */
export const calculateSeasonTotalFromGameweekPoints = (
    gameweekPoints: Record<number, any>
): { totalPoints: number; gameweeksPlayed: number } => {
    let totalPoints = 0;
    let gameweeksPlayed = 0;

    Object.values(gameweekPoints).forEach((gw: any) => {
        if (gw.points && !gw.metadata?.noData) {
            totalPoints += gw.points.total;
            if (gw.points.appearance > 0) {
                gameweeksPlayed++;
            }
        }
    });

    return { totalPoints, gameweeksPlayed };
};

/**
 * Utility function to get the latest gameweek points for a player
 */
export const getLatestGameweekPoints = (
    gameweekPoints: Record<number, any>
): { gameweek: number; points: any } | null => {
    const gameweeks = Object.keys(gameweekPoints)
        .map(Number)
        .sort((a, b) => b - a); // Sort descending to get latest first

    for (const gameweek of gameweeks) {
        const gwData = gameweekPoints[gameweek];
        if (gwData && !gwData.metadata?.noData) {
            return {
                gameweek,
                points: gwData.points
            };
        }
    }

    return null;
};

/**
 * Utility function to check if a player has data for a specific gameweek
 */
export const hasGameweekData = (
    gameweekPoints: Record<number, any>,
    gameweek: number
): boolean => {
    const gwData = gameweekPoints[gameweek];
    return gwData && !gwData.metadata?.noData;
};
