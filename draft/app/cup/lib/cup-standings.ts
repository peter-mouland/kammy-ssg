/* Location: app/cup/lib/cup-standings.ts */

import type { ManagerId } from '../../_shared/types/league-types';
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
 * per manager, autopick count, and DQ flag. Disqualified managers sink to the
 * bottom; the rest are ranked by points descending.
 *
 * Elimination is season-wide (rule 4.14: twice in one season, league or
 * knockout), so the count comes from `seasonAutopickCounts` when given and
 * falls back to the league-stage count otherwise.
 *
 * Level points split per rules 4.15/4.8: combined first-entered players across
 * the group gameweeks, then second, then third (`rankTotals`), with manager id
 * as the final deterministic fallback.
 */
export function computeLeagueStandings(
    scored: ScoredSubmission[],
    leagueGameweeks: number[],
    seasonAutopickCounts: Map<ManagerId, number> = new Map(),
    rankTotals: Map<ManagerId, number[]> = new Map(),
): CupStanding[] {
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
        autopickCount: seasonAutopickCounts.get(manager) ?? entry.autopickCount,
        disqualified: isDisqualified(seasonAutopickCounts.get(manager) ?? entry.autopickCount),
        rank: 0,
    }));

    standings.sort((a, b) => {
        // Disqualified managers always rank below non-disqualified ones.
        if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
        if (b.points !== a.points) return b.points - a.points;
        const aRanks = rankTotals.get(a.manager) ?? [];
        const bRanks = rankTotals.get(b.manager) ?? [];
        for (let level = 0; level < 3; level++) {
            const diff = (bRanks[level] ?? 0) - (aRanks[level] ?? 0);
            if (diff !== 0) return diff;
        }
        return a.manager.localeCompare(b.manager);
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
