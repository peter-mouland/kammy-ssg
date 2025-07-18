// /draft/lib/calculate-next-picker.ts
import type { DraftOrderData, DraftStateData } from '../types/draft-types';

/**
 * Calculate who picks next in the draft sequence
 */
export function calculateNextPicker(
    currentDraftState: DraftStateData | null,
    draftOrder: DraftOrderData[],
): { userId: string; userName: string; pickNumber: number } | null {
    if (!currentDraftState || !currentDraftState.isActive || draftOrder.length === 0) {
        return null;
    }

    const nextPickNumber = currentDraftState.currentPick + 1;
    const totalTeams = draftOrder.length;
    const totalPossiblePicks = totalTeams * (currentDraftState.picksPerTeam || 12);

    // Check if draft would be complete after current pick
    if (nextPickNumber > totalPossiblePicks) {
        return null;
    }

    // Calculate which round the next pick is in (1-based)
    const nextRound = Math.ceil(nextPickNumber / totalTeams);

    // Calculate position within that round (1-based)
    const positionInRound = ((nextPickNumber - 1) % totalTeams) + 1;

    // Snake draft logic: even rounds are reversed
    const isSnakeRound = nextRound % 2 === 0;
    const actualPosition = isSnakeRound ? totalTeams - positionInRound + 1 : positionInRound;

    // Find the user at this position
    const nextUser = draftOrder.find((order) => order.position === actualPosition);

    if (!nextUser) {
        console.warn(`No user found at position ${actualPosition} for pick ${nextPickNumber}`);
        return null;
    }

    return {
        userId: nextUser.userId,
        userName: nextUser.userName,
        pickNumber: nextPickNumber,
    };
}
