import type {
    CustomPosition,
    PlayerGameweekStatsData,
    PointsBreakdown,
    GameweekFixture
} from '../types';
import { isStatRelevant } from './is-stat-relevant';

// Position point multipliers and rules
export const POSITION_RULES = {
    gk: {
        goalPoints: 10,
        assists: 3,
        cleanSheetPoints: 5,
        savesThreshold: 2,
        savesRatio: 3, // 1 point per 3 saves after threshold
        penaltiesSaved: 5,
        goalsConcededPenalty: -1, // per 2 goals,
        yellowCard: -1,
        redCardPenalty: -3,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    },
    fb: {
        goalPoints: 8,
        assists: 3,
        cleanSheetPoints: 5,
        goalsConcededPenalty: -1, // per 2 goals,
        yellowCard: -1,
        redCardPenalty: -3,
        appearance: {
            under45Min: 1,
            over45Min: 3
        },
    },
    cb: {
        goalPoints: 8,
        assists: 3,
        cleanSheetPoints: 5,
        goalsConcededPenalty: -1, // per 2 goals,
        yellowCard: -1,
        redCardPenalty: -3,
        bonus: 1,
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
function calculateAppearancePoints(appearance: number, position: CustomPosition): number {
    if (appearance === 0) return 0;
    return appearance < 45 ? POSITION_RULES[position].appearance.under45Min : POSITION_RULES[position].appearance.over45Min;
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
    return Math.floor(saves / rule.savesRatio);
}
/**
 * Calculate penalties saved (goalkeepers only)
 */
function calculatePenaltiesSaved(saved: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    if (!('penaltiesSaved' in rule)) return 0;

    return saved * rule.penaltiesSaved;
}

/**
 * Calculate bonus
 */
function calculateBonus(bonus: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    if (!('bonus' in rule)) return 0;

    if (bonus < rule.bonus) return 0;

    return bonus;
}

/**
 * Calculate goals conceded penalty for defenders and goalkeepers
 */
function calculateGoalsConcededPenalty(goalsConceded: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];

    if (!('goalsConcededPenalty' in rule)) return 0;

    if (goalsConceded === 0) return 0; // i.e. do not give a point for having a clean sheet
    return goalsConceded * rule.goalsConcededPenalty + 1;
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
    let appearance = stats.appearance;
    if (fixtures && fixtures.length > 1) {
        // If there are multiple fixtures, use the sum of fixture minutes
        appearance = fixtures.reduce((sum, fixture) => sum + fixture.fixtureMinutes, 0);
    }

    const breakdown: PointsBreakdown = {
        appearance: calculateAppearancePoints(appearance, position),
        goals: calculateGoalPoints(stats.goals, position),
        assists: calculateAssistPoints(stats.assists, position),
        cleanSheets: calculateCleanSheetPoints(stats.cleanSheets, position),
        yellowCards: calculateYellowCardPenalty(stats.yellowCards, position),
        redCards: calculateRedCardPenalty(stats.redCards, position),
        saves: calculateSavesBonus(stats.saves, position),
        penaltiesSaved: calculatePenaltiesSaved(stats.penaltiesSaved, position),
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
): PointsBreakdown {
    const points: PointsBreakdown = {
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
    };
    const stats: PointsBreakdown = {
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
    };

    // Sum up all gameweek breakdowns
    gameweekStats.forEach(gwStats => {
        const gwBreakdown = calculateGameweekPoints(gwStats, position);

        Object.entries(gwBreakdown).forEach(([key, value]) => {
            if (key !== 'total') {
                (points as any)[key] += value;
                (stats as any)[key] += gwStats[key];
            }
        });
    });

    // Calculate season total
    points.total = Object.entries(points)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0);

    return { points, stats };
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
        ca: 'Centre Attacker'
    };

    return displayNames[position?.toLowerCase()] || position;
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
 * Format points for display (with + prefix for positive points)
 */
export function formatPointsDisplay(points: number): string {
    if (points > 0) return `+${points}`;
    return points.toString();
}

export const getFullBreakdown = (gameweeks, position, { points, stats }) => {
    const rules = POSITION_RULES[position.toLowerCase() as keyof typeof POSITION_RULES] || {} // ?????
    const gcByGameCount = gameweeks
        .sort((a, b)=> a.goals_conceded < b.goals_conceded ? -1 : 1)
        .reduce((acc, v) => ({
            ...acc,
            [v.goals_conceded]: acc[v.goals_conceded] ? acc[v.goals_conceded] +1 : 1
        }), {})
    const savesByGameCount = gameweeks
        .sort((a, b)=> a.saves < b.saves ? -1 : 1)
        .reduce((acc, v) => ({
            ...acc,
            [v.saves]: acc[v.saves] ? acc[v.saves] +1 : 1
        }), {})


    return {
        appearance: {
            label: 'Appearance',
            stat: stats.appearance,
            points: points.appearance || 0,
            formula:
                [`${gameweeks.filter(g => g.appearance >= 45).length} games (45+ min) × ${rules.appearance.over45Min}pts`,
                    `${gameweeks.filter(g => g.appearance > 0 && g.appearance < 45).length} games (<45 min) × ${rules.appearance.under45Min}pt`],
            isRelevant: true,
        },
        goals: {
            label: 'Goals',
            stat: stats.goals,
            points: points.goals || 0,
            formula: `${stats.goals} × ${rules.goalPoints} pts`,
            isRelevant: true,
        },
        assists: {
            label: 'Assists',
            stat: stats.assists,
            points: points.assists || 0,
            formula: `${stats.assists} × ${rules.assists} pts`,
            isRelevant: true,
        },
        cleanSheets: {
            label: 'Clean Sheets',
            stat: stats.cleanSheets,
            points: points.cleanSheets || 0,
            formula: isStatRelevant('clean_sheets', position) ?
                `${stats.cleanSheets} × ${rules.cleanSheetPoints} pts` :
                'N/A for position',
            isRelevant: isStatRelevant('clean_sheets', position)
        },
        yellowCards: {
            label: 'Yellow Cards',
            stat: stats.yellowCards,
            points: points.yellowCards || 0,
            formula: `${stats.yellowCards} × ${rules.yellowCard} pt`,
            isRelevant: true
        },
        redCards: {
            label: 'Red Cards',
            stat: stats.redCards,
            points: points.redCards || 0,
            formula: `${stats.redCards} × ${rules.redCardPenalty} pts`,
            isRelevant: true
        },
        bonus: {
            label: 'Bonus Points',
            stat: stats.bonus,
            points: points.bonus || 0,
            formula: isStatRelevant('bonus', position) ?
                `${stats.bonus} bonus pts` :
                'N/A for position',
            isRelevant: isStatRelevant('bonus', position)
        },
        saves: {
            label: 'Saves',
            stat: stats.saves,
            points: points.saves || 0,
            formula:
                isStatRelevant('saves', position) && gameweeks ?
                    Object.entries(savesByGameCount).map(([key, value]) => (
                        parseInt(key, 10) <= rules.savesThreshold ?
                            `${value} games (${key} saves) x 0 pts` :
                            `${value} games (${key} saves) x ${Math.floor(parseInt(key, 10) / rules.savesRatio)} pts`
                    )) :
                    'N/A for position',
            isRelevant: isStatRelevant('saves', position)
        },
        penaltiesSaved: {
            label: 'Penalties Saved',
            stat: stats.penaltiesSaved,
            points: points.penaltiesSaved || 0,
            formula: isStatRelevant('penalties_saved', position) ?
                `${stats.penaltiesSaved} x ${rules.penaltiesSaved} pts` :
                'N/A for position',
            isRelevant: isStatRelevant('penalties_saved', position)
        },
        goalsConceded: {
            label: 'Goals Conceded',
            stat: stats.goalsConceded,
            points: points.goalsConceded || 0,
            formula: isStatRelevant('goals_conceded', position) && gameweeks ?
                Object.entries(gcByGameCount).map(([key, value]) => (
                    parseInt(key, 10) === 0 ?
                        `${value} games (0 gc) x 0 pts` :
                        `${value} games (${key} gc) x ${(parseInt(key, 10) * rules.goalsConcededPenalty) + 1} pts`
                )) :
                'N/A for position',
            isRelevant: isStatRelevant('goals_conceded', position)
        }
    };
}
