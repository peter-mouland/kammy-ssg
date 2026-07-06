// app/transfers/lib/get-gameweek-limit-status.ts

import type { ManagerId } from '../../teams/types/team-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import type { ProcessedTransfer, TransferType } from '../types/transfer-types';
import { formatGameweekLimitDisplay, isGameweekLimitMessage } from './format-eligibility-status';
import { validateGameweekTransferLimit } from './validators/gameweek-transfer-limit-validator';

export interface GameweekLimitStatus {
    message: string;
    displayText: string;
}

export function getGameweekLimitStatus(
    validationContext: Omit<TransferRuleContext, 'transfer'>,
    managerId: ManagerId,
    transferType: TransferType,
): GameweekLimitStatus | null {
    if (transferType === 'LOAN_START' || transferType === 'LOAN_END') {
        return null;
    }

    const firstPlayer = Object.values(validationContext.fplPlayersByCode)[0];
    if (!firstPlayer) {
        return null;
    }

    const mockTransfer: ProcessedTransfer = {
        id: 'gameweek-limit-check',
        managerId,
        transferType,
        playerIn: firstPlayer,
        playerOut: null,
        gameweekData: validationContext.gameweekData,
        timestamp: new Date(),
        status: 'PENDING',
        comment: 'Gameweek limit check',
        onLoanTo: undefined,
        onLoanFrom: undefined,
    };

    const result = validateGameweekTransferLimit({
        ...validationContext,
        transfer: mockTransfer,
    });

    if (result.passed || !isGameweekLimitMessage(result.ruleId, result.message)) {
        return null;
    }

    return {
        message: result.message,
        displayText: formatGameweekLimitDisplay(result.message),
    };
}
