/* Location: app/cup/lib/cup-matchups.ts */

import type { ManagerId } from '../../_shared/types/league-types';
import type { CupConfig, CupMatchup, CupRound, ProcessedCupSheetData } from '../types/cup-types';
import { getGameweekForStage } from './cup-config';
import { buildGameweekPointsMap, type PlayerPointsRow, scoreSubmission } from './cup-scoring';

export interface CupMatchupSide {
    manager: ManagerId | null;
    name: string;
    /** Points for the leg being viewed (null when hidden or no submission). */
    points: number | null;
    /** Aggregate across both legs of a two-legged tie (null when hidden or single-leg). */
    aggregate: number | null;
}

export interface CupMatchupView {
    tie: number;
    home: CupMatchupSide;
    away: CupMatchupSide;
    winner: ManagerId | null;
}

/**
 * Build the head-to-head matchups for a knockout stage: pair each tie's two
 * managers with their points for the viewed leg and, for two-legged rounds,
 * their aggregate across both legs. A side's score is only shown once that
 * leg's deadline has passed AND the manager's subs are confirmed — same reveal
 * rule as the overview.
 */
export function buildStageMatchups(input: {
    bracket: CupMatchup[];
    round: CupRound;
    cupConfig: CupConfig;
    submissions: ProcessedCupSheetData[];
    pointsRows: PlayerPointsRow[];
    userNameById: Map<ManagerId, string>;
    deadlinePassedFor: (gameweek: number) => boolean;
}): CupMatchupView[] {
    const { bracket, round, cupConfig, submissions, pointsRows, userNameById, deadlinePassedFor } = input;

    const legGameweeks = round.twoLegged
        ? [getGameweekForStage(cupConfig, round.stage, 1), getGameweekForStage(cupConfig, round.stage, 2)]
        : [getGameweekForStage(cupConfig, round.stage, 1)];

    // One points map per leg gameweek, built once rather than per submission lookup.
    const pointsMaps = new Map(
        legGameweeks
            .filter((gameweek): gameweek is number => gameweek !== null)
            .map((gameweek) => [gameweek, buildGameweekPointsMap(pointsRows, gameweek)]),
    );

    const pointsFor = (manager: ManagerId | null, gameweek: number | null): number | null => {
        if (!manager || gameweek === null) return null;
        const submission = submissions.find((s) => s.manager === manager && s.gameweek === gameweek);
        if (!submission) return null;
        const revealed = deadlinePassedFor(gameweek) && submission.status === 'Y';
        if (!revealed) return null;
        return scoreSubmission(submission.players, pointsMaps.get(gameweek) ?? new Map());
    };

    const aggregateFor = (manager: ManagerId | null): number | null => {
        if (!manager || !round.twoLegged) return null;
        const legScores = legGameweeks.map((gameweek) => pointsFor(manager, gameweek));
        if (legScores.some((score) => score === null)) return null; // both legs must be revealed
        return legScores.reduce<number>((total, score) => total + (score ?? 0), 0);
    };

    const side = (manager: ManagerId | null): CupMatchupSide => ({
        manager,
        name: manager ? (userNameById.get(manager) ?? manager) : 'BYE',
        points: pointsFor(manager, round.gameweek),
        aggregate: aggregateFor(manager),
    });

    return bracket
        .filter((matchup) => matchup.stage === round.stage)
        .map((matchup) => ({
            tie: matchup.tie,
            home: side(matchup.home),
            away: side(matchup.away),
            winner: matchup.winner ?? null,
        }));
}
