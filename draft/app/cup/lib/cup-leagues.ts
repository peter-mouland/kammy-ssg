/* Location: app/cup/lib/cup-leagues.ts */

import type { DivisionId, ManagerId } from '../../_shared/types/league-types';
import type { CupStanding } from './cup-standings';
import type { CupTeamVisibility } from './cup-visibility';
import { fisherYatesShuffle } from './knockout';

/**
 * The league stage split into leagues: an admin chooses how many managers go
 * in each one and the app draws them at random. Qualification does not change:
 * the top 16 managers overall, across every league, still reach the Round of
 * 16. The leagues are for the table a manager reads, not a separate contest.
 */

/**
 * Draw `managerIds` into leagues of at most `leagueSize`, sized within one of
 * each other so the last league is never a rump: 25 managers at 8 per league
 * draw 7, 6, 6, 6 rather than 8, 8, 8, 1.
 */
export function generateLeagues(
    managerIds: ManagerId[],
    leagueSize: number,
    random: () => number = Math.random,
): ManagerId[][] {
    if (managerIds.length === 0) return [];
    if (!Number.isInteger(leagueSize) || leagueSize < 2) {
        throw new Error('League size must be at least 2.');
    }

    const shuffled = fisherYatesShuffle(managerIds, random);
    const leagueCount = Math.ceil(shuffled.length / leagueSize);
    const baseSize = Math.floor(shuffled.length / leagueCount);
    const largerLeagues = shuffled.length % leagueCount;

    const leagues: ManagerId[][] = [];
    let offset = 0;
    for (let league = 0; league < leagueCount; league++) {
        const size = baseSize + (league < largerLeagues ? 1 : 0);
        leagues.push(shuffled.slice(offset, offset + size));
        offset += size;
    }
    return leagues;
}

/** League A, League B, ... by position in the generated list. */
export function leagueName(index: number): string {
    return index < 26 ? `League ${String.fromCharCode(65 + index)}` : `League ${index + 1}`;
}

export interface CupLeagueTableEntry {
    manager: ManagerId;
    userName: string;
    teamName: string;
    division: DivisionId;
    /** League-stage points in total, across every league gameweek. */
    points: number;
    /** This gameweek's points, when the team is revealed. */
    gameweekPoints: number | null;
    /** Rank across every manager, not just this league. Null until they score. */
    rank: number | null;
    disqualified: boolean;
    visibility: CupTeamVisibility;
}

export interface CupLeagueTable {
    name: string;
    entries: CupLeagueTableEntry[];
}

export interface LeagueManagerInfo {
    userName: string;
    teamName: string;
    division: DivisionId;
    visibility: CupTeamVisibility;
    /** This gameweek's points when revealed, for the status column. */
    points?: number | null;
}

/**
 * One ranked table per league. Managers with no scored submission yet still
 * appear, on zero points: at the start of the league stage the table is the
 * league, even before anyone has points.
 */
export function buildLeagueTables(input: {
    leagues: ManagerId[][];
    standings: CupStanding[];
    managerInfo: Map<ManagerId, LeagueManagerInfo>;
}): CupLeagueTable[] {
    const standingByManager = new Map(input.standings.map((standing) => [standing.manager, standing]));

    return input.leagues.map((managerIds, index) => {
        const entries = managerIds
            .map((manager): CupLeagueTableEntry | null => {
                const info = input.managerInfo.get(manager);
                if (!info) return null;
                const standing = standingByManager.get(manager);
                return {
                    manager,
                    userName: info.userName,
                    teamName: info.teamName,
                    division: info.division,
                    points: standing?.points ?? 0,
                    gameweekPoints: info.points ?? null,
                    rank: standing?.rank ?? null,
                    disqualified: standing?.disqualified ?? false,
                    visibility: info.visibility,
                };
            })
            .filter((entry): entry is CupLeagueTableEntry => entry !== null)
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (a.rank !== b.rank) {
                    if (a.rank === null) return 1;
                    if (b.rank === null) return -1;
                    return a.rank - b.rank;
                }
                return a.userName.localeCompare(b.userName);
            });

        return { name: leagueName(index), entries };
    });
}
