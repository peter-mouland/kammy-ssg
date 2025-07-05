// app/teams/lib/team-stats-utils.ts
import type { ContributingStatsBreakdown, TeamRoster } from '../types/team-types';

/**
 * Calculate contributing stats breakdown for the team
 */
export function calculateContributingStats(roster: TeamRoster, useSeasonPoints: boolean): ContributingStatsBreakdown {
    const allStats = {
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
    };

    const allPoints = {
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
    };

    // Sum up stats and points from all players
    Object.values(roster).forEach((positionSlot) => {
        if (positionSlot?.season) {
            // ignore on_loan_0
            const stats = useSeasonPoints ? positionSlot.season.stats : positionSlot.gameweek.stats;
            const points = useSeasonPoints ? positionSlot.season.points : positionSlot.gameweek.points;

            Object.keys(allStats).forEach((statKey) => {
                const key = statKey as keyof typeof allStats;
                allStats[key] += stats[key] || 0;
                allPoints[key] += points[key] || 0;
            });
        }
    });

    // Build breakdown with relevance and descriptions
    return {
        appearance: {
            label: 'Appearances',
            statValue: allStats.appearance,
            pointsValue: allPoints.appearance,
            isRelevant: true,
            description: 'Points for playing (varies by minutes played)',
        },
        goals: {
            label: 'Goals',
            statValue: allStats.goals,
            pointsValue: allPoints.goals,
            isRelevant: true,
            description: 'Points vary by player position',
        },
        assists: {
            label: 'Assists',
            statValue: allStats.assists,
            pointsValue: allPoints.assists,
            isRelevant: true,
            description: 'Same points for all positions',
        },
        cleanSheets: {
            label: 'Clean Sheets',
            statValue: allStats.cleanSheets,
            pointsValue: allPoints.cleanSheets,
            isRelevant: allStats.cleanSheets > 0,
            description: 'For goalkeepers and defenders only',
        },
        yellowCards: {
            label: 'Yellow Cards',
            statValue: allStats.yellowCards,
            pointsValue: allPoints.yellowCards,
            isRelevant: allStats.yellowCards > 0,
            description: 'Penalty points for all positions',
        },
        redCards: {
            label: 'Red Cards',
            statValue: allStats.redCards,
            pointsValue: allPoints.redCards,
            isRelevant: allStats.redCards > 0,
            description: 'Penalty points for all positions',
        },
        saves: {
            label: 'Saves',
            statValue: allStats.saves,
            pointsValue: allPoints.saves,
            isRelevant: allStats.saves > 0,
            description: 'Bonus points for goalkeepers only',
        },
        penaltiesSaved: {
            label: 'Penalties Saved',
            statValue: allStats.penaltiesSaved,
            pointsValue: allPoints.penaltiesSaved,
            isRelevant: allStats.penaltiesSaved > 0,
            description: 'Bonus points for goalkeepers only',
        },
        goalsConceded: {
            label: 'Goals Conceded',
            statValue: allStats.goalsConceded,
            pointsValue: allPoints.goalsConceded,
            isRelevant: allStats.goalsConceded > 0,
            description: 'Penalty points for goalkeepers and defenders',
        },
        bonus: {
            label: 'Bonus Points',
            statValue: allStats.bonus,
            pointsValue: allPoints.bonus,
            isRelevant: allStats.bonus > 0,
            description: 'FPL bonus points system',
        },
    };
}
