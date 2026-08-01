/* Location: app/transfers/lib/transfer-rows.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { readTransfers } from '../../_shared/lib/sheets/transfers';
import type { DivisionId } from '../../_shared/types/league-types';
import type { EnhancedPlayerData, PlayersByCode } from '../../_shared/types/player-types';
import type {
    ProcessedTransfer,
    ProcessedTransferSheetData,
    TransferProcessingResult,
    TransferStatus,
    TransferType,
} from '../types/transfer-types';

/**
 * Turning raw `Transfers` sheet rows into the transfers this domain models.
 *
 * This all used to live inside `_shared/lib/sheets/transfers.ts`, which is why a sheets
 * reader needed `PlayersByCode` and `GameWeekData` passed into it — a clear sign it was
 * doing more than reading. The sheets module now only returns rows; the interpretation
 * (status, type, which gameweek a timestamp falls in, resolving player codes) belongs
 * here. See P2.3 in `.kiro/backlog.md`.
 */

/**
 * Read transfer data from Google Sheets for a specific division
 */
export async function readTransferDataForDivision(
    divisionId: DivisionId,
    fplPlayersByCode: PlayersByCode,
    gameweekData: GameWeekData[],
): Promise<TransferProcessingResult> {
    try {
        const normedResult = await readTransfers(divisionId);

        if (normedResult.length === 0) {
            console.log(`i No transfer data found for division ${divisionId}`);
            return {
                processedCount: 0,
                pendingCount: 0,
                approvedCount: 0,
                rejectedCount: 0,
                transfers: [],
                errors: [],
            };
        }

        console.log(`📊 Found ${normedResult.length} transfer records for ${divisionId}`);

        // Process the raw sheet data
        const processingResult = processTransferSheetData(normedResult, divisionId, fplPlayersByCode, gameweekData);

        console.log(`✅ Processed transfers for ${divisionId}:`, {
            approved: processingResult.approvedCount,
            rejected: processingResult.rejectedCount,
            pending: processingResult.pendingCount,
            errors: processingResult.errors.length,
        });

        return processingResult;
    } catch (error) {
        console.error(`❌ Failed to read transfer data for division ${divisionId}:`, error);
        throw new Error(`Failed to read transfer data for division ${divisionId}`, { cause: error });
    }
}

/**
 * Process raw transfer sheet data into structured transfers
 */
function processTransferSheetData(
    rawData: ProcessedTransferSheetData[],
    divisionId: DivisionId,
    fplPlayersByCode: PlayersByCode,
    gameweekData: GameWeekData[],
): TransferProcessingResult {
    const result: TransferProcessingResult = {
        processedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        transfers: [],
        errors: [],
    };

    result.transfers = rawData
        .sort((a, b) => (a.timestamp.getTime() < b.timestamp.getTime() ? 1 : 0))
        .map((rawTransfer, index) => {
            result.processedCount++;
            try {
                const transfer = processIndividualTransfer(
                    rawTransfer,
                    index,
                    divisionId,
                    fplPlayersByCode,
                    gameweekData,
                );
                if (transfer?.status === 'PENDING') result.pendingCount++;
                if (transfer?.status === 'APPROVED') result.approvedCount++;
                if (transfer?.status === 'REJECTED') result.rejectedCount++;
                return transfer;
            } catch (error) {
                result.errors.push({
                    rowIndex: index,
                    transfer: rawTransfer,
                    error: error instanceof Error ? error.message : 'Unknown processing error',
                    severity: 'error',
                });
            }
        })
        .filter((transfer) => !!transfer) as ProcessedTransfer[];

    return result;
}

/**
 * Process a single transfer record
 */
function processIndividualTransfer(
    rawTransfer: ProcessedTransferSheetData,
    rowIndex: number,
    divisionId: DivisionId,
    fplPlayersByCode: Record<EnhancedPlayerData['code'], EnhancedPlayerData>,
    gameweekData: GameWeekData[],
): ProcessedTransfer | null {
    const status = parseTransferStatus(rawTransfer.status);
    const transferType = parseTransferType(rawTransfer.transferType);
    const transferId = generateTransferId(divisionId, rawTransfer.timestamp, rowIndex);
    const gameweek = getGameweekFromTimestamp(rawTransfer.timestamp, gameweekData);

    return {
        id: transferId,
        status,
        gameweekData: gameweek,
        timestamp: rawTransfer.timestamp,
        managerId: rawTransfer.manager,
        transferType,
        playerOut: fplPlayersByCode[rawTransfer.codeOut],
        playerIn: fplPlayersByCode[rawTransfer.codeIn],
        comment: rawTransfer.comment,
        // Populate loan fields from sheet data
        onLoanTo: rawTransfer.loanTo || undefined,
        onLoanFrom: rawTransfer.loanFrom || undefined,
    };
}

/**
 * Parse transfer status from sheet value
 */
function parseTransferStatus(status: string | null): TransferStatus {
    if (!status || status === '') {
        return 'PENDING';
    }

    const normalized = status.toUpperCase().trim();

    switch (normalized) {
        case 'Y':
        case 'YES':
        case 'APPROVED':
            return 'APPROVED';
        case 'E':
        case 'N':
        case 'NO':
        case 'REJECTED':
            return 'REJECTED';
        default:
            return 'PENDING';
    }
}

/**
 * Parse transfer type from sheet value
 */
function parseTransferType(transferType: string): TransferType {
    const normalized = transferType.toLowerCase().trim();

    switch (normalized) {
        case 'transfer':
            return 'TRANSFER';
        case 'swap':
            return 'SWAP';
        case 'loan start':
            return 'LOAN_START';
        case 'loan end':
            return 'LOAN_END';
        case 'trade':
            return 'TRADE';
        case 'new player':
            return 'NEW_PLAYER';
        default:
            throw new Error(`Unknown transfer type: ${transferType}`);
    }
}

/**
 * Generate unique transfer ID
 */
function generateTransferId(divisionId: DivisionId, timestamp: Date, rowIndex: number): string {
    const timestampStr = timestamp.toISOString().replace(/[:.]/g, '');
    return `${divisionId}_${timestampStr}_${rowIndex}`;
}

function getGameweekFromTimestamp(timestamp: Date, gameweeks: GameWeekData[]): GameWeekData {
    // Find the gameweek that contains this timestamp
    for (const gameweek of gameweeks) {
        const gwStart = new Date(gameweek.start);
        const gwEnd = new Date(gameweek.end);

        if (timestamp >= gwStart && timestamp <= gwEnd) {
            return gameweek;
        }
    }
    return gameweeks[0];
}
