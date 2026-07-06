/* Location: app/cup/lib/cup-submission.ts */

import { findReusedPlayers } from './cup-rules';

export interface CupSubmissionValidation {
    valid: boolean;
    errors: string[];
}

/**
 * Validate a manager's cup team selection against the round's rules:
 * - exactly the required number of players
 * - no duplicate picks
 * - every pick is in the manager's squad
 * - no player reused from the other leg of the same round
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
        errors.push(`These players were already used in the other leg of this round: ${reused.join(', ')}.`);
    }

    return { valid: errors.length === 0, errors };
}
