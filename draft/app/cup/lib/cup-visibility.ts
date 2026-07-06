/* Location: app/cup/lib/cup-visibility.ts */

/**
 * Public visibility of a manager's cup team for a round.
 * - not_submitted: no team on record
 * - submitted_hidden: submitted, but not yet revealable (deadline not passed, or
 *   the manager's subs are not confirmed yet — either keeps the team hidden)
 * - revealed: deadline passed AND subs confirmed, so the team + points are shown
 */
export type CupTeamVisibility = 'not_submitted' | 'submitted_hidden' | 'revealed';

export function getTeamVisibility(params: {
    hasSubmission: boolean;
    deadlinePassed: boolean;
    subsConfirmed: boolean;
}): CupTeamVisibility {
    if (!params.hasSubmission) return 'not_submitted';
    if (params.deadlinePassed && params.subsConfirmed) return 'revealed';
    return 'submitted_hidden';
}

export function isRevealed(visibility: CupTeamVisibility): boolean {
    return visibility === 'revealed';
}
