// app/transfers/lib/player-eligibility-from-validators.ts

import type { PlayerEligibility } from '../types/transfer-form-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import { getRuleValidationFunctions } from './validators';
import { validateGameweekTransferLimit } from './validators/gameweek-transfer-limit-validator';
import { validatePlayerAvailability } from './validators/player-availability-validator';
import { teamCountLimit } from './validators/team-count-validator';

/**
 * Get player eligibility by reusing existing transfer validators
 */
export function getPlayerEligibilityFromValidators(validationContext: TransferRuleContext): PlayerEligibility {
    try {
        const validationResults = validationContext.transfer.playerOut
            ? getRuleValidationFunctions(validationContext)
            : [
                  validateGameweekTransferLimit(validationContext), // no playerOut needed
                  validatePlayerAvailability(validationContext), // no playerOut needed
                  teamCountLimit(validationContext),
              ];
        // const validationResults = getRuleValidationFunctions(validationContext);

        const blockingFailures = validationResults.filter((result) => !result.passed && result.severity === 'blocking');

        if (blockingFailures.length > 0) {
            const firstFailure = blockingFailures[0];
            return {
                isEligible: false,
                reason: firstFailure.message,
                icon: getIconForRuleFailure(firstFailure.ruleId),
            };
        }

        // Check for warnings
        const warnings = validationResults.filter((result) => !result.passed && result.severity === 'warning');

        if (warnings.length > 0) {
            const firstWarning = warnings[0];
            return {
                isEligible: true,
                reason: `⚠️ ${firstWarning.message}`,
                icon: '⚠️',
            };
        }

        // All checks passed
        return {
            isEligible: true,
            reason:
                validationResults
                    .filter((result) => result.showPassMessage)
                    .map((result) => result.message)
                    .join('') || 'Available for transfer',
            icon: '✅',
        };
    } catch (error) {
        console.error('Error checking player eligibility:', error);
        return {
            isEligible: false,
            reason: 'Error checking eligibility',
            icon: '❌',
        };
    }
}
/**
 * Get appropriate icon for rule failure
 */
function getIconForRuleFailure(ruleId: string): string {
    switch (ruleId) {
        case 'ownership':
            return '👤';
        case 'player-availability':
            return '🔒';
        case 'position-compatibility':
            return '🚫';
        case 'position-limits':
            return '📊';
        case 'gameweek-transfer-limit':
            return '⏱️';
        case 'loan-limit':
            return '🔄';
        default:
            return '❌';
    }
}
