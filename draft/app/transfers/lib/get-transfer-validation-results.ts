// app/transfers/lib/get-transfer-validation-results.ts

import type { RuleValidationResult, TransferRuleContext } from '../types/transfer-rule-types';
import { getRuleValidationFunctions } from './validators';
import { validateGameweekTransferLimit } from './validators/gameweek-transfer-limit-validator';
import { ownershipLimit } from './validators/ownership-validator';
import { validatePlayerAvailability } from './validators/player-availability-validator';
import { teamCountLimit } from './validators/team-count-validator';

export function getTransferValidationResults(validationContext: TransferRuleContext): RuleValidationResult[] {
    if (validationContext.transfer.playerOut) {
        return getRuleValidationFunctions(validationContext);
    }

    return [
        ownershipLimit(validationContext),
        validateGameweekTransferLimit(validationContext),
        validatePlayerAvailability(validationContext),
        teamCountLimit(validationContext),
    ];
}
