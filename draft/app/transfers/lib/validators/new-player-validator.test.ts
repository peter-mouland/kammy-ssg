import { describe, expect, it } from 'vitest';
import type { EnhancedPlayerData } from '../../../_shared/types/player-types';
import { makeContext, makePlayer, makeTransfer, PLAYER_FREE_MID, PLAYER_MID1 } from './fixtures';
import { newPlayerType } from './new-player-validator';

/**
 * Rules 3.7–3.9: a player new to the game goes to a draw, entered with the New Player
 * Request type. Any other player is picked up with a normal transfer.
 */

const asNew = (player: EnhancedPlayerData): EnhancedPlayerData => ({
    ...player,
    draft: { ...player.draft, isNew: true },
});

const NEW_MID = asNew(makePlayer({ id: 40, code: 400, web_name: 'NewSigning', position: 'mid', team_code: 30 }));

describe('newPlayerType', () => {
    it('passes a New Player Request for a new player', () => {
        const transfer = makeTransfer({ transferType: 'NEW_PLAYER', playerIn: NEW_MID, playerOut: PLAYER_MID1 });

        expect(newPlayerType(makeContext(transfer)).passed).toBe(true);
    });

    it('passes a normal transfer for a player who is not new', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });

        expect(newPlayerType(makeContext(transfer)).passed).toBe(true);
    });

    it('flags a normal transfer for a new player: he goes to a draw', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: NEW_MID, playerOut: PLAYER_MID1 });
        const result = newPlayerType(makeContext(transfer));

        expect(result.passed).toBe(false);
        expect(result.message).toBe('New players go to a draw — choose New Player Request');
    });

    it('flags a trade for a new player the same way', () => {
        const transfer = makeTransfer({ transferType: 'TRADE', playerIn: NEW_MID, playerOut: PLAYER_MID1 });

        expect(newPlayerType(makeContext(transfer)).passed).toBe(false);
    });

    it('flags a New Player Request for a player who is not new', () => {
        const transfer = makeTransfer({
            transferType: 'NEW_PLAYER',
            playerIn: PLAYER_FREE_MID,
            playerOut: PLAYER_MID1,
        });
        const result = newPlayerType(makeContext(transfer));

        expect(result.passed).toBe(false);
        expect(result.message).toBe('Not a new player — use Transfer');
    });

    it('has nothing to say about swaps and loans', () => {
        for (const transferType of ['SWAP', 'LOAN_START', 'LOAN_END'] as const) {
            const transfer = makeTransfer({ transferType, playerIn: NEW_MID, playerOut: PLAYER_MID1 });
            expect(newPlayerType(makeContext(transfer)).passed).toBe(true);
        }
    });
});
