import type { DraftOrderData, DraftStateData } from '../../types';

/**
 * Calculate the next user in snake draft order
 */
function calculateNextDraftUser(
    currentPick: number,
    draftOrder: DraftOrderData[],
    picksPerTeam: number
): { userId: string; userName: string; round: number; pickInRound: number } | null {
    const totalTeams = draftOrder.length;
    const totalPicks = totalTeams * picksPerTeam;

    // Check if draft is complete
    if (currentPick > totalPicks) {
        return null;
    }

    // Calculate current round (1-based)
    const round = Math.ceil(currentPick / totalTeams);

    // Calculate position within the round (1-based)
    const pickInRound = ((currentPick - 1) % totalTeams) + 1;

    // Snake logic: even rounds are reversed
    const isSnakeRound = round % 2 === 0;
    const actualPosition = isSnakeRound ? totalTeams - pickInRound + 1 : pickInRound;

    // Find user at this position
    const user = draftOrder.find(order => order.position === actualPosition);

    if (!user) {
        throw new Error(`No user found at position ${actualPosition} in draft order`);
    }

    return {
        userId: user.userId,
        userName: user.userName,
        round,
        pickInRound: actualPosition
    };
}


/**
 * Update draft state to next picker
 */
export function getNextDraftState(
    currentDraftState: DraftStateData,
    draftOrder: DraftOrderData[]
): DraftStateData {
    const nextPick = currentDraftState.currentPick + 1;
    const nextUser = calculateNextDraftUser(nextPick, draftOrder, currentDraftState.picksPerTeam);

    if (!nextUser) {
        // Draft is complete
        return {
            ...currentDraftState,
            isActive: false,
            completedAt: new Date(),
            currentPick: nextPick
        };
    }

    return {
        ...currentDraftState,
        currentPick: nextPick,
        currentUserId: nextUser.userId
    };
}

