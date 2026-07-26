import { describe, expect, it } from 'vitest';
import { validatePositionCompatibility } from './position-compatibility-validator';
import {
    PLAYER_CB1,
    PLAYER_FREE_CB,
    PLAYER_FREE_GK,
    PLAYER_FREE_MID,
    PLAYER_MID1,
    PLAYER_MID2,
    PLAYER_SUB,
    makeContext,
    makeTransfer,
} from './fixtures';

describe('validatePositionCompatibility — TRANSFER', () => {
    it('passes when playerIn matches the position of playerOut', () => {
        // Both mid: replacing MID1 with FREE_MID
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        const result = validatePositionCompatibility(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('blocks when playerIn does not match the position of playerOut', () => {
        // GK trying to replace a MID
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_GK, playerOut: PLAYER_MID1 });
        const result = validatePositionCompatibility(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/Position mismatch/);
    });

    it('passes when outgoing player is in the sub slot (any position can fill sub)', () => {
        // PLAYER_SUB is in sub_0; a CB can replace them there
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_SUB });
        const result = validatePositionCompatibility(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('blocks when outgoing player is not found in manager roster', () => {
        const transfer = makeTransfer({
            transferType: 'TRANSFER',
            playerIn: PLAYER_FREE_MID,
            playerOut: PLAYER_FREE_CB,
        });
        const result = validatePositionCompatibility(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/not found in roster/);
    });
});

describe('validatePositionCompatibility — SWAP', () => {
    it('passes when swapping a main squad player with the substitute of the same position', () => {
        // PLAYER_SUB is sub (mid position), PLAYER_MID1 is main mid — same position
        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_MID1, playerOut: PLAYER_SUB });
        const result = validatePositionCompatibility(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('blocks when swapping two main squad players (neither is a sub)', () => {
        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_MID1, playerOut: PLAYER_MID2 });
        const result = validatePositionCompatibility(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/must be involve a player on the substitute bench/);
    });

    it('blocks when positions do not match in a swap', () => {
        // CB trying to swap with a MID sub
        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_CB1, playerOut: PLAYER_SUB });
        const result = validatePositionCompatibility(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/Position mismatch/);
    });
});

describe('validatePositionCompatibility — TRADE', () => {
    it('follows the same position rules as TRANSFER (same code path)', () => {
        const valid = makeTransfer({ transferType: 'TRADE', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        expect(validatePositionCompatibility(makeContext(valid)).passed).toBe(true);

        const invalid = makeTransfer({ transferType: 'TRADE', playerIn: PLAYER_FREE_GK, playerOut: PLAYER_MID1 });
        expect(validatePositionCompatibility(makeContext(invalid)).passed).toBe(false);
    });
});

describe('validatePositionCompatibility — LOAN_START / LOAN_END', () => {
    it('passes for loan types without position checking', () => {
        for (const type of ['LOAN_START', 'LOAN_END'] as const) {
            const transfer = makeTransfer({ transferType: type, playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
            const result = validatePositionCompatibility(makeContext(transfer));
            expect(result.passed).toBe(true);
        }
    });
});
