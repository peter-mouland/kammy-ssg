import type { DraftOrderData, DraftStateData } from '../../types';

/**
 * Calculate the next user in snake draft order
 */
export function calculateNextDraftUser(
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
 * Generate complete draft sequence showing snake pattern
 */
export function generateDraftSequence(
    draftOrder: DraftOrderData[],
    picksPerTeam: number
): Array<{
    pickNumber: number;
    round: number;
    userId: string;
    userName: string;
    position: number;
}> {
    const sequence = [];
    const totalTeams = draftOrder.length;

    for (let round = 1; round <= picksPerTeam; round++) {
        const isSnakeRound = round % 2 === 0;

        for (let posInRound = 1; posInRound <= totalTeams; posInRound++) {
            const actualPosition = isSnakeRound ? totalTeams - posInRound + 1 : posInRound;
            const user = draftOrder.find(order => order.position === actualPosition);

            if (user) {
                const pickNumber = (round - 1) * totalTeams + posInRound;
                sequence.push({
                    pickNumber,
                    round,
                    userId: user.userId,
                    userName: user.userName,
                    position: actualPosition
                });
            }
        }
    }

    return sequence;
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

/**
 * Get user's upcoming picks in the draft
 */
export function getUserUpcomingPicks(
    userId: string,
    currentPick: number,
    draftOrder: DraftOrderData[],
    picksPerTeam: number,
    maxPicks = 5
): number[] {
    const sequence = generateDraftSequence(draftOrder, picksPerTeam);

    return sequence
        .filter(pick => pick.userId === userId && pick.pickNumber >= currentPick)
        .slice(0, maxPicks)
        .map(pick => pick.pickNumber);
}

/**
 * Validate draft order for snake draft
 */
export function validateDraftOrder(draftOrder: DraftOrderData[]): string[] {
    const errors: string[] = [];

    if (draftOrder.length === 0) {
        errors.push('Draft order is empty');
        return errors;
    }

    // Check for consecutive positions starting from 1
    const positions = draftOrder.map(order => order.position).sort((a, b) => a - b);

    for (let i = 0; i < positions.length; i++) {
        if (positions[i] !== i + 1) {
            errors.push(`Missing position ${i + 1} in draft order`);
        }
    }

    // Check for unique user IDs
    const userIds = draftOrder.map(order => order.userId);
    const uniqueUserIds = new Set(userIds);

    if (userIds.length !== uniqueUserIds.size) {
        errors.push('Duplicate user IDs found in draft order');
    }

    return errors;
}
