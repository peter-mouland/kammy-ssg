/* Location: app/_shared/lib/sheets/draft.ts */

import type { DraftPickData, DraftStateData } from '../../../draft/types/draft-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import {
    convertToRowsWithHeaders,
    getCachedHeaders,
    parseDataWithHeaderMapping,
    readSheetWithHeaders,
    setCachedHeaders,
} from './cache/utils';
// Enhanced draft.ts with smart header mapping - OPTIMIZED FOR API CALLS
import {
    appendToSheet,
    convertToSheetRows,
    createAppError,
    parseSheetBoolean,
    parseSheetDate,
    parseSheetNumber,
    readSheetRange,
    type SheetRange,
    writeSheetRange,
} from './utils/common';

// Draft picks sheet configuration
const DRAFT_PICKS_SHEET_NAME = 'Draft';
const DRAFT_PICKS_HEADERS: Record<string, keyof DraftPickData> = {
    'Pick Number': 'pickNumber',
    Round: 'round',
    'User ID': 'userId',
    'Player ID': 'playerId',
    Code: 'playerCode',
    'Player Name': 'playerName',
    'Team Code': 'teamCode',
    'Team Name': 'teamName',
    Position: 'position',
    'Picked At': 'pickedAt',
    'Division ID': 'divisionId',
};

// Transform functions for parsing and writing
const DRAFT_PICKS_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftPickData, (value: any) => any>> = {
    pickNumber: parseSheetNumber,
    round: parseSheetNumber,
    teamCode: parseSheetNumber,
    pickedAt: parseSheetDate,
};

const DRAFT_PICKS_WRITE_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftPickData, (value: any) => any>> = {
    pickedAt: (value: Date) => value.toISOString(),
};

// Draft state sheet configuration
const DRAFT_STATE_SHEET_NAME = 'DraftState';
const DRAFT_STATE_HEADERS: Record<string, keyof DraftStateData> = {
    'Is Active': 'isActive',
    'Current Pick': 'currentPick',
    'Current User ID': 'currentUserId',
    'Current Division ID': 'currentDivisionId',
    'Picks Per Team': 'picksPerTeam',
    'Started At': 'startedAt',
    'Completed At': 'completedAt',
};

const DRAFT_STATE_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftStateData, (value: any) => any>> = {
    isActive: parseSheetBoolean,
    currentPick: parseSheetNumber,
    picksPerTeam: parseSheetNumber,
    startedAt: (value: any) => (value ? parseSheetDate(value) : null),
    completedAt: (value: any) => (value ? parseSheetDate(value) : null),
};

const DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftStateData, (value: any) => any>> = {
    startedAt: (value: Date | null) => parseSheetDate(value),
    completedAt: (value: Date | null) => parseSheetDate(value),
};

/**
 * Read all draft picks from the sheet - SINGLE API CALL
 */
async function originalReadDraftPicks(): Promise<DraftPickData[]> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:Z`, // Wide range to be safe
        };

        // Single API call to get headers and data
        const { headers, data } = await readSheetWithHeaders(sheetRange);

        if (headers.length === 0) {
            return [];
        }

        // Cache headers for future use
        const cacheKey = `${spreadsheetId}:${DRAFT_PICKS_SHEET_NAME}`;
        setCachedHeaders(cacheKey, headers);

        // Parse data with header mapping
        const { data: parsedData, missing } = parseDataWithHeaderMapping(
            headers,
            data,
            DRAFT_PICKS_HEADERS,
            DRAFT_PICKS_TRANSFORM_FUNCTIONS,
        );

        if (missing.length > 0) {
            console.warn(`Draft picks sheet missing headers: ${missing.join(', ')}`);
        }

        return parsedData;
    } catch (error) {
        throw createAppError('DRAFT_PICKS_READ_ERROR', 'Failed to read draft picks from sheet', error);
    }
}
export async function readDraftPicks() {
    return await dataCache.get(CACHE_KEYS.SHEETS.DRAFT, originalReadDraftPicks, {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.DRAFT),
    });
}

/**
 * Add a new draft pick to the sheet - OPTIMIZED API CALLS
 */
export async function addDraftPick(draftPick: DraftPickData): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const cacheKey = `${spreadsheetId}:${DRAFT_PICKS_SHEET_NAME}`;

        // Try to get headers from cache first
        let headers = getCachedHeaders(cacheKey);

        if (!headers) {
            // If not cached, read headers
            const headerRange: SheetRange = {
                spreadsheetId,
                range: `'${DRAFT_PICKS_SHEET_NAME}'!1:1`,
            };
            const headerData = await readSheetRange(headerRange);
            headers = headerData.length > 0 ? headerData[0] : [];
            setCachedHeaders(cacheKey, headers);
        }

        if (headers.length === 0) {
            throw new Error('No headers found in draft picks sheet');
        }

        // Convert data to correct column order
        const rows = convertToRowsWithHeaders(
            [draftPick],
            headers,
            DRAFT_PICKS_HEADERS,
            DRAFT_PICKS_WRITE_TRANSFORM_FUNCTIONS,
        );

        // Append the data
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:${String.fromCharCode(64 + headers.length)}`,
        };

        await appendToSheet(sheetRange, rows);

        console.log(`✅ Successfully added draft pick: ${draftPick.playerName} (Pick #${draftPick.pickNumber})`);
    } catch (error) {
        console.error('❌ Failed to add draft pick:', error);
        throw createAppError('DRAFT_PICK_ADD_ERROR', 'Failed to add draft pick to sheet', error);
    }
}

