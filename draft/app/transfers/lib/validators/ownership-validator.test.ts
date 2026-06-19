import { describe, expect, it } from 'vitest';
import { ownershipLimit } from './ownership-validator';
import {
    MGR1, MGR2,
    PLAYER_CB1, PLAYER_FREE_CB, PLAYER_MID1, PLAYER_FREE_MID,
    MGR2_CB1,
    makeContext, makeDivisionRosters, makeRosterWithLoanOut, makeTransfer,
} from './fixtures';

describe('ownershipLimit — TRANSFER', () => {
    it('passes when playerIn is a free agent', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('blocks when playerIn is already owned by another manager', () => {
        // MGR2_CB1 is in mgr2's roster (distinct from mgr1's players)
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: MGR2_CB1, playerOut: PLAYER_MID1 });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/Owned by/);
    });

    it('blocks when playerIn is already in the requesting manager\'s own team', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_MID1, playerOut: PLAYER_MID1 });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/Already in your team/);
    });
});

describe('ownershipLimit — SWAP', () => {
    it('always passes (swaps do not change ownership)', () => {
        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_MID1, playerOut: PLAYER_CB1 });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(true);
    });
});

describe('ownershipLimit — LOAN_START', () => {
    it('passes when loaning in a player owned by another manager', () => {
        // PLAYER_CB1 is owned by MGR1; MGR2 wants to loan it in
        const transfer = makeTransfer({
            transferType: 'LOAN_START',
            managerId: MGR2,
            playerIn: PLAYER_CB1,   // owned by MGR1
            playerOut: PLAYER_FREE_CB,
        });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('blocks when trying to loan in your own player', () => {
        // MGR1 tries to loan in PLAYER_MID1, which MGR1 already owns
        const transfer = makeTransfer({
            transferType: 'LOAN_START',
            managerId: MGR1,
            playerIn: PLAYER_MID1,
            playerOut: PLAYER_FREE_MID,
        });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/Cannot loan in your own player/);
    });

    it('blocks when neither player is owned', () => {
        const transfer = makeTransfer({
            transferType: 'LOAN_START',
            playerIn: PLAYER_FREE_MID,
            playerOut: PLAYER_FREE_CB,
        });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/At least one player involved must be owned/);
    });
});

describe('ownershipLimit — LOAN_END', () => {
    it('passes when ending a loan for the player currently in the on_loan_0 slot', () => {
        // Put PLAYER_FREE_CB in on_loan_0 for MGR1
        const roster = makeRosterWithLoanOut(PLAYER_FREE_CB, MGR2);
        const rosters = makeDivisionRosters(roster);
        const transfer = makeTransfer({
            transferType: 'LOAN_END',
            playerIn: PLAYER_FREE_CB, // the player sitting in on_loan_0
            playerOut: PLAYER_FREE_CB,
        });
        const result = ownershipLimit(makeContext(transfer, { divisionRosters: rosters }));
        expect(result.passed).toBe(true);
    });

    it('blocks when ending a loan for a player not in the on_loan_0 slot', () => {
        const transfer = makeTransfer({
            transferType: 'LOAN_END',
            playerIn: PLAYER_MID1, // main squad player, not in on_loan_0
            playerOut: PLAYER_MID1,
        });
        const result = ownershipLimit(makeContext(transfer));
        expect(result.passed).toBe(false);
    });
});
