/* Location: app/leagues/lib/category-standings.ts */

import { POSITION_COLUMNS } from '../constants/position-columns';
import type { CategoryStanding, LeagueStandingsTeamData, PositionCategory } from '../types/league-standings-types';
import { calculatePositionRankings } from './simple-position-rankings';

/**
 * Where one manager sits in each scoring category of their division, over the season.
 *
 * The rank points come from `calculatePositionRankings`, the same function the league
 * table uses, so the two can never disagree. The gaps are to the managers immediately
 * above and below in that category: 0 when level, null when there is no one there.
 *
 * Returns [] when the manager is not in the standings.
 */
export function getCategoryStandings(standings: LeagueStandingsTeamData[], userId: string): CategoryStanding[] {
    const manager = standings.find((team) => team.userId === userId);
    if (!manager) {
        return [];
    }

    const rankPoints = calculatePositionRankings(standings, 'seasonPoints')[userId];

    return POSITION_COLUMNS.flatMap(({ key, label, slots }) => {
        if (key === 'total') {
            return [];
        }
        return [
            {
                position: key,
                label,
                slots,
                ...getRankAndGaps(standings, manager, key),
                rankPoints: rankPoints[key],
                points: manager.seasonPoints[key],
                totalManagers: standings.length,
            },
        ];
    });
}

function getRankAndGaps(
    standings: LeagueStandingsTeamData[],
    manager: LeagueStandingsTeamData,
    position: PositionCategory,
): Pick<CategoryStanding, 'rank' | 'isTied' | 'tiedCount' | 'gapAbove' | 'gapBelow'> {
    const points = manager.seasonPoints[position];
    const others = standings.filter((team) => team.userId !== manager.userId).map((t) => t.seasonPoints[position]);

    const ahead = others.filter((other) => other > points);
    const behind = others.filter((other) => other < points);
    const tiedCount = others.length - ahead.length - behind.length + 1;

    return {
        rank: ahead.length + 1,
        isTied: tiedCount > 1,
        tiedCount,
        // Measured to the nearest manager on different points, so a tie looks past the
        // managers it is level with: what you need to catch, and what is chasing you.
        gapAbove: ahead.length ? Math.min(...ahead) - points : null,
        gapBelow: behind.length ? points - Math.max(...behind) : null,
    };
}
