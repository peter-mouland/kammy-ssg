import { describe, expect, it } from 'vitest';
import type { EnhancedPlayerData } from '../../../_shared/types/player-types';
import {
    MGR1,
    MGR2,
    MGR2_CB1,
    makeContext,
    makeDivisionRosters,
    makePlayer,
    makeRosterWithLoanOut,
    makeTransfer,
    PLAYER_CB1,
    PLAYER_FREE_CB,
    PLAYER_FREE_MID,
    PLAYER_MID1,
    PLAYER_MID2,
} from './fixtures';
import { ownershipLimit } from './ownership-validator';

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

    it("blocks when playerIn is already in the requesting manager's own team", () => {
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
            playerIn: PLAYER_CB1, // owned by MGR1
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

describe('ownershipLimit — a new player in a draw (rules 3.7–3.9)', () => {
    const NEW_MID = {
        ...makePlayer({ id: 40, code: 400, web_name: 'NewSigning', position: 'mid', team_code: 30 }),
        draft: { position: 'mid', pointsTotal: 0, pointsBreakdown: {}, isHidden: false, isNew: true },
    } as EnhancedPlayerData;

    /** Pending requests are applied to rosters, so a requester already "holds" the player. */
    const rostersWithRequestBy = (managerId: string) => {
        const rosters = makeDivisionRosters();
        const roster = rosters[managerId].roster;
        roster.mid_0 = { ...roster.mid_0, player: { ...roster.mid_0.player, playerCode: NEW_MID.code } };
        return rosters;
    };
    const requestBy = (managerId: string, status: 'PENDING' | 'APPROVED') =>
        makeTransfer({
            id: `request-${managerId}`,
            managerId,
            status,
            transferType: 'NEW_PLAYER',
            playerIn: NEW_MID,
            playerOut: PLAYER_MID1,
            timestamp: new Date('2024-01-14T10:00:00Z'),
        });

    it("does not treat another manager's pending request as owning him: it is an entry in the same draw", () => {
        const transfer = makeTransfer({ transferType: 'NEW_PLAYER', playerIn: NEW_MID, playerOut: PLAYER_MID1 });
        const result = ownershipLimit(
            makeContext(transfer, {
                divisionRosters: rostersWithRequestBy(MGR2),
                allGameweekTransfers: [requestBy(MGR2, 'PENDING')],
            }),
        );

        expect(result.passed).toBe(true);
    });

    it('treats him as owned once a request is approved: the draw has been made', () => {
        const transfer = makeTransfer({ transferType: 'NEW_PLAYER', playerIn: NEW_MID, playerOut: PLAYER_MID1 });
        const result = ownershipLimit(
            makeContext(transfer, {
                divisionRosters: rostersWithRequestBy(MGR2),
                allGameweekTransfers: [requestBy(MGR2, 'APPROVED')],
            }),
        );

        expect(result.passed).toBe(false);
        expect(result.message).toBe(`Owned by ${MGR2}`);
    });

    it('says so when the manager has already entered the draw for him', () => {
        const transfer = makeTransfer({ transferType: 'NEW_PLAYER', playerIn: NEW_MID, playerOut: PLAYER_MID2 });
        const result = ownershipLimit(
            makeContext(transfer, {
                divisionRosters: rostersWithRequestBy(MGR1),
                allGameweekTransfers: [requestBy(MGR1, 'PENDING')],
            }),
        );

        expect(result.passed).toBe(false);
        expect(result.message).toBe("You've already entered the draw for this player");
    });
});
