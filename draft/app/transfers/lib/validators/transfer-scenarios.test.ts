/**
 * Integration-level transfer validation scenarios.
 *
 * Each test exercises the full validator pipeline (getRuleValidationFunctions)
 * with a realistic combination of rosters, players, and transfer types — the kind
 * of situation that individual unit tests can miss because they only see one validator
 * at a time.
 */

import { describe, expect, it } from 'vitest';
import type { ProcessedTransfer } from '../../types/transfer-types';
import { getRuleValidationFunctions } from './index';
import {
    MGR1, MGR2,
    MGR2_MID1,
    PLAYER_CB1, PLAYER_CB2,
    PLAYER_FREE_CB, PLAYER_FREE_GK, PLAYER_FREE_MID,
    PLAYER_GK, PLAYER_MID1, PLAYER_MID2, PLAYER_WA1,
    makeContext, makeGameweek, makeMgr2Roster,
    makeRosterWithLoanOut, makeStandardRoster, makeTransfer,
} from './fixtures';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function validate(context: ReturnType<typeof makeContext>) {
    return Object.fromEntries(
        getRuleValidationFunctions(context).map((r) => [r.ruleId, r]),
    );
}

// ---------------------------------------------------------------------------
// Valid transfers — all rules should pass
// ---------------------------------------------------------------------------

