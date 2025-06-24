/* Location: app/transfers/lib/gameweek-transfer-limit-validator.ts */
/** biome-ignore-all lint/style/useNamingConvention: <?> */

import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';
import type { ProcessedTransfer, TransferType } from '../../types/transfer-types';

/**
 * Validate gameweek transfer limit
 */
export function validateGameweekTransferLimit(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    // Get parameters with defaults
    const maxTransfersPerGameweek = 2;
    const maxSwapsPerGameweek = 2;
    const maxNewPlayersPerGameweek = Number.POSITIVE_INFINITY;
    const maxTradesPerGameweek = Number.POSITIVE_INFINITY;
    const countPendingTransfers = true;

    const { transfer } = context;
    const currentGameweek = transfer.gameweekData.fplEvent.id;
    const managerId = transfer.managerId;

    // Try to get relevant transfers from enhanced context
    const relevantTransfers: ProcessedTransfer[] = context.allGameweekTransfers.filter(
        (t) =>
            t.managerId === managerId && // this managers transfers
            t.gameweekData.fplEvent.id === currentGameweek && // this gameweek transfers
            t.timestamp < transfer.timestamp && // before current transfer
            t.id !== transfer.id, // Exclude current transfer
    );

    // Count transfers by type for this manager in this gameweek
    const transferCounts = countTransfersByType(relevantTransfers, countPendingTransfers);

    // Check current transfer against appropriate limit
    const currentTransferType = transfer.transferType;
    const violation = checkTransferLimit(currentTransferType, transferCounts, {
        maxTransfersPerGameweek,
        maxSwapsPerGameweek,
        maxNewPlayersPerGameweek,
        maxTradesPerGameweek,
    });

    if (currentGameweek === 1) {
        return {
            ruleId: 'transfer-limit-per-gameweek',
            ruleName: 'Transfer Limit Per Gameweek',
            passed: true,
            severity: 'blocking',
            message: `No Transfer limits for gameweek ${currentGameweek}`,
            details: {
                currentCounts: transferCounts,
                currentTransferType,
                gameweek: currentGameweek,
                managerId,
                relevantTransfersCount: relevantTransfers.length,
            },
        };
    }

    if (violation) {
        return {
            ruleId: 'transfer-limit-per-gameweek',
            ruleName: 'Transfer Limit Per Gameweek',
            passed: false,
            severity: 'blocking',
            message: violation.message,
            details: {
                currentCounts: transferCounts,
                limits: {
                    maxTransfersPerGameweek,
                    maxSwapsPerGameweek,
                    maxNewPlayersPerGameweek,
                    maxTradesPerGameweek,
                },
                violatedLimit: violation.limitType,
                currentTransferType,
                gameweek: currentGameweek,
                managerId,
                relevantTransfersCount: relevantTransfers.length,
            },
        };
    }

    return {
        ruleId: 'transfer-limit-per-gameweek',
        ruleName: 'Transfer Limit Per Gameweek',
        passed: true,
        severity: 'blocking',
        message: `Transfer within limits for gameweek ${currentGameweek}`,
        details: {
            currentCounts: transferCounts,
            limits: {
                maxTransfersPerGameweek,
                maxSwapsPerGameweek,
                maxNewPlayersPerGameweek,
                maxTradesPerGameweek,
            },
            currentTransferType,
            gameweek: currentGameweek,
            managerId,
            relevantTransfersCount: relevantTransfers.length,
        },
    };
}

/**
 * Count transfers by type for a manager
 */
function countTransfersByType(
    transfers: ProcessedTransfer[],
    countPendingTransfers: boolean,
): Record<TransferType, number> {
    const counts: Record<TransferType, number> = {
        TRANSFER: 0,
        SWAP: 0,
        LOAN_START: 0,
        LOAN_FINISH: 0,
        TRADE: 0,
        NEW_PLAYER: 0,
    };

    for (const transfer of transfers) {
        // Only count approved transfers, or include pending if configured
        const shouldCount = transfer.status === 'APPROVED' || (countPendingTransfers && transfer.status === 'PENDING');

        if (shouldCount) {
            counts[transfer.transferType]++;
        }
    }

    return counts;
}

/**
 * Check if adding the current transfer would violate limits
 */
function checkTransferLimit(
    currentTransferType: TransferType,
    currentCounts: Record<TransferType, number>,
    limits: {
        maxTransfersPerGameweek: number;
        maxSwapsPerGameweek: number;
        maxNewPlayersPerGameweek: number;
        maxTradesPerGameweek: number;
    },
): { message: string; limitType: string } | null {
    // Simulate adding the current transfer
    const newCounts = { ...currentCounts };
    newCounts[currentTransferType]++;

    // Check specific transfer type limits
    switch (currentTransferType) {
        case 'TRANSFER':
            if (newCounts.TRANSFER > limits.maxTransfersPerGameweek) {
                return {
                    message: `Would exceed transfer limit: ${newCounts.TRANSFER}/${limits.maxTransfersPerGameweek} transfers this gameweek`,
                    limitType: 'transfers',
                };
            }
            break;

        case 'SWAP':
            if (newCounts.SWAP > limits.maxSwapsPerGameweek) {
                return {
                    message: `Would exceed swap limit: ${newCounts.SWAP}/${limits.maxSwapsPerGameweek} swaps this gameweek`,
                    limitType: 'swaps',
                };
            }
            break;

        case 'NEW_PLAYER':
            if (newCounts.NEW_PLAYER > limits.maxNewPlayersPerGameweek) {
                return {
                    message: `Would exceed new player limit: ${newCounts.NEW_PLAYER}/${limits.maxNewPlayersPerGameweek} new players this gameweek`,
                    limitType: 'newPlayers',
                };
            }
            break;

        case 'TRADE':
            if (newCounts.TRADE > limits.maxTradesPerGameweek) {
                return {
                    message: `Would exceed trade limit: ${newCounts.TRADE}/${limits.maxTradesPerGameweek} trades this gameweek`,
                    limitType: 'trades',
                };
            }
            break;

        case 'LOAN_START':
        case 'LOAN_FINISH':
            // Loans typically don't have gameweek limits, but could be added if needed
            break;
    }

    return null; // No violation
}
