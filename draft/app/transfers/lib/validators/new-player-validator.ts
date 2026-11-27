// app/transfers/lib/validators/new-player-validator.ts

import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';
import type { TransferType } from '../../types/transfer-types';

const RULE = { ruleId: 'newPlayerType', ruleName: 'New Player Type', severity: 'blocking' } as const;

/** Ways of taking a player in outright, which a new player must not go through. */
const OUTRIGHT_TYPES: TransferType[] = ['TRANSFER', 'TRADE'];

/**
 * Rules 3.7–3.9: a player new to the game goes to a draw, entered with the New Player
 * Request type. Any other player is picked up with a normal transfer. A warning, like
 * every rule for now: it never blocks a submission.
 */
export function newPlayerType({ transfer }: TransferRuleContext): RuleValidationResult {
    const isNew = transfer.playerIn?.draft?.isNew === true;

    if (isNew && OUTRIGHT_TYPES.includes(transfer.transferType)) {
        return { ...RULE, passed: false, message: 'New players go to a draw — choose New Player Request' };
    }

    if (!isNew && transfer.transferType === 'NEW_PLAYER') {
        return { ...RULE, passed: false, message: 'Not a new player — use Transfer' };
    }

    return { ...RULE, passed: true, message: 'New player type check passed' };
}
