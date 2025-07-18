// app/transfers/lib/validators/loan-limit-validator.ts

import type { PositionSlotKey } from '../../../teams/types/team-types';
import type { OwnedPlayersByCode } from '../../types/transfer-form-types';
import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

/**
 * Validate loan limits - managers can only have one player on loan at a time
 */
export function validateLoanLimit(context: TransferRuleContext): RuleValidationResult {
    const { transfer, divisionRosters } = context;

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
