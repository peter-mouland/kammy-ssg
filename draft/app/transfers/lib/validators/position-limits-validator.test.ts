import { describe, expect, it } from 'vitest';
import { validatePositionLimits } from './position-limits-validator';
import {
    PLAYER_CB1, PLAYER_FREE_CB, PLAYER_FREE_MID,
    PLAYER_MID1,
    makeContext, makeDivisionRosters, makeStandardRoster, makeTransfer,
} from './fixtures';

describe('validatePositionLimits', () => {
    it('passes for a straightforward same-position transfer', () => {
        // MID out → FREE_MID in: position counts unchanged
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        const result = validatePositionLimits(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('blocks when the simulated roster would exceed a position limit', () => {
        // Build a roster where sub_0 already holds a CB (teamPosition: 'cb') — so cb=3.
        // Replacing PLAYER_CB1 (in cb_0) with FREE_CB keeps cb at 3, which exceeds limit of 2.
        const roster = makeStandardRoster();
        roster.sub_0 = {
            ...roster.sub_0,
            player: {
                ...roster.sub_0.player,
                playerCode: PLAYER_FREE_CB.code,
                playerName: PLAYER_FREE_CB.web_name,
                playerPosition: 'cb',
                teamPosition: 'cb', // distorted: sub slot treated as a cb in the count
            },
        };
        const rosters = makeDivisionRosters(roster);
        // Now CB count in simulated roster after PLAYER_CB1 → FREE_CB: still 3 (cb_1 + sub_0 as cb + FREE_CB)
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_CB1 });
        const result = validatePositionLimits(makeContext(transfer, { divisionRosters: rosters }));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/exceed position limits/);
    });

    it('passes for a same-position CB transfer (2 allowed)', () => {
        // CB out → FREE_CB in: cb count stays at 2
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_CB1 });
        const result = validatePositionLimits(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('SWAP, LOAN_START, and LOAN_END do not change position counts and always pass', () => {
        // simulateTransferOnRoster is a no-op for these types so counts stay valid
        for (const type of ['SWAP', 'LOAN_START', 'LOAN_END'] as const) {
            const transfer = makeTransfer({ transferType: type, playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
            const result = validatePositionLimits(makeContext(transfer));
            expect(result.passed).toBe(true);
        }
    });

    it('blocks when manager is not found in division rosters', () => {
        const transfer = makeTransfer({
            transferType: 'TRANSFER',
            managerId: 'ghost-manager',
            playerIn: PLAYER_FREE_MID,
            playerOut: PLAYER_MID1,
        });
        const result = validatePositionLimits(makeContext(transfer));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/not found/);
    });
});
