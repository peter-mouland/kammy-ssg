/* Location: app/cup/server/actions/submit-cup-team.action.ts */

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import type { DivisionId } from '../../../_shared/types/league-types';
import { getTeamsForGameweek } from '../../../scoring/index.server';
import { getGameweekForStage, getRoundForGameweek } from '../../lib/cup-config';
import { isSubmissionOpen } from '../../lib/cup-deadlines';
import { getCupSquad } from '../../lib/cup-squad';
import { validateCupSubmission } from '../../lib/cup-submission';
import type { CupStageId, ProcessedCupSheetData } from '../../types/cup-types';
import { addCupSubmission, readCupConfig, readCupSubmissions } from '../cup-sheets';

export interface CupSubmissionResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Handle a cup team submission: re-validate against the round rules server-side
 * (never trust the client), then append it to the Cup sheet as PENDING.
 */
export async function handleCupSubmission(input: {
    manager: string;
    division: DivisionId;
    gameweek: number;
    players: number[];
}): Promise<CupSubmissionResult> {
    const { manager, division, gameweek, players } = input;

    if (!manager || !division || !gameweek) {
        return { success: false, error: 'Missing manager, division or gameweek.' };
    }

    const [cupConfig, submissions] = await Promise.all([readCupConfig(), readCupSubmissions()]);
    const round = getRoundForGameweek(cupConfig, gameweek);
    if (!round) {
        return { success: false, error: `Gameweek ${gameweek} is not part of the cup.` };
    }

    // The window has to be enforced HERE, not just in the UI. The submit button is
    // disabled once the deadline passes, but a direct POST ignores that -- and once the
    // deadline has passed everyone else's squads are revealed, so a late submission
    // could be picked with full knowledge of the opposition. That is the whole
    // visibility mechanic defeated. See issue #60.
    //
    // Checked before the squad lookup so a doomed request never reaches Firestore, and
    // fails CLOSED: a gameweek missing from the calendar is refused, not waved through.
    const events = await fplApiCache.getFplEvents();
    const gameweekData = events.find((event) => event.fplEvent.id === gameweek);
    if (!gameweekData || !isSubmissionOpen(gameweekData)) {
        return { success: false, error: 'The submission window for this round has closed.' };
    }

    const team = await getTeamsForGameweek(division, manager, gameweek);
    if (!team) {
        return { success: false, error: 'Could not find your squad for this gameweek.' };
    }
    const squadCodes = getCupSquad(team.roster).map((player) => player.code);

    let usedPlayers: number[] = [];
    if (round.twoLegged && round.leg === 2) {
        const otherGameweek = getGameweekForStage(cupConfig, round.stage, 1);
        if (otherGameweek !== null) {
            usedPlayers = submissions.find((s) => s.manager === manager && s.gameweek === otherGameweek)?.players ?? [];
        }
    }

    const validation = validateCupSubmission({
        players,
        playersRequired: round.playersRequired,
        squadCodes,
        usedPlayers,
    });
    if (!validation.valid) {
        return { success: false, error: validation.errors.join(' ') };
    }

    const submission: ProcessedCupSheetData = {
        status: '', // pending until an admin confirms
        timestamp: new Date(),
        manager,
        division,
        gameweek,
        stage: round.stage as CupStageId,
        leg: round.leg,
        players,
        submittedByAdmin: false,
        adminReason: '',
    };

    await addCupSubmission(submission);
    return { success: true, message: 'Cup team submitted.' };
}
