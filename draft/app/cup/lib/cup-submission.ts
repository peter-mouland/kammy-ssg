/* Location: app/cup/lib/cup-submission.ts */

import type { ManagerId } from '../../_shared/types/league-types';
import type { CupConfig, ProcessedCupSheetData } from '../types/cup-types';
import { findReusedPlayers } from './cup-rules';

export interface CupSubmissionValidation {
    valid: boolean;
    errors: string[];
}

/**
 * The latest submission for a manager+gameweek. Resubmits append a new row
 * rather than overwriting, so the last match wins and earlier rows stay on
 * record as history.
 */
export function findLatestSubmission(
    submissions: ProcessedCupSheetData[],
    manager: ManagerId,
    gameweek: number,
): ProcessedCupSheetData | undefined {
    for (let i = submissions.length - 1; i >= 0; i--) {
        const submission = submissions[i];
        if (submission?.manager === manager && submission.gameweek === gameweek) return submission;
    }
    return undefined;
}

/**
 * Players a manager cannot reuse in a league-stage gameweek: the latest picks
 * from every other league gameweek (rule 4.10, once across the group games).
 * Both directions — submitting gameweeks out of order cannot dodge the ban.
 */
export function findGroupUsedPlayers(
    submissions: ProcessedCupSheetData[],
    manager: ManagerId,
    cupConfig: CupConfig,
    gameweek: number,
): number[] {
    const used = new Set<number>();
    for (const other of cupConfig.league) {
        if (other === gameweek) continue;
        for (const code of findLatestSubmission(submissions, manager, other)?.players ?? []) {
            used.add(code);
        }
    }
    return [...used];
}

/**
 * Validate a manager's cup team selection against the round's rules:
 * - exactly the required number of players
 * - no duplicate picks
 * - every pick is in the manager's squad
 * - no player reused from elsewhere in the same stage (other leg, other group game)
 */
export function validateCupSubmission(params: {
    players: number[];
    playersRequired: number;
    squadCodes: number[];
    usedPlayers?: number[];
}): CupSubmissionValidation {
    const { players, playersRequired, squadCodes, usedPlayers = [] } = params;
    const errors: string[] = [];

    if (players.length !== playersRequired) {
        errors.push(`Select exactly ${playersRequired} players (you selected ${players.length}).`);
    }

    if (new Set(players).size !== players.length) {
        errors.push('You cannot pick the same player more than once.');
    }

    const squad = new Set(squadCodes);
    const notInSquad = players.filter((code) => !squad.has(code));
    if (notInSquad.length > 0) {
        errors.push(`These players are not in your squad: ${notInSquad.join(', ')}.`);
    }

    const reused = findReusedPlayers(players, usedPlayers);
    if (reused.length > 0) {
        errors.push(`These players were already used in this stage: ${reused.join(', ')}.`);
    }

    return { valid: errors.length === 0, errors };
}
