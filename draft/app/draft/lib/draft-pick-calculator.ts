// app/draft/lib/draft-pick-calculator.ts
// Helper functions to calculate draft state from actual picks data

import type { DivisionId } from '../../teams/types/team-types';
import type { DraftPickData } from '../types/draft-types';

/**
 * Calculate the current pick number for a division based on existing picks
 */
export function calculateCurrentPick(divisionId: DivisionId, allPicks: DraftPickData[]): number {
    const divisionPicks = allPicks.filter((pick) => pick.divisionId === divisionId);
    return divisionPicks.length + 1;
}

/**
 * Calculate the current user's turn based on draft order and picks
 */
export function calculateCurrentUserId(
    divisionId: DivisionId,
    allPicks: DraftPickData[],
    draftOrder: Array<{ position: number; userId: string }>,
    picksPerTeam: number,
): string {
    const divisionPicks = allPicks.filter((pick) => pick.divisionId === divisionId);
    const currentPick = divisionPicks.length + 1;
    const totalTeams = draftOrder.length;

    // If draft is complete, return empty string
    if (divisionPicks.length >= totalTeams * picksPerTeam) {
        return '';
    }

    // Calculate which user's turn it is using snake draft logic
    const round = Math.ceil(currentPick / totalTeams);
    const positionInRound = ((currentPick - 1) % totalTeams) + 1;

    // Snake draft: odd rounds go forward, even rounds go backward
    const teamIndex =
        round % 2 === 1
            ? positionInRound - 1 // Forward order for odd rounds (1, 2, 3...)
            : totalTeams - positionInRound; // Reverse order for even rounds (...3, 2, 1)

    const currentTeam = draftOrder.find((order) => order.position === teamIndex + 1);
    return currentTeam?.userId || '';
}
