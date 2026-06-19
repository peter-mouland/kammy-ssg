// app/leagues/lib/simple-position-rankings.ts

import type { LeagueStandingsTeamData } from '../types/league-standings-types';

/**
 * Calculate position rankings for a list of teams
 * Returns a map of teamId -> rank score for each position, plus total rank sum
 * Rank scores are inverted: 0 = worst, (numTeams - 1) = best
 * Tied players split the rank score using: ((RankScore - numOfPlayers + 1) + RankScore) / 2
 */
export function calculatePositionRankings(
    teams: LeagueStandingsTeamData[],
    pointsSource: 'gameweekPoints' | 'seasonPoints',
): Record<string, Record<string, number>> {
    const rankings: Record<string, Record<string, number>> = {};
    const numTeams = teams.length;

    // Initialize rankings for each team
    teams.forEach((team) => {
        rankings[team.userId] = {};
    });

    // Calculate rankings for each position
    const positions = ['gk', 'cb', 'fb', 'mid', 'wa', 'ca'] as const;

    positions.forEach((position) => {
        // Sort teams by points for this position (descending)
        const sortedTeams = [...teams].sort((a, b) => b[pointsSource][position] - a[pointsSource][position]);

        // Group teams by points to handle ties
        const pointGroups: { points: number; teams: typeof sortedTeams }[] = [];
        let currentGroup: { points: number; teams: typeof sortedTeams } | null = null;

        sortedTeams.forEach((team) => {
            const points = team[pointsSource][position];

            if (!currentGroup || currentGroup.points !== points) {
                currentGroup = { points, teams: [] };
                pointGroups.push(currentGroup);
            }
            currentGroup.teams.push(team);
        });

        // Assign rank scores, handling ties
        let currentRankPosition = 0;

        pointGroups.forEach((group) => {
            const numPlayersInGroup = group.teams.length;
            const topRankScore = numTeams - 1 - currentRankPosition;

            let rankScore: number;

            if (numPlayersInGroup === 1) {
                // No tie - use the rank score directly
                rankScore = topRankScore;
            } else {
                // Tie - split the rank scores
                // Formula: ((RankScore - numOfPlayers + 1) + RankScore) / 2
                const bottomRankScore = topRankScore - numPlayersInGroup + 1;
                rankScore = (bottomRankScore + topRankScore) / 2;
            }

            // Assign the same rank score to all teams in this group
            group.teams.forEach((team) => {
                rankings[team.userId][position] = rankScore;
            });

            currentRankPosition += numPlayersInGroup;
        });
    });

    // Calculate total as sum of all individual position rank scores
    teams.forEach((team) => {
        const rankSum = positions.reduce((sum, position) => {
            return sum + rankings[team.userId][position];
        }, 0);
        rankings[team.userId].total = rankSum;
    });

    return rankings;
}
