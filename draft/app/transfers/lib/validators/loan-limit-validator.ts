// app/transfers/lib/validators/loan-limit-validator.ts

import type { PositionSlotKey } from '../../../teams/types/team-types';
import type { OwnedPlayersByCode } from '../../types/transfer-form-types';
import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

/**
 * Validate loan limits - managers can only have one player on loan at a time
 */
export function validateLoanLimit(context: TransferRuleContext): RuleValidationResult {
    const { transfer, divisionRosters } = context;
    //  MUST use latest "context.divisionRosters" so we're working on up-to-date rosters i.e. after applying transfers on the fly
    //  this means this function can not be hoisted higher than 'applyIndividualTransfer'
    const ownedPlayersByCode = Object.entries(context.divisionRosters).reduce(
        (acc: OwnedPlayersByCode, [managerId, team]) => {
            (Object.keys(team.roster) as PositionSlotKey[]).forEach((slotKey) => {
                const slot = team.roster[slotKey];
                acc[slot.player.playerCode] = { managerId, slotKey, slot };
            });

            return acc;
        },
        {},
    );
    const playerInOwned = ownedPlayersByCode[transfer.playerIn.code];
    const playerOutOwned = ownedPlayersByCode[transfer.playerOut.code];

    // Only apply to loan start transfers
    if (transfer.transferType !== 'LOAN_START') {
        return {
            ruleId: 'loan-limit',
            ruleName: 'Loan Limit',
            passed: true,
            severity: 'blocking',
            message: 'Not a loan transfer',
        };
    }

    const managerId = transfer.managerId;
    const managerRoster = divisionRosters[managerId]?.roster;

    if (!managerRoster) {
        return {
            ruleId: 'loan-limit',
            ruleName: 'Loan Limit',
            passed: false,
            severity: 'blocking',
            message: 'Manager roster not found',
        };
    }

    // Check if on_loan_0 slot is already occupied
    const onLoanSlot = managerRoster.on_loan_0;
    const hasPlayerOnLoan = onLoanSlot?.player?.playerCode > 0;

    // loaning a player out
    if (hasPlayerOnLoan && transfer.onLoanTo) {
        const loanedPlayerName = onLoanSlot.player.playerName;
        return {
            ruleId: 'loan-limit',
            ruleName: 'Loan Limit',
            passed: false,
            severity: 'blocking',
            message: `Manager already has a player on loan: ${loanedPlayerName}. Only one loan allowed at a time.`,
            details: {
                currentLoanedPlayer: loanedPlayerName,
                loanedTo: onLoanSlot.player.onLoanTo,
                loanStart: onLoanSlot.player.onLoanStart,
            },
        };
    }

    return {
        ruleId: 'loan-limit',
        ruleName: 'Loan Limit',
        passed: true,
        severity: 'blocking',
        message: 'Loan limit check passed',
    };
}
