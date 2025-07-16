
import { validateGameweekTransferLimit } from './gameweek-transfer-limit-validator';
// import { validateMinimumGap } from './min-time-between-validator';
import { validatePlayerAvailability } from './player-availability-validator';
import { validatePositionCompatibility } from './position-compatibility-validator';
import { validatePositionLimits } from './position-limits-validator';
import { validateLoanLimit } from './loan-limit-validator';
import { ownershipLimit } from './ownership-validator';
import { teamCountLimit } from './team-count-validator';
import type { TransferRuleContext } from '../../types/transfer-rule-types';

/**
 * Get all available rule validation functions
 */
export function getRuleValidationFunctions(validationContext: TransferRuleContext) {
    const validationResults = [
        ownershipLimit(validationContext),
        validatePlayerAvailability(validationContext),
        validatePositionCompatibility(validationContext),
        validatePositionLimits(validationContext),
        validateGameweekTransferLimit(validationContext),
        validateLoanLimit(validationContext),
        teamCountLimit(validationContext),
    ];
    return validationResults;
}
