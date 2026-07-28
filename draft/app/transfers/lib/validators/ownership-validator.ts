// app/transfers/lib/validators/ownership-validator.ts

import type { PositionSlotKey } from '../../../_shared/types/league-types';
import type { OwnedPlayersByCode } from '../../types/transfer-form-types';
import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

// const description = 'Player must be available and not owned by another manager';

/**
 * Validate loan limits - managers can only have one player on loan at a time
 */
export function ownershipLimit(context: TransferRuleContext): RuleValidationResult {
    const { transfer } = context;

    if (transfer.transferType === 'SWAP') {
        return {
            ruleId: 'ownership',
            ruleName: 'Ownership',
            passed: true,
            message: 'Swap doesnt change ownership',
            severity: 'blocking',
        };
    }

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
    const playerOutOwned = ownedPlayersByCode[transfer.playerOut?.code];

    // For loan transfers, different rules apply
    if (transfer.transferType === 'LOAN_START') {
        if (!playerOutOwned && !playerInOwned) {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: false,
                message: 'At least one player involved must be owned',
                severity: 'blocking',
            };
        }

        if (playerInOwned?.managerId === transfer.managerId) {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: false,
                message: 'Cannot loan in your own player',
                severity: 'blocking',
            };
        }
        if (playerInOwned && playerOutOwned && playerInOwned?.managerId !== playerOutOwned.managerId) {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: true,
                message: `Loans both directions to different managers; from ${playerInOwned.managerId}. to ${transfer.onLoanTo}`,
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
        if (playerOutOwned) {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: true,
                message: `Available for loan to ${transfer.onLoanTo}`,
                severity: 'blocking',
                showPassMessage: true,
                details: {
                    onLoanTo: transfer.onLoanTo,
                    currentOwner: transfer.managerId,
                    canLoan: true,
                },
            };
        }

        return {
            ruleId: 'ownership',
            ruleName: 'Ownership',
            passed: false,
            message: 'unknown state',
            severity: 'blocking',
        };
    } else if (transfer.transferType === 'LOAN_END') {
        if (playerInOwned?.slotKey === 'on_loan_0') {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: true,
                message: 'end loan of play in loan slot. good work.',
                severity: 'blocking',
            };
        } else {
            return {
                ruleId: 'ownership',
                ruleName: 'Ownership',
                passed: false,
                message: 'end loan of play NOT in loan slot. questionable.',
                severity: 'blocking',
            };
        }
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
