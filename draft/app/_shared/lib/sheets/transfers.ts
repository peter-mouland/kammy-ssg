/* Location: app/_shared/lib/sheets/transfers.ts */

import type { DivisionId } from '../../types/league-types';
import type { ProcessedTransferSheetData, TransferSheetData } from '../../types/sheets-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { convertToRowsWithHeaders, getCachedHeaders, setCachedHeaders } from './cache/utils';
import { appendToSheet, createAppError, readSheetRange, type SheetRange } from './utils/common';
import { readDataFromSheet } from './utils/read-data-from-sheets';

const TRANSFERS_HEADERS: Record<keyof TransferSheetData, keyof ProcessedTransferSheetData> = {
    Status: 'status',
    Timestamp: 'timestamp',
    Manager: 'manager',
    'Transfer Out': 'transferOut',
    'Code Out': 'codeOut',
    'Transfer In': 'transferIn',
    'Code In': 'codeIn',
    'Transfer Type': 'transferType',
    Comment: 'comment',
    'Loan To': 'loanTo', // NEW
    'Loan From': 'loanFrom', // NEW
};

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
    'Loan To', // NEW
    'Loan From', // NEW
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
            if (Number.isNaN(parsed.getTime())) {
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
        if (Number.isNaN(parsed)) throw new Error(`Invalid Code Out: ${value}`);
        return parsed;
    },
    'Transfer In': (value: any): string => {
        if (!value) throw new Error('Transfer In player is required');
        return String(value).trim();
    },
    'Code In': (value: any): number => {
        if (!value) throw new Error('Code In is required');
        const parsed = Number.parseInt(String(value), 10);
        if (Number.isNaN(parsed)) throw new Error(`Invalid Code In: ${value}`);
        return parsed;
    },
    'Transfer Type': (value: any): string => {
        if (!value) throw new Error('Transfer Type is required');
        return String(value).trim();
    },
    Comment: (value: any): string => {
        return value ? String(value).trim() : '';
    },
    'Loan To': (value: any): string => {
        return value ? String(value).trim() : '';
    },
    'Loan From': (value: any): string => {
        return value ? String(value).trim() : '';
    },
};

/**
 * Read all draft orders from the sheet
 */
async function originalReadTransfers(divisionId: DivisionId): Promise<ProcessedTransferSheetData[]> {
    try {
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
            comment: row.Comment,
            loanTo: row['Loan To'],
            loanFrom: row['Loan From'],
        }));
        return normedResult;
    } catch (error) {
        throw createAppError('TRANSFERS_READ_ERROR', 'Failed to read transfer from sheet', error);
    }
}

export async function readTransfers(divisionId: DivisionId) {
    return await dataCache.get(CACHE_KEYS.SHEETS.TRANSFERS(divisionId), () => originalReadTransfers(divisionId), {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.TRANSFERS(divisionId)),
    });
}

export async function addTransfer(divisionId: DivisionId, transfer: ProcessedTransferSheetData): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetName = `${divisionId}-transfers`;
        const cacheKey = `${spreadsheetId}:${sheetName}`;

        // Try to get headers from cache first
        let headers = getCachedHeaders(cacheKey);

        if (!headers) {
            // If not cached, read headers
            const headerRange: SheetRange = {
                spreadsheetId,
                range: `'${sheetName}'!1:1`,
            };
            const headerData = await readSheetRange(headerRange);
            headers = headerData.length > 0 ? headerData[0] : [];
            setCachedHeaders(cacheKey, headers);
        }

        if (headers.length === 0) {
            throw new Error('No headers found in draft picks sheet');
        }

        // Convert data to correct column order
        const rows = convertToRowsWithHeaders([transfer], headers, TRANSFERS_HEADERS);

        // Append the data
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${sheetName}'!A:${String.fromCharCode(64 + headers.length)}`,
        };

        await appendToSheet(sheetRange, rows);

        console.log(`✅ Successfully added transfer: ${transfer.transferOut} -> ${transfer.transferIn}`);
    } catch (error) {
        console.error('❌ Failed to add transfer:', error);
        throw createAppError('TRANSFER_ADD_ERROR', 'Failed to add transfer to sheet', error);
    }
}
