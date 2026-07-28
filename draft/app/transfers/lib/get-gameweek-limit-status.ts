// app/transfers/lib/get-gameweek-limit-status.ts

import type { ManagerId } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import type { ProcessedTransfer, TransferType } from '../types/transfer-types';
import { formatGameweekLimitDisplay, isGameweekLimitMessage } from './format-eligibility-status';
import { validateGameweekTransferLimit } from './validators/gameweek-transfer-limit-validator';

export interface GameweekLimitStatus {
    /** Full validator message shown in title/tooltip */
    message: string;
    /** Short label for the sticky footer banner */
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

    // validateGameweekTransferLimit only reads managerId, transferType, gameweekData, and timestamp — not playerIn
    const mockTransfer: ProcessedTransfer = {
        id: 'gameweek-limit-check',
        managerId,
        transferType,
        playerIn: {} as EnhancedPlayerData,
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

    if (result.passed || !isGameweekLimitMessage(result.ruleId)) {
        return null;
    }

    return {
        message: result.message,
        displayText: formatGameweekLimitDisplay(result.message),
    };
}
