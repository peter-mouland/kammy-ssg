import type {
    CustomPosition,
    PlayerGameweekStatsData,
    PointsBreakdown,
    GameweekFixture
} from '../types';

// Position point multipliers and rules
export const POSITION_RULES = {
    gk: {
        goalPoints: 10,
        cleanSheetPoints: 5,
        redCardPenalty: -3,
        savesThreshold: 2,
        savesRatio: 3, // 1 point per 3 saves after threshold
        goalsConcededPenalty: -1, // per 2 goals,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    },
    fb: {
        goalPoints: 8,
        cleanSheetPoints: 5,
        redCardPenalty: -3,
        goalsConcededPenalty: -1, // per 2 goals,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    },
    cb: {
        goalPoints: 8,
        cleanSheetPoints: 5,
        redCardPenalty: -3,
        bonus: 1,
        goalsConcededPenalty: -1, // per 2 goals,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    },
    mid: {
        goalPoints: 5,
        bonus: 1,
        cleanSheetPoints: 3,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    },
    wa: {
        goalPoints: 4,
        cleanSheetPoints: 0,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    },
    ca: {
        goalPoints: 4,
        cleanSheetPoints: 0,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    }
} as const;

/**
 * Calculate appearance points based on minutes played
 */
function calculateAppearancePoints(minutesPlayed: number, position: CustomPosition): number {
    if (minutesPlayed === 0) return 0;
    return minutesPlayed < 45 ? POSITION_RULES[position].appearance.under45Min : POSITION_RULES[position].appearance.over45Min;
}

/**
 * Calculate goal points based on position
 */
function calculateGoalPoints(goals: number, position: CustomPosition): number {
    return goals * POSITION_RULES[position].goalPoints;
}

/**
 * Calculate assist points (same for all positions)
 */
function calculateAssistPoints(assists: number, position: CustomPosition): number {
    return assists * POSITION_RULES[position].assists;
}

/**
 * Calculate clean sheet points based on position
 */
function calculateCleanSheetPoints(cleanSheets: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    return cleanSheets * (rule.cleanSheetPoints || 0);
}

/**
 * Calculate yellow card penalty (same for all positions)
 */
function calculateYellowCardPenalty(yellowCards: number, position: CustomPosition): number {
    return yellowCards * POSITION_RULES[position].yellowCard;
}

/**
 * Calculate red card penalty based on position
 */
function calculateRedCardPenalty(redCards: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    return redCards * rule.redCardPenalty;
}

/**
 * Calculate saves bonus (goalkeepers only)
 */
function calculateSavesBonus(saves: number, position: CustomPosition): number {
    if (position !== 'gk') return 0;

    const rule = POSITION_RULES.gk;
    if (saves <= rule.savesThreshold) return 0;

    const bonusSaves = saves - rule.savesThreshold;
    return Math.floor(bonusSaves / rule.savesRatio);
}

/**
 * Calculate bonus
 */
function calculateBonus(bonus: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    if (!('bonus' in rule)) return 0;

    if (bonus <= rule.bonus) return 0;

    return bonus;
}

/**
 * Calculate goals conceded penalty for defenders and goalkeepers
 */
function calculateGoalsConcededPenalty(goalsConceded: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];

    if (!('goalsConcededPenalty' in rule)) return 0;

    if (goalsConceded === 0) return 0; // i.e. do not give a point for having a clean sheet
    return goalsConceded * -1 + 1;
}

/**
 * Calculate total custom points for a player's gameweek performance
 */
export function calculateGameweekPoints(
    stats: PlayerGameweekStatsData,
    position: CustomPosition,
    fixtures?: GameweekFixture[]
): PointsBreakdown {
    // Handle multiple fixtures in the same gameweek
    let totalMinutes = stats.minutesPlayed;
    if (fixtures && fixtures.length > 1) {
        // If there are multiple fixtures, use the sum of fixture minutes
        totalMinutes = fixtures.reduce((sum, fixture) => sum + fixture.fixtureMinutes, 0);
    }

    const breakdown: PointsBreakdown = {
        appearance: calculateAppearancePoints(totalMinutes, position),
        goals: calculateGoalPoints(stats.goals, position),
        assists: calculateAssistPoints(stats.assists, position),
        cleanSheets: calculateCleanSheetPoints(stats.cleanSheets, position),
        yellowCards: calculateYellowCardPenalty(stats.yellowCards, position),
        redCards: calculateRedCardPenalty(stats.redCards, position),
        saves: calculateSavesBonus(stats.saves, position),
        goalsConceded: calculateGoalsConcededPenalty(stats.goalsConceded, position),
        bonus: calculateBonus(stats.bonus, position),
        total: 0
    };

    // Calculate total points
    breakdown.total = Object.entries(breakdown)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0);

    return breakdown;
}

/**
 * Calculate season total points from gameweek data
 */
export function calculateSeasonPoints(
    gameweekStats: PlayerGameweekStatsData[],
    position: CustomPosition,
    fixturesByGameweek?: Map<number, GameweekFixture[]>
): PointsBreakdown {
    const seasonBreakdown: PointsBreakdown = {
        appearance: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        goalsConceded: 0,
        bonus: 0,
        total: 0
    };

    // Sum up all gameweek breakdowns
    gameweekStats.forEach(gwStats => {
        const fixtures = fixturesByGameweek?.get(gwStats.gameweek);
        const gwBreakdown = calculateGameweekPoints(gwStats, position, fixtures);

        Object.entries(gwBreakdown).forEach(([key, value]) => {
            if (key !== 'total') {
                (seasonBreakdown as any)[key] += value;
            }
        });
    });

    // Calculate season total
    seasonBreakdown.total = Object.entries(seasonBreakdown)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0);

    return seasonBreakdown;
}