describe('valid transfers', () => {
    it('free agent mid replaces owned mid: same position, under team limit, under gameweek limit', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        const results = validate(makeContext(transfer));

        expect(results.ownership.passed).toBe(true);
        expect(results['position-compatibility'].passed).toBe(true);
        expect(results['transfer-limit-per-gameweek'].passed).toBe(true);
        expect(results.teamCountLimit.passed).toBe(true);
    });

    it('SWAP: sub mid and main mid swap positions within the same roster', () => {
        const roster = makeStandardRoster();
        roster.sub_0 = { ...roster.sub_0, player: { ...roster.sub_0.player, playerCode: PLAYER_MID2.code, playerName: PLAYER_MID2.web_name, playerPosition: 'mid', isSub: true } };
        roster.mid_1 = { ...roster.mid_1, player: { ...roster.mid_1.player, playerCode: PLAYER_MID1.code, playerName: PLAYER_MID1.web_name } };

        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_MID1, playerOut: PLAYER_MID2 });
        const results = validate(makeContext(transfer, { divisionRosters: { [MGR1]: { roster }, [MGR2]: { roster: makeMgr2Roster() } } }));

        expect(results.ownership.passed).toBe(true);
        expect(results['position-compatibility'].passed).toBe(true);
    });

    it('LOAN_START: MGR2 loans in a player owned by MGR1, MGR2 loan slot is empty', () => {
        const transfer = makeTransfer({ transferType: 'LOAN_START', managerId: MGR2, playerIn: PLAYER_CB1, playerOut: PLAYER_FREE_CB, onLoanTo: MGR2 });
        const results = validate(makeContext(transfer));

        expect(results.ownership.passed).toBe(true);
        expect(results['loan-limit'].passed).toBe(true);
    });

    it('TRADE: ownership passes when playerIn is a free agent (admin-verified bilateral exchange)', () => {
        // The ownership validator treats TRADE like TRANSFER — playerIn must be unowned.
        // In practice an admin verifies bilateral consent before approval.
        const transfer = makeTransfer({ transferType: 'TRADE', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        const results = validate(makeContext(transfer));

        expect(results.ownership.passed).toBe(true);
        expect(results['position-compatibility'].passed).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Invalid transfers — specific rules should fail
// ---------------------------------------------------------------------------

describe('invalid transfers', () => {
    it('TRANSFER: playerIn owned by another manager blocks on ownership', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: MGR2_MID1, playerOut: PLAYER_MID1 });
        const results = validate(makeContext(transfer));

        expect(results.ownership.passed).toBe(false);
        expect(results['position-compatibility'].passed).toBe(true); // same position, so this still passes
    });

    it('TRANSFER: GK replacing a MID blocks on position-compatibility', () => {
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_GK, playerOut: PLAYER_MID1 });
        const results = validate(makeContext(transfer));

        expect(results['position-compatibility'].passed).toBe(false);
        expect(results.ownership.passed).toBe(true); // free agent, so ownership is fine
    });

    it('TRANSFER: third transfer in the same gameweek blocks on transfer-limit-per-gameweek', () => {
        const gw = makeGameweek(5);
        const prior1: ProcessedTransfer = makeTransfer({ id: 'prior-1', transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1, status: 'APPROVED', timestamp: new Date('2024-01-15T07:00:00Z'), gameweekData: gw });
        const prior2: ProcessedTransfer = makeTransfer({ id: 'prior-2', transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB,  playerOut: PLAYER_CB1,  status: 'APPROVED', timestamp: new Date('2024-01-15T08:00:00Z'), gameweekData: gw });
        const transfer = makeTransfer({ id: 'transfer-3', transferType: 'TRANSFER', playerIn: PLAYER_FREE_GK, playerOut: PLAYER_GK, gameweekData: gw });
        const results = validate(makeContext(transfer, { allGameweekTransfers: [prior1, prior2] }));

        expect(results['transfer-limit-per-gameweek'].passed).toBe(false);
        expect(results['position-compatibility'].passed).toBe(true); // GK→GK, so position is fine
    });

    it('LOAN_START: blocks on loan-limit when on_loan_0 is already occupied', () => {
        // MGR1's slot is occupied; MGR1 tries to loan in MGR2_MID1 (owned by MGR2).
        // playerIn is owned by another manager so ownership passes — only loan-limit fires.
        const roster = makeRosterWithLoanOut(PLAYER_WA1, MGR2);
        const transfer = makeTransfer({ transferType: 'LOAN_START', managerId: MGR1, playerIn: MGR2_MID1, playerOut: PLAYER_FREE_CB, onLoanTo: MGR1 });
        const results = validate(makeContext(transfer, { divisionRosters: { [MGR1]: { roster }, [MGR2]: { roster: makeMgr2Roster() } } }));

        expect(results['loan-limit'].passed).toBe(false);
        expect(results.ownership.passed).toBe(true);
    });

    it('SWAP: two main-squad players (neither is sub) blocks on position-compatibility', () => {
        // Both PLAYER_MID1 and PLAYER_MID2 are in main squad slots in the standard roster.
        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_MID1, playerOut: PLAYER_MID2 });
        const results = validate(makeContext(transfer));

        expect(results['position-compatibility'].passed).toBe(false);
        expect(results.ownership.passed).toBe(true); // SWAP always passes ownership
    });

    it('LOAN_END: blocks on ownership when playerIn is not in the on_loan_0 slot', () => {
        const transfer = makeTransfer({ transferType: 'LOAN_END', playerIn: PLAYER_MID1, playerOut: PLAYER_MID1 });
        const results = validate(makeContext(transfer));

        expect(results.ownership.passed).toBe(false);
    });

    it('TRANSFER: blocks on teamCountLimit when playerIn would be a third player from the same real-world team', () => {
        const roster = makeStandardRoster();
        const sameTeam1 = { ...PLAYER_FREE_MID, id: 98, code: 298, web_name: 'SameTeam1' };
        const sameTeam2 = { ...PLAYER_FREE_MID, id: 99, code: 299, web_name: 'SameTeam2' };
        roster.mid_0 = { ...roster.mid_0, player: { ...roster.mid_0.player, playerCode: sameTeam1.code } };
        roster.mid_1 = { ...roster.mid_1, player: { ...roster.mid_1.player, playerCode: sameTeam2.code } };
        const baseCtx = makeContext(makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_CB1 }));
        const fplPlayersByCode = { ...baseCtx.fplPlayersByCode, [sameTeam1.code]: sameTeam1, [sameTeam2.code]: sameTeam2 };

        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_CB1 });
        const results = validate(makeContext(transfer, { divisionRosters: { [MGR1]: { roster }, [MGR2]: { roster: makeMgr2Roster() } }, fplPlayersByCode }));

        expect(results.teamCountLimit.passed).toBe(false);
        expect(results.ownership.passed).toBe(true); // player is a free agent
    });
});

