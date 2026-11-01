/* Location: app/cup/server/actions/resolve-tie.action.ts */

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { readPlayerGameweekPointsFromSheet } from '../../../_shared/lib/sheets/player-gw-points';
import type { ManagerId } from '../../../_shared/types/league-types';
import { getGameweekForStage } from '../../lib/cup-config';
import { isDeadlinePassed } from '../../lib/cup-deadlines';
import { isKnockoutStage, KNOCKOUT_STAGES } from '../../lib/cup-rules';
import { buildGameweekPointsMap, scoreSubmission } from '../../lib/cup-scoring';
import { findLatestSubmission } from '../../lib/cup-submission';
import { decideTiebreak, resolveTie } from '../../lib/knockout';
import type { CupMatchup, CupStageId } from '../../types/cup-types';
import { readCupBracket, readCupConfig, readCupSubmissions, writeCupBracket } from '../cup-sheets';

export interface ResolveTieResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Resolve one knockout tie from the managers' submitted teams: score each leg
 * from league points, then apply rule 4.8 — aggregate, combined
 * first-entered players across the legs, then second, then third. A bye
 * advances the present manager. A tie still level after third-entered is
 * recorded with its aggregates but no winner: per 4.8 it needs a play-off,
 * never an arbitrary decision.
 *
 * Ties with a leg still open or a side missing are refused rather than scored
 * at zero — run autopicks first, then resolve. Resolution recomputes from the
 * latest submissions, so re-running after a correction is safe.
 */
