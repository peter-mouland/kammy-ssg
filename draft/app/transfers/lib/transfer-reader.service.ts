/* Location: app/transfers/lib/transfer-reader.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { readDataFromSheet } from '../../_shared/lib/sheets/utils/read-data-from-sheets';
import type { EnhancedPlayerData, PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId } from '../../teams/types/team-types';
import type {
    ProcessedTransfer,
    ProcessedTransferSheetData,
    TransferProcessingResult,
    TransferSheetData,
    TransferStatus,
    TransferType,
} from '../types/transfer-types';

/**
 * Header order for transfer sheets - must match Google Sheets column order
 */
const TRANSFER_SHEET_HEADERS = [
    'Status',
    'Timestamp',
    'Manager',
    'Transfer Out',
    'Code Out',
    'Transfer In',
    'Code In',
    'Transfer Type',
    'Comment',
] as const;

/**
 * Transform functions for parsing sheet data
 */
const TRANSFER_TRANSFORM_FUNCTIONS = {
    Status: (value: any): string => {
        if (!value || value === '') return '';
        return String(value).trim().toUpperCase();
    },
    Timestamp: (value: any): Date => {
        if (!value) throw new Error('Timestamp is required');

        if (value instanceof Date) return value;

        if (typeof value === 'string') {
            const parsed = new Date(value);
            if (isNaN(parsed.getTime())) {
                throw new Error(`Invalid timestamp format: ${value}`);
            }
            return parsed;
        }

        // Handle Excel serial date numbers
        if (typeof value === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        }

        throw new Error(`Unable to parse timestamp: ${value}`);
    },
    Manager: (value: any): string => {
        if (!value) throw new Error('Manager is required');
        return String(value).trim();
    },
    'Transfer Out': (value: any): string => {
        if (!value) throw new Error('Transfer Out player is required');
        return String(value).trim();
    },
    'Code Out': (value: any): number => {
        if (!value) throw new Error('Code Out is required');
        const parsed = Number.parseInt(String(value), 10);
        if (isNaN(parsed)) throw new Error(`Invalid Code Out: ${value}`);
        return parsed;
    },
    'Transfer In': (value: any): string => {
        if (!value) throw new Error('Transfer In player is required');
        return String(value).trim();
    },
    'Code In': (value: any): number => {
        if (!value) throw new Error('Code In is required');
        const parsed = Number.parseInt(String(value), 10);
        if (isNaN(parsed)) throw new Error(`Invalid Code In: ${value}`);
        return parsed;
    },
    'Transfer Type': (value: any): string => {
        if (!value) throw new Error('Transfer Type is required');
        return String(value).trim();
    },
    Comment: (value: any): string => {
        return value ? String(value).trim() : '';
    },
};

/**
 * Read transfer data from Google Sheets for a specific division
 */
export async function readTransferDataForDivision(
    divisionId: DivisionId,
    fplPlayersByCode: PlayersByCode,
    gameweekData: GameWeekData[],
): Promise<TransferProcessingResult> {
    try {
        console.log(`📖 Reading transfer data for division: ${divisionId}`);

        // Each division has its own sheet named after the division ID
        const sheetName = `${divisionId}-transfers`;

        const sheetResult = await readDataFromSheet<TransferSheetData>(sheetName, {
            headerOrder: [...TRANSFER_SHEET_HEADERS],
            transformFunctions: TRANSFER_TRANSFORM_FUNCTIONS,
            requireAllHeaders: true,
            warnMissingHeaders: true,
        });

        const normedResult = sheetResult.map((row) => ({
            manager: row.Manager,
            status: row.Status,
            timestamp: row.Timestamp,
            transferOut: row['Transfer Out'],
            codeOut: row['Code Out'],
            transferIn: row['Transfer In'],
            codeIn: row['Code In'],
            transferType: row['Transfer Type'],
            comment: row['Comment'],
        }));

        if (normedResult.length === 0) {
            console.log(`ℹ️ No transfer data found for division ${divisionId}`);
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
        throw new Error(
            `Failed to read transfer data for division ${divisionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
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
        case 'loan finish':
            return 'LOAN_FINISH';
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