// ---------------------------------------------------------------------------
// Cross-validator edge cases
// ---------------------------------------------------------------------------

describe('cross-validator edge cases', () => {
    it('gameweek 1 bypasses the transfer limit regardless of how many prior transfers exist', () => {
        const gw1 = makeGameweek(1);
        const prior1: ProcessedTransfer = makeTransfer({ id: 'prior-1', transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1, status: 'APPROVED', timestamp: new Date('2024-01-15T07:00:00Z'), gameweekData: gw1 });
        const prior2: ProcessedTransfer = makeTransfer({ id: 'prior-2', transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB,  playerOut: PLAYER_CB1,  status: 'APPROVED', timestamp: new Date('2024-01-15T08:00:00Z'), gameweekData: gw1 });
        const transfer = makeTransfer({ id: 'transfer-3', transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_CB2, gameweekData: gw1 });
        const results = validate(makeContext(transfer, { allGameweekTransfers: [prior1, prior2] }));

        expect(results['transfer-limit-per-gameweek'].passed).toBe(true);
    });

    it('REJECTED transfers do not count toward the gameweek limit', () => {
        const gw = makeGameweek(5);
        const rejected1: ProcessedTransfer = makeTransfer({ id: 'rej-1', transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1, status: 'REJECTED', timestamp: new Date('2024-01-15T07:00:00Z'), gameweekData: gw });
        const rejected2: ProcessedTransfer = makeTransfer({ id: 'rej-2', transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB,  playerOut: PLAYER_CB1,  status: 'REJECTED', timestamp: new Date('2024-01-15T08:00:00Z'), gameweekData: gw });
        const transfer = makeTransfer({ id: 'transfer-1', transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_CB2, gameweekData: gw });
        const results = validate(makeContext(transfer, { allGameweekTransfers: [rejected1, rejected2] }));

        expect(results['transfer-limit-per-gameweek'].passed).toBe(true);
    });

    it('PENDING transfers DO count toward the gameweek limit — managers cannot queue past the limit', () => {
        const gw = makeGameweek(5);
        const pending1: ProcessedTransfer = makeTransfer({ id: 'pend-1', transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1, status: 'PENDING', timestamp: new Date('2024-01-15T07:00:00Z'), gameweekData: gw });
        const pending2: ProcessedTransfer = makeTransfer({ id: 'pend-2', transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB,  playerOut: PLAYER_CB1,  status: 'PENDING', timestamp: new Date('2024-01-15T08:00:00Z'), gameweekData: gw });
        const transfer = makeTransfer({ id: 'transfer-3', transferType: 'TRANSFER', playerIn: PLAYER_FREE_GK, playerOut: PLAYER_GK, gameweekData: gw });
        const results = validate(makeContext(transfer, { allGameweekTransfers: [pending1, pending2] }));

        expect(results['transfer-limit-per-gameweek'].passed).toBe(false);
    });

    it('TRANSFER where playerOut is not in the manager roster fails position-compatibility', () => {
        // A manager submits a transfer with a playerOut they do not own.
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: MGR2_MID1 });
        const results = validate(makeContext(transfer));

        expect(results['position-compatibility'].passed).toBe(false);
        expect(results.ownership.passed).toBe(true); // playerIn is a free agent
    });

    it('player-availability is informational only: it does not independently block owned players', () => {
        // ownership is the sole blocking validator for player ownership.
        // player-availability reports who owns a player but defers the block to ownership.
        // If this design changes, update player-availability-validator alongside this test.
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: MGR2_MID1, playerOut: PLAYER_MID1 });
        const results = validate(makeContext(transfer));

        expect(results.ownership.passed).toBe(false);
        expect(results['player-availability'].passed).toBe(true);
    });
});