/**
 * Get position from custom position enum
 */
export function getPositionDisplayName(position: CustomPosition): string {
    const displayNames = {
        gk: 'Goalkeeper',
        fb: 'Full-back',
        cb: 'Centre-back',
        mid: 'Midfielder',
        wa: 'Winger/Attacking Mid',
        ca: 'Centre Forward'
    };

    return displayNames[position];
}

/**
 * Get position color for UI display
 */
export function getPositionColor(position: CustomPosition): string {
    const colors = {
        gk: '#10B981', // emerald-500
        fb: '#3B82F6', // blue-500
        cb: '#3B82F6', // blue-500
        mid: '#8B5CF6', // violet-500
        wa: '#F59E0B', // amber-500
        ca: '#EF4444'  // red-500
    };

    return colors[position];
}

/**
 * Validate that a position is a valid custom position
 */
export function isValidCustomPosition(position: string): position is CustomPosition {
    return ['gk', 'fb', 'cb', 'mid', 'wa', 'ca'].includes(position);
}

/**
 * Format points for display (with + prefix for positive points)
 */
export function formatPointsDisplay(points: number): string {
    if (points > 0) return `+${points}`;
    return points.toString();
}

/**
 * Get points breakdown as formatted strings for display
 */
export function getPointsBreakdownDisplay(breakdown: PointsBreakdown): Record<string, string> {
    return {
        appearance: formatPointsDisplay(breakdown.appearance),
        goals: formatPointsDisplay(breakdown.goals),
        assists: formatPointsDisplay(breakdown.assists),
        cleanSheets: formatPointsDisplay(breakdown.cleanSheets),
        yellowCards: formatPointsDisplay(breakdown.yellowCards),
        redCards: formatPointsDisplay(breakdown.redCards),
        saves: formatPointsDisplay(breakdown.saves),
        goalsConceded: formatPointsDisplay(breakdown.goalsConceded),
        bonus: formatPointsDisplay(breakdown.bonus),
        total: formatPointsDisplay(breakdown.total)
    };
}
