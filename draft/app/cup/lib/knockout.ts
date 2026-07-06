/* Location: app/cup/lib/knockout.ts */

import type { ManagerId } from '../../teams/types/team-types';
import type { CupMatchup, CupStageId } from '../types/cup-types';

/**
 * Fisher–Yates shuffle with an injectable random source, so the R16 draw is
 * random in production but deterministic (and testable) when given a seeded PRNG.
 */
export function fisherYatesShuffle<T>(items: T[], random: () => number): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const a = result[i];
        const b = result[j];
        if (a !== undefined && b !== undefined) {
            result[i] = b;
            result[j] = a;
        }
    }
    return result;
}

/**
 * Pair a drawn/ordered list of managers into ties: (0 vs 1), (2 vs 3), … A null
 * entry (odd count or unfilled slot) yields a bye — home set, away null.
 */
export function pairIntoMatchups(order: (ManagerId | null)[], stage: CupStageId): CupMatchup[] {
    const matchups: CupMatchup[] = [];
    for (let i = 0; i < order.length; i += 2) {
        matchups.push({
            stage,
            tie: i / 2,
            home: order[i] ?? null,
            away: order[i + 1] ?? null,
            winner: undefined,
        });
    }
    return matchups;
}

/**
 * Resolve a two-legged tie from its four leg scores, setting aggregates and the
 * winner. Aggregate = home(leg1)+home(leg2) vs away(leg1)+away(leg2). A bye
 * (missing opponent) advances the present manager. Returns undefined winner on
 * a draw (caller decides the tiebreak).
 */
export function resolveTie(
    matchup: CupMatchup,
    legScores: { homeLeg1: number; awayLeg1: number; homeLeg2: number; awayLeg2: number },
): CupMatchup {
    if (matchup.home && !matchup.away) return { ...matchup, winner: matchup.home };
    if (matchup.away && !matchup.home) return { ...matchup, winner: matchup.away };

    const homeAggregate = legScores.homeLeg1 + legScores.homeLeg2;
    const awayAggregate = legScores.awayLeg1 + legScores.awayLeg2;
    let winner: ManagerId | null | undefined;
    if (homeAggregate > awayAggregate) winner = matchup.home;
    else if (awayAggregate > homeAggregate) winner = matchup.away;
    else winner = undefined; // draw — needs a tiebreak

    return { ...matchup, homeAggregate, awayAggregate, winner };
}

/**
 * Build the next round from resolved matchups: winners of consecutive ties meet.
 * Winners must be in bracket order.
 */
export function advanceWinners(resolved: CupMatchup[], nextStage: CupStageId): CupMatchup[] {
    const winners = resolved.map((matchup) => matchup.winner ?? null);
    return pairIntoMatchups(winners, nextStage);
}
