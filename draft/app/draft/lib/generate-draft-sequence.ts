import type { DraftOrderData } from '../../types';

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