/**
 * Get draft picks by division ID - reuse cached data
 */
export async function getDraftPicksByDivision(divisionId: string): Promise<DraftPickData[]> {
    try {
        const allPicks = await readDraftPicks(); // Single API call (or uses cache)
        return allPicks.filter((pick) => pick.divisionId === divisionId).sort((a, b) => a.pickNumber - b.pickNumber);
    } catch (error) {
        throw createAppError(
            'DRAFT_PICKS_DIVISION_ERROR',
            `Failed to get draft picks for division: ${divisionId}`,
            error,
        );
    }
}

/**
 * Read current draft state - SINGLE API CALL
 */
async function originalReadDraftState(): Promise<DraftStateData> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_STATE_SHEET_NAME}'!A:Z`,
        };

        // Single API call to get headers and data
        const { headers, data } = await readSheetWithHeaders(sheetRange);

        if (headers.length === 0 || data.length === 0) {
            return {
                isActive: false,
                currentPick: 0,
                currentUserId: '',
                currentDivisionId: '',
                picksPerTeam: 12,
                startedAt: null,
                completedAt: null,
            };
        }

        // Cache headers for future use
        const cacheKey = `${spreadsheetId}:${DRAFT_STATE_SHEET_NAME}`;
        setCachedHeaders(cacheKey, headers);

        // Parse data with header mapping
        const { data: parsedData, missing } = parseDataWithHeaderMapping(
            headers,
            data,
            DRAFT_STATE_HEADERS,
            DRAFT_STATE_TRANSFORM_FUNCTIONS,
        );

        if (missing.length > 0) {
            console.warn(`Draft state sheet missing headers: ${missing.join(', ')}`);
        }

        return parsedData[0];
    } catch (error) {
        throw createAppError('DRAFT_STATE_READ_ERROR', 'Failed to read draft state from sheet', error);
    }
}
export async function readDraftState() {
    return await dataCache.get(CACHE_KEYS.SHEETS.DRAFT_STATE, originalReadDraftState, {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.DRAFT_STATE),
    });
}

/**
 * Update draft state - OPTIMIZED API CALLS
 */
export async function updateDraftState(draftState: DraftStateData): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const cacheKey = `${spreadsheetId}:${DRAFT_STATE_SHEET_NAME}`;

        // Try to get headers from cache first
        let headers = getCachedHeaders(cacheKey);

        if (!headers) {
            // If not cached, read headers
            const headerRange: SheetRange = {
                spreadsheetId,
                range: `'${DRAFT_STATE_SHEET_NAME}'!1:1`,
            };
            const headerData = await readSheetRange(headerRange);
            headers = headerData.length > 0 ? headerData[0] : [];
            setCachedHeaders(cacheKey, headers);
        }

        if (headers.length === 0) {
            // No headers exist, create sheet with headers and data
            const headerRow = Object.keys(DRAFT_STATE_HEADERS);
            const dataRows = convertToSheetRows([draftState], DRAFT_STATE_HEADERS, false);

            // Apply write transforms manually
            const transformedRows = dataRows.map((row) => {
                const transformedRow = [...row];
                Object.entries(DRAFT_STATE_HEADERS).forEach(([_header, key], index) => {
                    if (DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS[key]) {
                        transformedRow[index] = DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS[key]?.(transformedRow[index]);
                    }
                });
                return transformedRow;
            });

            const sheetRange: SheetRange = {
                spreadsheetId,
                range: `'${DRAFT_STATE_SHEET_NAME}'!A:${String.fromCharCode(64 + headerRow.length)}`,
            };

            await writeSheetRange(sheetRange, [headerRow, ...transformedRows]);
        } else {
            // Headers exist, map data to correct columns and update row 2
            const rows = convertToRowsWithHeaders(
                [draftState],
                headers,
                DRAFT_STATE_HEADERS,
                DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS,
            );

            const dataRange: SheetRange = {
                spreadsheetId,
                range: `'${DRAFT_STATE_SHEET_NAME}'!A2:${String.fromCharCode(64 + headers.length)}2`,
            };

            await writeSheetRange(dataRange, rows);
        }

        console.log(
            `✅ Successfully updated draft state: Pick #${draftState.currentPick}, User: ${draftState.currentUserId}`,
        );
    } catch (error) {
        console.error('❌ Failed to update draft state:', error);
        throw createAppError('DRAFT_STATE_UPDATE_ERROR', 'Failed to update draft state', error);
    }
}
