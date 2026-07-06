/* Location: app/cup/lib/cup-rules.ts */

import type { CupStageId, CupStageShape } from '../types/cup-types';

/**
 * Fixed stage shapes. League + final are single-leg; the middle rounds are
 * two-legged. Player counts follow the cup rules: 4 per team everywhere except
 * the 6-player Grand Final.
 */
export const CUP_STAGES: Record<CupStageId, CupStageShape> = {
    league: { id: 'league', label: 'League Stage', playersRequired: 4, twoLegged: false },
    r16: { id: 'r16', label: 'Round of 16', playersRequired: 4, twoLegged: true },
    qf: { id: 'qf', label: 'Quarter Final', playersRequired: 4, twoLegged: true },
    sf: { id: 'sf', label: 'Semi Final', playersRequired: 4, twoLegged: true },
    final: { id: 'final', label: 'Grand Final', playersRequired: 6, twoLegged: false },
};

/** Knockout stages, in bracket order. */
export const KNOCKOUT_STAGES: CupStageId[] = ['r16', 'qf', 'sf', 'final'];

/** Managers that qualify from the league stage into the Round of 16. */
export const QUALIFYING_PLACES = 16;

/** Reaching this many autopicks in a single stage disqualifies a manager. */
export const MAX_AUTOPICKS_BEFORE_DQ = 2;

export function getStageShape(stage: CupStageId): CupStageShape {
    return CUP_STAGES[stage];
}

export function isKnockoutStage(stage: CupStageId): boolean {
    return KNOCKOUT_STAGES.includes(stage);
}

/**
 * Player-reuse ban: a player used in one leg of a round cannot be reused in
 * the other leg of the same round. Returns the overlapping player codes.
 */
export function findReusedPlayers(currentPlayers: number[], usedPlayers: number[]): number[] {
    const used = new Set(usedPlayers);
    return currentPlayers.filter((code) => used.has(code));
}

export function hasReusedPlayer(currentPlayers: number[], usedPlayers: number[]): boolean {
    return findReusedPlayers(currentPlayers, usedPlayers).length > 0;
}

/** A manager is disqualified once they hit the autopick limit within a stage. */
export function isDisqualified(autopickCount: number): boolean {
    return autopickCount >= MAX_AUTOPICKS_BEFORE_DQ;
}
