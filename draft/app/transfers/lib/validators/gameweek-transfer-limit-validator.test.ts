import { describe, expect, it } from 'vitest';
import { validateGameweekTransferLimit } from './gameweek-transfer-limit-validator';
import {
    PLAYER_FREE_MID, PLAYER_FREE_CB, PLAYER_MID1, PLAYER_MID2,
    makeContext, makeGameweek, makeTransfer,
} from './fixtures';
import type { ProcessedTransfer } from '../../types/transfer-types';

// Helper: build an already-processed transfer in the same gameweek
function makeApprovedTransfer(overrides: Partial<ProcessedTransfer> = {}): ProcessedTransfer {
    return makeTransfer({
        transferType: 'TRANSFER',
        playerIn: PLAYER_FREE_MID,
        playerOut: PLAYER_MID1,
        status: 'APPROVED',
        timestamp: new Date('2024-01-15T09:00:00Z'), // before the default 10:00
        ...overrides,
    });
}

describe('validateGameweekTransferLimit', () => {
    it('always passes in gameweek 1 regardless of existing transfers', () => {
        const gw1 = makeGameweek(1);
        const prior = makeApprovedTransfer({ gameweekData: gw1, timestamp: new Date('2024-01-15T08:00:00Z') });
        const prior2 = makeApprovedTransfer({ id: 'transfer-2', gameweekData: gw1, timestamp: new Date('2024-01-15T09:00:00Z') });
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_MID2, gameweekData: gw1 });

        const result = validateGameweekTransferLimit(makeContext(transfer, { allGameweekTransfers: [prior, prior2] }));
        expect(result.passed).toBe(true);
    });

    it('passes when first TRANSFER of the gameweek', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        const result = validateGameweekTransferLimit(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('passes on the second TRANSFER (limit is 2)', () => {
        const prior = makeApprovedTransfer();
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_MID2 });
        const result = validateGameweekTransferLimit(makeContext(transfer, { allGameweekTransfers: [prior] }));
        expect(result.passed).toBe(true);
    });

    it('blocks the third TRANSFER in a gameweek (limit is 2)', () => {
        const prior1 = makeApprovedTransfer({ id: 'prior-1', timestamp: new Date('2024-01-15T07:00:00Z') });
        const prior2 = makeApprovedTransfer({ id: 'prior-2', timestamp: new Date('2024-01-15T08:00:00Z') });
        const transfer = makeTransfer({ id: 'transfer-3', transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_MID2 });

        const result = validateGameweekTransferLimit(makeContext(transfer, { allGameweekTransfers: [prior1, prior2] }));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/exceed transfer limit/);
    });

    it('SWAP limit is tracked separately from TRANSFER limit', () => {
        // Two SWAPs already done — a TRANSFER should still be allowed
        const swap1 = makeApprovedTransfer({ id: 'swap-1', transferType: 'SWAP' });
        const swap2 = makeApprovedTransfer({ id: 'swap-2', transferType: 'SWAP' });
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });

        const result = validateGameweekTransferLimit(makeContext(transfer, { allGameweekTransfers: [swap1, swap2] }));
        expect(result.passed).toBe(true);
    });

    it('blocks the third SWAP in a gameweek (limit is 2)', () => {
        const swap1 = makeApprovedTransfer({ id: 'swap-1', transferType: 'SWAP' });
        const swap2 = makeApprovedTransfer({ id: 'swap-2', transferType: 'SWAP' });
        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_MID1, playerOut: PLAYER_MID2 });

        const result = validateGameweekTransferLimit(makeContext(transfer, { allGameweekTransfers: [swap1, swap2] }));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/exceed swap limit/);
    });

    it('does not count transfers from other managers', () => {
        const otherManagerTransfer = makeApprovedTransfer({
            managerId: 'other-manager',
            timestamp: new Date('2024-01-15T08:00:00Z'),
        });
        const otherManagerTransfer2 = makeApprovedTransfer({
            id: 'transfer-2',
            managerId: 'other-manager',
            timestamp: new Date('2024-01-15T09:00:00Z'),
        });
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });

        const result = validateGameweekTransferLimit(
            makeContext(transfer, { allGameweekTransfers: [otherManagerTransfer, otherManagerTransfer2] }),
        );
        expect(result.passed).toBe(true);
    });

    it('does not count REJECTED transfers against the limit', () => {
        const rejected = makeApprovedTransfer({ status: 'REJECTED' });
        const rejected2 = makeApprovedTransfer({ id: 'transfer-2', status: 'REJECTED' });
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });

        const result = validateGameweekTransferLimit(
            makeContext(transfer, { allGameweekTransfers: [rejected, rejected2] }),
        );
        // REJECTED transfers are not counted, so this first transfer should pass
        expect(result.passed).toBe(true);
    });

    it('LOAN_START and LOAN_END have no gameweek limit', () => {
        const many = Array.from({ length: 5 }, (_, i) =>
            makeApprovedTransfer({ id: `loan-${i}`, transferType: 'LOAN_START', timestamp: new Date(`2024-01-15T${String(i).padStart(2, '0')}:00:00Z`) }),
        );
        const transfer = makeTransfer({ transferType: 'LOAN_START', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });

        const result = validateGameweekTransferLimit(makeContext(transfer, { allGameweekTransfers: many }));
        expect(result.passed).toBe(true);
    });
});
