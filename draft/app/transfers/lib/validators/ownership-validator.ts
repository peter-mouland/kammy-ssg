// app/transfers/lib/validators/ownership-validator.ts

import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

const description = 'Player must be available and not owned by another manager';

/**
 * Validate loan limits - managers can only have one player on loan at a time
 */
export function ownershipLimit(context: TransferRuleContext): RuleValidationResult {
    const { transfer, ownedPlayersByCode } = context;

    const playerInOwned = ownedPlayersByCode[transfer.playerIn.code];

    // For loan transfers, different rules apply
    if (transfer.transferType === 'LOAN_START') {
        if (playerInOwned?.managerId === transfer.managerId) {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: false,
                message: 'Cannot loan your own player',
                severity: 'blocking',
            };
        }

        if (playerInOwned) {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: true,
                message: `Available for loan from ${playerInOwned.managerId}`,
                severity: 'blocking',
                showPassMessage: true,
                details: {
                    currentOwner: playerInOwned.managerId,
                    canLoan: true,
                },
            };
        }

        return {
            ruleId: 'ownership',
            ruleName: 'Ownership',
            passed: false,
            message: 'Player not found in any roster',
            severity: 'blocking',
        };
    }

    // For regular transfers, player must be available (not owned by anyone)
    if (playerInOwned) {
        if (playerInOwned.managerId === transfer.managerId) {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: false,
                severity: 'blocking',
                message: 'Already in your team',
            };
        }

        return {
            ruleId: 'ownership',
            ruleName: 'Ownership',
            passed: false,
            severity: 'blocking',
            message: `Owned by ${playerInOwned.managerId}`,
        };
    }

    return {
        ruleId: 'ownership',
        ruleName: 'Ownership',
        passed: true,
        severity: 'blocking',
        message: 'Ownership check passed',
    };
}