export async function resolveTieAction(input: { stage: string; tie: number }): Promise<ResolveTieResult> {
    const { stage, tie } = input;

    if (!isKnockoutStage(stage as CupStageId) && stage !== 'playoff') {
        return {
            success: false,
            error: `Stage '${stage}' is not a knockout stage (${[...KNOCKOUT_STAGES, 'playoff'].join(', ')}).`,
        };
    }
    const stageId = stage as CupStageId;
    if (!Number.isInteger(tie) || tie < 0) {
        return { success: false, error: 'Unknown tie.' };
    }

    const [cupConfig, bracket, submissions, pointsRows, events] = await Promise.all([
        readCupConfig(),
        readCupBracket(),
        readCupSubmissions(),
        readPlayerGameweekPointsFromSheet(),
        fplApiCache.getFplEvents(),
    ]);

    const matchup = bracket.find((m) => m.stage === stageId && m.tie === tie);
    if (!matchup) {
        return { success: false, error: `No ${stageId} tie ${tie} on the bracket.` };
    }

    // A bye needs no scores: the present manager advances.
    if ((matchup.home && !matchup.away) || (matchup.away && !matchup.home)) {
        const resolved = resolveTie(matchup, { homeLeg1: 0, awayLeg1: 0, homeLeg2: 0, awayLeg2: 0 });
        await writeCupBracket(replaceTie(bracket, resolved));
        return { success: true, message: `Bye: ${resolved.winner} advances.` };
    }
    if (!matchup.home || !matchup.away) {
        return { success: false, error: 'This tie has no managers yet.' };
    }

    const home: ManagerId = matchup.home;
    const away: ManagerId = matchup.away;

    // Leg gameweeks come from the config; both legs must be complete before a
    // tie can be resolved. Play-off ties (rule 4.8) carry their own single
    // gameweek on the bracket row instead.
    let legs: number[];
    if (stageId === 'playoff') {
        if (matchup.gameweek === undefined) {
            return { success: false, error: 'Play-off tie has no gameweek.' };
        }
        legs = [matchup.gameweek];
    } else {
        const leg1 = getGameweekForStage(cupConfig, stageId, 1);
        const leg2 = stageId === 'final' ? null : getGameweekForStage(cupConfig, stageId, 2);
        if (leg1 === null || (stageId !== 'final' && leg2 === null)) {
            return { success: false, error: `Stage '${stageId}' is not fully mapped to gameweeks.` };
        }
        legs = stageId === 'final' ? [leg1] : [leg1, leg2 as number];
    }
    const eventById = new Map(events.map((event) => [event.fplEvent.id, event]));
    const legsDone = legs.every((gameweek) => {
        const event = eventById.get(gameweek);
        return event ? isDeadlinePassed(event) : false;
    });
    if (!legsDone) {
        return { success: false, error: 'The gameweek must finish before this tie can be resolved.' };
    }
    const pointsByLeg = new Map<number, Map<number, number>>();
    for (const gameweek of legs) {
        pointsByLeg.set(gameweek, buildGameweekPointsMap(pointsRows, gameweek));
    }

    // Latest submission per side per leg, in rank order (rule 4.7).
    const teams = new Map<ManagerId, number[][]>();
    for (const manager of [home, away]) {
        const picked: number[][] = [];
        for (const gameweek of legs) {
            const submission = findLatestSubmission(submissions, manager, gameweek);
            if (!submission) {
                return {
                    success: false,
                    error: `${manager} has no submission for gameweek ${gameweek}. Autopick first, then resolve.`,
                };
            }
            picked.push(submission.players);
        }
        teams.set(manager, picked);
    }

    const score = (manager: ManagerId, gameweek: number): number => {
        const submission = findLatestSubmission(submissions, manager, gameweek);
        return scoreSubmission(submission?.players ?? [], pointsByLeg.get(gameweek) ?? new Map());
    };
    const firstLeg = legs[0];
    if (firstLeg === undefined) {
        return { success: false, error: 'Play-off tie has no gameweek.' };
    }
    const secondLeg = legs[1];
    const legScores = {
        homeLeg1: score(home, firstLeg),
        awayLeg1: score(away, firstLeg),
        homeLeg2: secondLeg === undefined ? 0 : score(home, secondLeg),
        awayLeg2: secondLeg === undefined ? 0 : score(away, secondLeg),
    };

    const homeAggregate = legScores.homeLeg1 + legScores.homeLeg2;
    const awayAggregate = legScores.awayLeg1 + legScores.awayLeg2;
    if (homeAggregate !== awayAggregate) {
        const resolved = resolveTie(matchup, legScores);
        await writeCupBracket(replaceTie(bracket, resolved));
        return {
            success: true,
            message: `${stageId} tie ${tie} resolved: ${resolved.winner} advances ${homeAggregate}-${awayAggregate}.`,
        };
    }

    // Level on aggregate: per-rank combined points across the legs (rule 4.8).
    const playerPoints = (code: number, gameweek: number): number => pointsByLeg.get(gameweek)?.get(code) ?? 0;
    const ranked = (manager: ManagerId): number[] => {
        const picked = teams.get(manager) ?? [];
        const ranks: number[] = [];
        const depth = Math.max(0, ...picked.map((leg) => leg.length));
        for (let rank = 0; rank < depth; rank++) {
            ranks.push(
                legs.reduce(
                    (total, gameweek, legIndex) => total + playerPoints(picked[legIndex]?.[rank] ?? -1, gameweek),
                    0,
                ),
            );
        }
        return ranks;
    };
    const decision = decideTiebreak(ranked(home), ranked(away));
    const level = decision === 'home' ? home : decision === 'away' ? away : undefined;
    const resolved: CupMatchup = {
        ...matchup,
        homeAggregate,
        awayAggregate,
        winner: level ?? matchup.winner,
    };
    await writeCupBracket(replaceTie(bracket, resolved));

    if (!level) {
        return {
            success: true,
            message: `${stageId} tie ${tie} is level ${homeAggregate}-${awayAggregate} through third-entered — a play-off is required (rule 4.8).`,
        };
    }
    return {
        success: true,
        message: `${stageId} tie ${tie} resolved on rank order: ${level} advances ${homeAggregate}-${awayAggregate}.`,
    };
}

function replaceTie(bracket: CupMatchup[], resolved: CupMatchup): CupMatchup[] {
    return bracket.map((matchup) =>
        matchup.stage === resolved.stage && matchup.tie === resolved.tie ? resolved : matchup,
    );
}
