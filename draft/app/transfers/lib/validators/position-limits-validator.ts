/* Location: app/transfers/lib/position-limits-validator.ts */

import type { RosterPosition, TeamRoster } from '../../../teams/types/team-types';
import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';
import { simulateTransferOnRoster } from '../simulate-transfer-on-roster';

const description = 'Ensure roster maintains required position limits';


// Get position limits from parameters
const positionLimits = {
    gk: 1,
    cb: 2,
    fb: 2,
    mid: 2,
    wa: 2,
    ca: 2,
    sub: 1,
    on_loan: 1,
};

/**
 * Position limits validation for transfer rules
 */
export function validatePositionLimits(context: TransferRuleContext): RuleValidationResult {
    const { transfer, divisionRosters } = context;
    const managerId = transfer.managerId;
    if (!transfer.playerIn.draft) {
        console.error('playerIn should be EnhancedPlayerData')
        console.error(transfer.playerIn)
    }
    if (!transfer.playerOut.draft) {
        console.error('playerOut should be EnhancedPlayerData')
        console.error(transfer.playerOut)
    }

    // Get manager's current roster
    const managerTeam = divisionRosters[managerId];
    if (!managerTeam) {
        return {
            ruleId: 'position-limits',
            ruleName: 'Position Limits',
            passed: false,
            severity: 'blocking',
            message: `Manager ${managerId} not found in division rosters`,
        };
    }

    const currentRoster = managerTeam.roster;

    // Simulate the transfer to see the resulting roster
    const simulatedRoster = simulateTransferOnRoster(currentRoster, transfer);

    // Count positions in the simulated roster
    const positionCounts = countPositionsInRoster(simulatedRoster);

    // Check each position against limits
    const violations: string[] = [];

    for (const [position, limit] of Object.entries(positionLimits) as [RosterPosition, number][]) {
        const currentCount = positionCounts[position] || 0;

        if (currentCount > limit) {
            violations.push(
                `${getPositionDisplayName(position)}: ${currentCount}/${limit} (exceeds limit by ${currentCount - limit})`,
            );
        }
    }

    // Return validation result
    if (violations.length > 0) {
        return {
            ruleId: 'position-limits',
            ruleName: 'Position Limits',
            passed: false,
            severity: 'blocking',
            message: `Transfer would exceed position limits: ${violations.join(', ')}`,
            details: {
                currentCounts: positionCounts,
                limits: positionLimits,
                violations,
                transferType: transfer.transferType,
                playerInPosition: transfer.playerIn.draft?.position,
                playerOutPosition: transfer.playerOut.draft?.position,
            },
        };
    }

    return {
        ruleId: 'position-limits',
        ruleName: 'Position Limits',
        passed: true,
        severity: 'blocking',
        message: 'Transfer maintains position limits',
        details: {
            currentCounts: positionCounts,
            limits: positionLimits,
            transferType: transfer.transferType,
        },
    };
}

/**
 * Count positions in a roster
 */
function countPositionsInRoster(roster: TeamRoster): Record<RosterPosition, number> {
    const counts: Record<RosterPosition, number> = {
        gk: 0,
        cb: 0,
        fb: 0,
        mid: 0,
        wa: 0,
        ca: 0,
        sub: 0,
        on_loan: 0,
    };

    for (const [_slotKey, positionSlot] of Object.entries(roster)) {
        if (!positionSlot || !positionSlot.player) continue;

        if (Object.hasOwn(counts, positionSlot.player.teamPosition)) {
            counts[positionSlot.player.teamPosition]++;
        }
    }

    return counts;
}

/**
 * Get display name for position
 */
function getPositionDisplayName(position: RosterPosition): string {
    const displayNames: Record<RosterPosition, string> = {
        gk: 'Goalkeepers',
        cb: 'Centre Backs',
        fb: 'Full Backs',
        mid: 'Midfielders',
        wa: 'Wide Attackers',
        ca: 'Centre Attackers',
        sub: 'Substitutes',
        on_loan: 'On Loan',
    };

    return displayNames[position] || position.toUpperCase();
}
