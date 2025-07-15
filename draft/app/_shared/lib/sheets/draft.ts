/* Location: app/_shared/lib/sheets/draft.ts */

import type { DraftPickData, DraftStateData } from '../../../draft/types/draft-types';
import type { DivisionId } from '../../../teams/types/team-types';
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
const DRAFT_STATE_HEADERS: Record<string, keyof Omit<DraftStateData, 'currentPick'>> = {
    'Is Active': 'isActive',
    // 'Current Pick': 'currentPick', // REMOVE - now calculated
    'Current User ID': 'currentUserId',
    'Division ID': 'divisionId', // Keep existing field name
    'Picks Per Team': 'picksPerTeam',
    'Started At': 'startedAt',
    'Completed At': 'completedAt',
};

const DRAFT_STATE_TRANSFORM_FUNCTIONS: Partial<Record<keyof Omit<DraftStateData, 'currentPick'>, (value: any) => any>> =
    {
        isActive: parseSheetBoolean,
        // currentPick: parseSheetNumber, // REMOVE
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
export async function getDraftPicksByDivision(divisionId: DivisionId): Promise<DraftPickData[]> {
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
                currentPick: 1, // Default for empty state
                currentUserId: '',
                divisionId: 'premierLeague',
                picksPerTeam: 12,
                startedAt: null,
                completedAt: null,
            };
        }

        // Cache headers for future use
        const cacheKey = `${spreadsheetId}:${DRAFT_STATE_SHEET_NAME}`;
        setCachedHeaders(cacheKey, headers);

        const { data: parsedData, missing } = parseDataWithHeaderMapping(
            headers,
            data,
            DRAFT_STATE_HEADERS,
            DRAFT_STATE_TRANSFORM_FUNCTIONS,
        );

        if (missing.length > 0) {
            console.warn(`Draft state sheet missing headers: ${missing.join(', ')}`);
        }

        const rawState = parsedData[0];

        // Calculate currentPick from actual picks data
        const allPicks = await readDraftPicks();
        const divisionPicks = allPicks.filter((pick) => pick.divisionId === rawState.divisionId);
        const calculatedCurrentPick = divisionPicks.length + 1;

        // Return state with calculated currentPick
        return {
            ...rawState,
            currentPick: calculatedCurrentPick,
        };
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
            // Headers exist, read all existing data to find the correct row
            const dataRange: SheetRange = {
                spreadsheetId,
                range: `'${DRAFT_STATE_SHEET_NAME}'!A:${String.fromCharCode(64 + headers.length)}`,
            };

            const allData = await readSheetRange(dataRange);

            // Skip header row (index 0) and look for existing row with matching divisionId
            const dataRows = allData.slice(1);
            const divisionIdColumnIndex = headers.findIndex(header =>
                DRAFT_STATE_HEADERS[header] === 'divisionId'
            );

            if (divisionIdColumnIndex === -1) {
                throw new Error('divisionId column not found in draft state sheet');
            }

            // Find existing row for this division
            let existingRowIndex = -1;
            for (let i = 0; i < dataRows.length; i++) {
                if (dataRows[i][divisionIdColumnIndex] === draftState.divisionId) {
                    existingRowIndex = i;
                    break;
                }
            }

            // Convert new data to row format
            const newDataRows = convertToRowsWithHeaders(
                [draftState],
                headers,
                DRAFT_STATE_HEADERS,
                DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS,
            );

            if (existingRowIndex >= 0) {
                // Update existing row (add 2 to account for header row and 0-based vs 1-based indexing)
                const targetRowNumber = existingRowIndex + 2;
                const updateRange: SheetRange = {
                    spreadsheetId,
                    range: `'${DRAFT_STATE_SHEET_NAME}'!A${targetRowNumber}:${String.fromCharCode(64 + headers.length)}${targetRowNumber}`,
                };

                await writeSheetRange(updateRange, newDataRows);
                console.log(
                    `✅ Successfully updated draft state for division ${draftState.divisionId}: Pick #${draftState.currentPick}, User: ${draftState.currentUserId} (Row ${targetRowNumber})`
                );
            } else {
                // Append new row for this division
                const appendRange: SheetRange = {
                    spreadsheetId,
                    range: `'${DRAFT_STATE_SHEET_NAME}'!A:${String.fromCharCode(64 + headers.length)}`,
                };

                await appendToSheet(appendRange, newDataRows);
                console.log(
                    `✅ Successfully added new draft state for division ${draftState.divisionId}: Pick #${draftState.currentPick}, User: ${draftState.currentUserId}`
                );
            }
        }

        // Invalidate cache since we've updated the data
        dataCache.delete(CACHE_KEYS.SHEETS.DRAFT_STATE);

    } catch (error) {
        console.error('❌ Failed to update draft state:', error);
        throw createAppError('DRAFT_STATE_UPDATE_ERROR', 'Failed to update draft state', error);
    }
}




/**
 * Read ALL draft states for all divisions and calculate currentPick
 */
async function originalReadAllDraftStates(): Promise<DraftStateData[]> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_STATE_SHEET_NAME}'!A:Z`,
        };

        const { headers, data } = await readSheetWithHeaders(sheetRange);

        if (headers.length === 0 || data.length === 0) {
            return [];
        }

        const cacheKey = `${spreadsheetId}:${DRAFT_STATE_SHEET_NAME}`;
        setCachedHeaders(cacheKey, headers);

        const { data: parsedData, missing } = parseDataWithHeaderMapping(
            headers,
            data,
            DRAFT_STATE_HEADERS,
            DRAFT_STATE_TRANSFORM_FUNCTIONS,
        );

        if (missing.length > 0) {
            console.warn(`Draft state sheet missing headers: ${missing.join(', ')}`);
        }

        // Calculate currentPick for each draft state
        const allPicks = await readDraftPicks();
        const { calculateCurrentPick } = await import('../../../draft/lib/draft-pick-calculator');

        const enrichedData = parsedData.map(
            (state: any): DraftStateData => ({
                ...state,
                currentPick: calculateCurrentPick(state.divisionId, allPicks), // CALCULATED from picks
            }),
        );

        return enrichedData;
    } catch (error) {
        throw createAppError('DRAFT_STATE_READ_ERROR', 'Failed to read draft states from sheet', error);
    }
}

export async function readAllDraftStates() {
    return originalReadAllDraftStates();
    // return await dataCache.get(CACHE_KEYS.SHEETS.DRAFT_STATE, originalReadAllDraftStates, {
    //     ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.DRAFT_STATE),
    // });
}
/**
 * Read draft state for a specific division
 */
export async function readDraftStateByDivision(divisionId: DivisionId): Promise<DraftStateData | null> {
    try {
        const allStates = await readAllDraftStates();
        return allStates.find((state) => state.divisionId === divisionId) || null;
    } catch (error) {
        throw createAppError(
            'DRAFT_STATE_DIVISION_ERROR',
            `Failed to get draft state for division: ${divisionId}`,
            error,
        );
    }
}
