/* Location: app/cup/lib/cup-standings.ts */

import type { ManagerId } from '../../teams/types/team-types';
import { isDisqualified, QUALIFYING_PLACES } from './cup-rules';

/** A scored league-stage submission (points already computed). */
export interface ScoredSubmission {
    manager: ManagerId;
    gameweek: number;
    points: number;
    isAutopick: boolean;
}

export interface CupStanding {
    manager: ManagerId;
    points: number;
    autopickCount: number;
    disqualified: boolean;
    rank: number;
}

/**
 * League-stage standings across the configured league gameweeks: total points
 * per manager, autopick count, and DQ flag (2+ autopicks). Disqualified managers
 * sink to the bottom; the rest are ranked by points descending.
 */
export function computeLeagueStandings(scored: ScoredSubmission[], leagueGameweeks: number[]): CupStanding[] {
    const gameweeks = new Set(leagueGameweeks);
    const byManager = new Map<ManagerId, { points: number; autopickCount: number }>();

    for (const submission of scored) {
        if (!gameweeks.has(submission.gameweek)) continue;
        const entry = byManager.get(submission.manager) ?? { points: 0, autopickCount: 0 };
        entry.points += submission.points;
        if (submission.isAutopick) entry.autopickCount += 1;
        byManager.set(submission.manager, entry);
    }

    const standings = Array.from(byManager.entries()).map(([manager, entry]) => ({
        manager,
        points: entry.points,
        autopickCount: entry.autopickCount,
        disqualified: isDisqualified(entry.autopickCount),
        rank: 0,
    }));

    standings.sort((a, b) => {
        // Disqualified managers always rank below non-disqualified ones.
        if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
        return b.points - a.points;
    });

    standings.forEach((standing, index) => {
        standing.rank = index + 1;
    });

    return standings;
}

/** The managers who qualify for the Round of 16 — top non-disqualified managers. */
export function getQualifiers(standings: CupStanding[], places = QUALIFYING_PLACES): ManagerId[] {
    return standings
        .filter((standing) => !standing.disqualified)
        .slice(0, places)
        .map((standing) => standing.manager);
}
