/* Location: app/cup/server/actions/submit-cup-team.action.ts */

import type { DivisionId } from '../../../_shared/types/league-types';
import { getTeamsForGameweek } from '../../../scoring/server/services/division-teams.service';
import { getGameweekForStage, getRoundForGameweek } from '../../lib/cup-config';
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
