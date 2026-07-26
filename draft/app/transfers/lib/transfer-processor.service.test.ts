import { describe, expect, it } from 'vitest';
import { extractLoanStatus } from '../../_shared/lib/roster-conversion-utils';
import { applyIndividualTransfer } from './transfer-processor.service';
import {
    MGR1,
    MGR2,
    makeContext,
    makeDivisionRosters,
    makeStandardRoster,
    makeTransfer,
    PLAYER_FREE_MID,
    PLAYER_MID1,
} from './validators/fixtures';
import { teamCountLimit } from './validators/team-count-validator';

describe('loan lifecycle', () => {
    it('loan status is empty before, shows the loaned player mid-cycle, then clears when the loan ends', async () => {
        const roster = makeStandardRoster();
        // makeStandardRoster includes a sentinel on_loan_0 (code=0) for validator tests.
        // Remove it here so applyLoanStart does not mistake it for an active loan.
        delete roster.on_loan_0;
        const rosters = makeDivisionRosters(roster);

        expect(extractLoanStatus(rosters[MGR1].roster, MGR1)).toEqual({ loanedOut: [], loanedIn: [] });

        // LOAN_START: MGR1 lends PLAYER_MID1 to MGR2; PLAYER_FREE_MID fills the vacated mid_0 slot
        await applyIndividualTransfer(
            rosters,
            makeTransfer({
                transferType: 'LOAN_START',
                playerIn: PLAYER_FREE_MID,
                playerOut: PLAYER_MID1,
                onLoanTo: MGR2,
            }),
        );

        const duringLoan = extractLoanStatus(rosters[MGR1].roster, MGR1);
        expect(duringLoan.loanedOut).toHaveLength(1);
        expect(duringLoan.loanedOut[0].playerCode).toBe(PLAYER_MID1.code);
        expect(duringLoan.loanedOut[0].onLoanTo).toBe(MGR2);

        // LOAN_END: fill-in leaves, PLAYER_MID1 returns
        await applyIndividualTransfer(
            rosters,
            makeTransfer({
                transferType: 'LOAN_END',
                playerIn: PLAYER_MID1,
                playerOut: PLAYER_FREE_MID,
                onLoanTo: MGR2,
            }),
        );

        expect(extractLoanStatus(rosters[MGR1].roster, MGR1)).toEqual({ loanedOut: [], loanedIn: [] });

        // After the loan cycle, MGR1 should be able to make a normal transfer without the roster
        // iterators crashing — teamCountLimit walks Object.values(roster) without optional chaining,
        // so it would throw if the loan slot were left as undefined rather than deleted
        const nextTransfer = makeTransfer({
            transferType: 'TRANSFER',
            playerIn: PLAYER_FREE_MID,
            playerOut: PLAYER_MID1,
        });
        expect(() => teamCountLimit(makeContext(nextTransfer, { divisionRosters: rosters }))).not.toThrow();
    });
});
