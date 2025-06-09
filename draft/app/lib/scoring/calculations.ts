// src/lib/scoring/calculations.ts - Core point calculation logic

import type {
    CustomPosition,
    PlayerGameweekStatsData,
    PointsBreakdown,
    GameweekFixture
} from '../../types';
import { isStatRelevant } from './utils';
import { POSITION_RULES } from './rules';

/**
 * Calculate appearance points based on minutes played
 */
export function calculateAppearancePoints(appearance: number, position: CustomPosition): number {
    if (appearance === 0) return 0;
    return appearance < 45 ?
        POSITION_RULES[position].appearance.under45Min : POSITION_RULES[position].appearance.over45Min;
}

/**
 * Calculate goal points based on position
 */
export function calculateGoalPoints(goals: number, position: CustomPosition): number {
    return goals * POSITION_RULES[position].goalPoints;
}

/**
 * Calculate assist points (same for all positions)
 */
export function calculateAssistPoints(assists: number, position: CustomPosition): number {
    return assists * POSITION_RULES[position].assists;
}

/**
 * Calculate clean sheet points based on position
 */
export function calculateCleanSheetPoints(cleanSheets: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    return cleanSheets * (rule.cleanSheetPoints || 0);
}

/**
 * Calculate yellow card penalty (same for all positions)
 */
export function calculateYellowCardPenalty(yellowCards: number, position: CustomPosition): number {
    return yellowCards * POSITION_RULES[position].yellowCard;
}

/**
 * Calculate red card penalty based on position
 */
export function calculateRedCardPenalty(redCards: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    return redCards * rule.redCardPenalty;
}

/**
 * Calculate saves bonus (goalkeepers only)
 */
export function calculateSavesBonus(saves: number, position: CustomPosition): number {
    if (position !== 'gk') return 0;

    const rule = POSITION_RULES.gk;
    if (saves <= rule.savesThreshold) return 0;
    return Math.floor(saves / rule.savesRatio);
}

/**
 * Calculate penalties saved (goalkeepers only)
 */
export function calculatePenaltiesSaved(saved: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    if (!('penaltiesSaved' in rule)) return 0;

    return saved * rule.penaltiesSaved;
}

/**
 * Calculate bonus points
 */
export function calculateBonus(bonus: number, position: CustomPosition): number {
    const rule = POSITION_RULES[position];
    if (!('bonus' in rule)) return 0;

    if (bonus < rule.bonus) return 0;

    return bonus;
}

/**
 * Calculate goals conceded penalty for defenders and goalkeepers
 */
export function calculateGoalsConcededPenalty(goalsConceded: number, position: CustomPosition): number {
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
): { points: PointsBreakdown; stats: PointsBreakdown } {
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
                (stats as any)[key] += gwStats[key as keyof PlayerGameweekStatsData] || 0;
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
 * Get full breakdown with detailed formulas and relevance info
 */
export function getFullBreakdown(
    gameweeks: any[],
    position: CustomPosition,
    { points, stats }: { points: PointsBreakdown; stats: PointsBreakdown }
) {
    const rules = POSITION_RULES[position.toLowerCase() as keyof typeof POSITION_RULES] || {};

    const gcByGameCount = gameweeks
        .sort((a, b) => a.goals_conceded < b.goals_conceded ? -1 : 1)
        .reduce((acc, v) => ({
            ...acc,
            [v.goals_conceded]: acc[v.goals_conceded] ? acc[v.goals_conceded] + 1 : 1
        }), {});

    const savesByGameCount = gameweeks
        .sort((a, b) => a.saves < b.saves ? -1 : 1)
        .reduce((acc, v) => ({
            ...acc,
            [v.saves]: acc[v.saves] ? acc[v.saves] + 1 : 1
        }), {});

    return {
        appearance: {
            label: 'Appearance',
            stat: stats.appearance,
            points: points.appearance || 0,
            formula: [
                `${gameweeks.filter(g => g.appearance >= 45).length} games (45+ min) × ${rules.appearance?.over45Min || 0}pts`,
                `${gameweeks.filter(g => g.appearance > 0 && g.appearance < 45).length} games (<45 min) × ${rules.appearance?.under45Min || 0}pt`
            ],
            isRelevant: true,
        },
        goals: {
            label: 'Goals',
            stat: stats.goals,
            points: points.goals || 0,
            formula: `${stats.goals} × ${rules.goalPoints || 0} pts`,
            isRelevant: true,
        },
        assists: {
            label: 'Assists',
            stat: stats.assists,
            points: points.assists || 0,
            formula: `${stats.assists} × ${rules.assists || 0} pts`,
            isRelevant: true,
        },
        cleanSheets: {
            label: 'Clean Sheets',
            stat: stats.cleanSheets,
            points: points.cleanSheets || 0,
            formula: isStatRelevant('clean_sheets', position) ?
                `${stats.cleanSheets} × ${rules.cleanSheetPoints || 0} pts` : 'Not applicable for this position',
            isRelevant: isStatRelevant('clean_sheets', position),
        },
        yellowCards: {
            label: 'Yellow Cards',
            stat: stats.yellowCards,
            points: points.yellowCards || 0,
            formula: `${stats.yellowCards} × ${rules.yellowCard || 0} pts`,
            isRelevant: true,
        },
        redCards: {
            label: 'Red Cards',
            stat: stats.redCards,
            points: points.redCards || 0,
            formula: `${stats.redCards} × ${rules.redCardPenalty || 0} pts`,
            isRelevant: true,
        },
        saves: {
            label: 'Saves',
            stat: stats.saves,
            points: points.saves || 0,
            formula: isStatRelevant('saves', position) ?
                `${Object.entries(savesByGameCount).map(([saves, count]) => `${count} games with ${saves} saves`).join(', ')}` :
                'Not applicable for this position',
            isRelevant: isStatRelevant('saves', position),
        },
        penaltiesSaved: {
            label: 'Penalties Saved',
            stat: stats.penaltiesSaved,
            points: points.penaltiesSaved || 0,
            formula: isStatRelevant('penalties_saved', position) ?
                `${stats.penaltiesSaved} × ${rules.penaltiesSaved || 0} pts` : 'Not applicable for this position',
            isRelevant: isStatRelevant('penalties_saved', position),
        },
        goalsConceded: {
            label: 'Goals Conceded',
            stat: stats.goalsConceded,
            points: points.goalsConceded || 0,
            formula: isStatRelevant('goals_conceded', position) ?
                `${Object.entries(gcByGameCount).map(([gc, count]) => `${count} games with ${gc} goals conceded`).join(', ')}` :
                'Not applicable for this position',
            isRelevant: isStatRelevant('goals_conceded', position),
        },
        bonus: {
            label: 'Bonus',
            stat: stats.bonus,
            points: points.bonus || 0,
            formula: isStatRelevant('bonus', position) ?
                `${stats.bonus} × ${rules.bonus || 0} pts` : 'Not applicable for this position',
            isRelevant: isStatRelevant('bonus', position),
        },
        total: {
            label: 'Total',
            stat: stats.total,
            points: points.total || 0,
            formula: 'Sum of all point categories',
            isRelevant: true,
        }
    };
}


/**
 * Calculate season totals from gameweek points
 */
export function calculateSeasonTotalFromGameweekPoints(
    gameweekPoints: Record<number, any>
): { totalPoints: number; gameweeksPlayed: number } {
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
}
