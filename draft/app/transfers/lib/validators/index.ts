import type { TransferRuleContext } from '../../types/transfer-rule-types';
import { validateGameweekTransferLimit } from './gameweek-transfer-limit-validator';
import { validateLoanLimit } from './loan-limit-validator';
import { ownershipLimit } from './ownership-validator';
// import { validateMinimumGap } from './min-time-between-validator';
import { validatePlayerAvailability } from './player-availability-validator';
import { validatePositionCompatibility } from './position-compatibility-validator';
import { validatePositionLimits } from './position-limits-validator';
import { teamCountLimit } from './team-count-validator';

/**
 * Get all available rule validation functions
 */
export function getRuleValidationFunctions(validationContext: TransferRuleContext) {
    const validationResults = [
        ownershipLimit(validationContext),
        validatePlayerAvailability(validationContext), // no playerOut needed
        validatePositionCompatibility(validationContext),
        validatePositionLimits(validationContext),
        validateGameweekTransferLimit(validationContext), // no playerOut needed
        validateLoanLimit(validationContext),
        teamCountLimit(validationContext),
    ];
    return validationResults;
}
