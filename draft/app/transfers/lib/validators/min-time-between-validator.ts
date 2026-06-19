import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

// const ruleDescription = 'Minimum time required between transfers for the same manager',

/**
 * Validate minimum gap between transfers
 */
export function validateMinimumGap(_context: TransferRuleContext): RuleValidationResult {
    // This would need access to previous transfers for the manager
    // For now, return a placeholder implementation
    return {
        ruleId: 'minimum-gap-between-transfers',
        ruleName: 'Minimum Gap Between Transfers',
        passed: true,
        severity: 'warning',
        message: 'Gap validation requires transfer history (not implemented)',
    };
}
