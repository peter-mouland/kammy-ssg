// app/transfers/lib/validators/ownership-validator.ts

import type { PositionSlotKey } from '../../../teams/types/team-types';
import type { OwnedPlayersByCode } from '../../types/transfer-form-types';
import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

const description = 'Player must be available and not owned by another manager';

/**
 * Validate loan limits - managers can only have one player on loan at a time
 */
export function ownershipLimit(context: TransferRuleContext): RuleValidationResult {
    const { transfer } = context;

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
    } else if (transfer.transferType === 'SWAP') {
        return {
            ruleId: 'ownership',
            ruleName: 'Ownership',
            passed: true,
            message: 'Swap doesnt change ownership',
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

        if (transfer.managerId === 'Chris S' || transfer.managerId === 'Howie') {
            console.log(`ownership:-gw--${transfer.gameweekData.fplEvent.id}--`);
            console.log('-----');
            console.log('--Chris S---');
            const Chris = context.divisionRosters['Chris S'].roster;
            console.log('out', transfer.playerOut.web_name);
            console.log('ca_0', Chris.ca_0.player.playerName);
            console.log('ca_1', Chris.ca_1.player.playerName);
            console.log('--Howie---');
            const Howie = context.divisionRosters['Howie'].roster;
            console.log('out', transfer.playerOut.web_name);
            console.log('ca_0', Howie.ca_0.player.playerName);
            console.log('ca_1', Howie.ca_1.player.playerName);
            console.log('-----');
            console.log('-----');
            console.log('-----');
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
