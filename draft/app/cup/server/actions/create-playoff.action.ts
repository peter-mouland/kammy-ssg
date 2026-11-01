/* Location: app/cup/server/actions/create-playoff.action.ts */

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { resolveCupRounds } from '../../lib/cup-config';
import { isKnockoutStage } from '../../lib/cup-rules';
import { nextPlayoffTie } from '../../lib/knockout';
import type { CupMatchup, CupStageId } from '../../types/cup-types';
import { readCupBracket, readCupConfig, writeCupBracket } from '../cup-sheets';

export interface CreatePlayoffResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Create a play-off tie (rule 4.8) for a deadlocked tie: a single-leg round
 * played in the given gameweek, where the pair pick any four players. The
 * parent must be scored but winnerless — otherwise resolve it instead. The
 * gameweek must be a real FPL gameweek outside the configured cup rounds, so
 * play-off submissions can never clash with a scheduled round.
 */
export async function createPlayoffAction(input: {
    stage: string;
    tie: number;
    gameweek: number;
}): Promise<CreatePlayoffResult> {
    const { stage, tie, gameweek } = input;

    if ((!isKnockoutStage(stage as CupStageId) && stage !== 'playoff') || !Number.isInteger(tie) || tie < 0) {
        return { success: false, error: 'Unknown tie.' };
    }
    if (!Number.isInteger(gameweek) || gameweek <= 0) {
        return { success: false, error: 'Pick a gameweek for the play-off.' };
    }

    const [cupConfig, bracket, events] = await Promise.all([
        readCupConfig(),
        readCupBracket(),
        fplApiCache.getFplEvents(),
    ]);

    const parent = bracket.find((m) => m.stage === stage && m.tie === tie);
    if (!parent) {
        return { success: false, error: `No ${stage} tie ${tie} on the bracket.` };
    }
    if (parent.winner) {
        return { success: false, error: 'This tie already has a winner — no play-off needed.' };
    }
    if (parent.homeAggregate === undefined || !parent.home || !parent.away) {
        return { success: false, error: 'Resolve the tie first — only a scored draw needs a play-off.' };
    }

    if (!events.some((event) => event.fplEvent.id === gameweek)) {
        return { success: false, error: `Gameweek ${gameweek} is not a real gameweek.` };
    }
    const cupGameweeks = new Set(resolveCupRounds(cupConfig).map((round) => round.gameweek));
    if (cupGameweeks.has(gameweek)) {
        return { success: false, error: `Gameweek ${gameweek} already hosts a cup round.` };
    }

    const playoff: CupMatchup = {
        stage: 'playoff',
        tie: nextPlayoffTie(bracket),
        home: parent.home,
        away: parent.away,
        gameweek,
    };
    await writeCupBracket([...bracket, playoff]);
    return {
        success: true,
        message: `Play-off ${playoff.tie} created: ${playoff.home} v ${playoff.away} in gameweek ${gameweek}.`,
    };
}
