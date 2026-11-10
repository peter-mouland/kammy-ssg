/* Location: app/cup/server/actions/advance-round.action.ts */

import { isKnockoutStage } from '../../lib/cup-rules';
import { advanceWinners, nextKnockoutStage } from '../../lib/knockout';
import type { CupStageId } from '../../types/cup-types';
import { readCupBracket, writeCupBracket } from '../cup-sheets';

export interface AdvanceRoundResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Advance a fully resolved stage's winners into the next round's ties.
 * Explicit rather than automatic on resolve, so correcting an earlier tie
 * cannot silently cascade. Refuses while any tie of the stage is unresolved,
 * naming the ties still waiting. Re-running replaces the next stage's ties
 * while they are still blank, so a correction followed by another advance
 * stays consistent, but never wipes a next stage that already has results.
 */
export async function advanceRoundAction(input: { stage: string }): Promise<AdvanceRoundResult> {
    const { stage } = input;

    if (!isKnockoutStage(stage as CupStageId)) {
        return { success: false, error: `Stage '${stage}' is not a knockout stage.` };
    }
    const stageId = stage as CupStageId;
    const nextStage = nextKnockoutStage(stageId);
    if (!nextStage) {
        return { success: false, error: 'The final has no next round.' };
    }

    const bracket = await readCupBracket();
    const ties = bracket.filter((matchup) => matchup.stage === stageId).sort((a, b) => a.tie - b.tie);
    if (ties.length === 0) {
        return { success: false, error: `No ${stageId} ties on the bracket yet.` };
    }
    const unresolved = ties.filter((matchup) => !matchup.winner).map((matchup) => matchup.tie);
    if (unresolved.length > 0) {
        return { success: false, error: `${stageId} still needs ties resolved: ${unresolved.join(', ')}.` };
    }

    const existingNext = bracket.filter((matchup) => matchup.stage === nextStage);
    const hasResults = existingNext.some(
        (matchup) => matchup.winner || matchup.homeAggregate !== undefined || matchup.awayAggregate !== undefined,
    );
    if (hasResults) {
        return {
            success: false,
            error: `Cannot advance: ${nextStage} already has results. Correct them there instead of re-advancing ${stageId}.`,
        };
    }

    const advanced = advanceWinners(ties, nextStage);
    const kept = bracket.filter((matchup) => matchup.stage !== nextStage);
    await writeCupBracket([...kept, ...advanced]);
    const names = advanced.map((matchup) => `${matchup.home ?? 'TBC'} v ${matchup.away ?? 'TBC'}`).join('; ');
    return { success: true, message: `${advanced.length} ${nextStage} ties: ${names}.` };
}
