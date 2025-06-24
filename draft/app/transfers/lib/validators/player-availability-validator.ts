import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

/**
 * Validate player availability
 */
export function validatePlayerAvailability(context: TransferRuleContext): RuleValidationResult {
    const playerIn = context.transfer.playerIn;

    // Check if player is already owned by another manager
    for (const [managerId, managerTeam] of Object.entries(context.divisionRosters)) {
        if (managerId === context.transfer.managerId) continue; // Skip current manager

        for (const positionSlot of Object.values(managerTeam.roster)) {
            if (positionSlot.player.playerCode === playerIn.code) {
                return {
                    ruleId: 'player-availability',
                    ruleName: 'Player Availability',
                    passed: false,
                    severity: 'blocking',
                    message: `Player ${playerIn.web_name} is already owned by another manager (${managerId})`,
                    details: {
                        currentOwner: managerId,
                    },
                };
            }
        }
    }

    return {
        ruleId: 'player-availability',
        ruleName: 'Player Availability',
        passed: true,
        severity: 'blocking',
        message: 'Player is available for transfer',
    };
}
