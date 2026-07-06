// app/transfers/lib/get-player-status-display.ts

import type { ManagerId, UserTeamsSheetData } from '../../teams/types/team-types';
import type { PlayerEligibility } from '../types/transfer-form-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import { formatEligibilityStatus, isGameweekLimitMessage } from './format-eligibility-status';
import { getTransferValidationResults } from './get-transfer-validation-results';

export function getPlayerStatusDisplay(
    validationContext: TransferRuleContext,
    managers: UserTeamsSheetData[],
    managerId: ManagerId,
): PlayerEligibility {
    try {
        const validationResults = getTransferValidationResults(validationContext);

        const blockingFailures = validationResults.filter(
            (result) =>
                !result.passed &&
                result.severity === 'blocking' &&
                !isGameweekLimitMessage(result.ruleId, result.message),
        );

        if (blockingFailures.length > 0) {
            const formatted = formatEligibilityStatus({
                message: blockingFailures[0].message,
                ruleId: blockingFailures[0].ruleId,
                severity: 'blocking',
                managerId,
                managers,
            });

            return {
                isEligible: false,
                reason: formatted.text,
                icon: formatted.icon,
                fullMessage: formatted.fullMessage,
            };
        }

        const warnings = validationResults.filter((result) => !result.passed && result.severity === 'warning');

        if (warnings.length > 0) {
            const formatted = formatEligibilityStatus({
                message: warnings[0].message,
                ruleId: warnings[0].ruleId,
                severity: 'warning',
                managerId,
                managers,
            });

            return {
                isEligible: true,
                reason: formatted.text,
                icon: formatted.icon,
                fullMessage: formatted.fullMessage,
            };
        }

        return {
            isEligible: true,
            reason: 'Free Agent',
            icon: '✅',
            fullMessage: 'Free Agent',
        };
    } catch (error) {
        console.error('Error checking player eligibility:', error);
        return {
            isEligible: false,
            reason: 'Error',
            icon: '❌',
        };
    }
}
