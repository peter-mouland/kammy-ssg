// app/transfers/lib/get-transfer-journey-issues.ts

import type { ManagerId, UserTeamsSheetData } from '../../teams/types/team-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import { type EligibilitySeverity, formatEligibilityStatus, isGameweekLimitMessage } from './format-eligibility-status';
import { getGameweekLimitStatus } from './get-gameweek-limit-status';
import { getTransferValidationResults } from './get-transfer-validation-results';

export interface TransferJourneyIssue {
    text: string;
    icon: string;
    severity: EligibilitySeverity;
    fullMessage: string;
}

export function getTransferJourneyIssues({
    validationContext,
    transfer,
    managers,
    managerId,
    isBeforeDeadline,
    includeGameweekLimit = true,
}: {
    validationContext: Omit<TransferRuleContext, 'transfer'>;
    transfer: ProcessedTransfer;
    managers: UserTeamsSheetData[];
    managerId: ManagerId;
    isBeforeDeadline: boolean;
    includeGameweekLimit?: boolean;
}): TransferJourneyIssue[] {
    const issues: TransferJourneyIssue[] = [];

    if (!isBeforeDeadline) {
        issues.push({
            text: 'Missed the Deadline',
            icon: '🚫',
            severity: 'blocking',
            fullMessage: 'Missed the Deadline',
        });
    }

    if (includeGameweekLimit) {
        const gameweekLimit = getGameweekLimitStatus(validationContext, managerId, transfer.transferType);
        if (gameweekLimit) {
            issues.push({
                text: gameweekLimit.displayText,
                icon: '⏱️',
                severity: 'blocking',
                fullMessage: gameweekLimit.message,
            });
        }
    }

    const validationResults = getTransferValidationResults({
        ...validationContext,
        transfer,
    });

    const failedResults = validationResults.filter((result) => !result.passed);

    for (const result of failedResults) {
        if (includeGameweekLimit && isGameweekLimitMessage(result.ruleId, result.message)) {
            continue;
        }

        const formatted = formatEligibilityStatus({
            message: result.message,
            ruleId: result.ruleId,
            severity: result.severity === 'warning' ? 'warning' : 'blocking',
            managerId,
            managers,
        });

        issues.push(formatted);
    }

    return issues;
}
