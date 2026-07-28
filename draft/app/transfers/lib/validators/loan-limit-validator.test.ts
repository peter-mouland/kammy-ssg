import { describe, expect, it } from 'vitest';
import {
    MGR2,
    makeContext,
    makeDivisionRosters,
    makeRosterWithLoanOut,
    makeTransfer,
    PLAYER_FREE_CB,
    PLAYER_MID1,
} from './fixtures';
import { validateLoanLimit } from './loan-limit-validator';

describe('validateLoanLimit', () => {
    it('passes immediately for non-loan transfer types', () => {
        for (const type of ['TRANSFER', 'SWAP', 'TRADE', 'NEW_PLAYER', 'LOAN_END'] as const) {
            const transfer = makeTransfer({ transferType: type, playerIn: PLAYER_FREE_CB, playerOut: PLAYER_MID1 });
            const result = validateLoanLimit(makeContext(transfer));
            expect(result.passed).toBe(true);
        }
    });

    it('passes LOAN_START when on_loan_0 slot is empty', () => {
        const transfer = makeTransfer({
            transferType: 'LOAN_START',
            playerIn: PLAYER_FREE_CB,
            playerOut: PLAYER_MID1,
            onLoanTo: MGR2,
        });
        const result = validateLoanLimit(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('blocks LOAN_START when manager already has a player in on_loan_0', () => {
        const roster = makeRosterWithLoanOut(PLAYER_FREE_CB, MGR2);
        const rosters = makeDivisionRosters(roster);

        const transfer = makeTransfer({
            transferType: 'LOAN_START',
            playerIn: PLAYER_MID1,
            playerOut: PLAYER_MID1,
            onLoanTo: MGR2,
        });
        const result = validateLoanLimit(makeContext(transfer, { divisionRosters: rosters }));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/already has a player on loan/);
    });

    it('blocks when manager roster is not found', () => {
        const transfer = makeTransfer({
            transferType: 'LOAN_START',
            managerId: 'unknown-manager',
            playerIn: PLAYER_FREE_CB,
            playerOut: PLAYER_MID1,
        });
        const result = validateLoanLimit(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/not found/);
    });
});
