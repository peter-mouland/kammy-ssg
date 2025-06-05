// Enhanced draft.ts with smart header mapping - OPTIMIZED FOR API CALLS
import type { DraftPickData, DraftStateData } from '../../types';
import {
    readSheetRange,
    writeSheetRange,
    appendToSheet,
    parseHeaderBasedData,
    convertToSheetRows,
    parseSheetNumber,
    parseSheetDate,
    parseSheetBoolean,
    createAppError,
    type SheetRange
} from './common';

// Draft picks sheet configuration
const DRAFT_PICKS_SHEET_NAME = 'Draft';
const DRAFT_PICKS_HEADERS = {
    'Pick Number': 'pickNumber' as keyof DraftPickData,
    'Round': 'round' as keyof DraftPickData,
    'User ID': 'userId' as keyof DraftPickData,
    'Player ID': 'playerId' as keyof DraftPickData,
    'Player Name': 'playerName' as keyof DraftPickData,
    'Team Code': 'teamCode' as keyof DraftPickData,
    'Team Name': 'teamName' as keyof DraftPickData,
    'Position': 'position' as keyof DraftPickData,
    'Picked At': 'pickedAt' as keyof DraftPickData,
    'Division ID': 'divisionId' as keyof DraftPickData
};

// Transform functions for parsing and writing
const DRAFT_PICKS_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftPickData, (value: any) => any>> = {
    pickNumber: parseSheetNumber,
    round: parseSheetNumber,
    teamCode: parseSheetNumber,
    pickedAt: parseSheetDate
};

const DRAFT_PICKS_WRITE_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftPickData, (value: any) => any>> = {
    pickedAt: (value: Date) => value.toISOString()
};

// Draft state sheet configuration
const DRAFT_STATE_SHEET_NAME = 'DraftState';
const DRAFT_STATE_HEADERS = {
    'Is Active': 'isActive' as keyof DraftStateData,
    'Current Pick': 'currentPick' as keyof DraftStateData,
    'Current User ID': 'currentUserId' as keyof DraftStateData,
    'Current Division ID': 'currentDivisionId' as keyof DraftStateData,
    'Picks Per Team': 'picksPerTeam' as keyof DraftStateData,
    'Started At': 'startedAt' as keyof DraftStateData,
    'Completed At': 'completedAt' as keyof DraftStateData
};

const DRAFT_STATE_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftStateData, (value: any) => any>> = {
    isActive: parseSheetBoolean,
    currentPick: parseSheetNumber,
    picksPerTeam: parseSheetNumber,
    startedAt: (value: any) => value ? parseSheetDate(value) : null,
    completedAt: (value: any) => value ? parseSheetDate(value) : null
};

const DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftStateData, (value: any) => any>> = {
    startedAt: (value: Date | null) => parseSheetDate(value),
    completedAt: (value: Date | null) => parseSheetDate(value)
};

// Header cache to avoid repeated API calls
const headerCache = new Map<string, { headers: string[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

function getCachedHeaders(cacheKey: string): string[] | null {
    const cached = headerCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.headers;
    }
    return null;
}

function setCachedHeaders(cacheKey: string, headers: string[]): void {
    headerCache.set(cacheKey, { headers, timestamp: Date.now() });
}

/**
 * Read headers and data in single API call
 */
async function readSheetWithHeaders(sheetRange: SheetRange): Promise<{ headers: string[]; data: any[][] }> {
    const rawData = await readSheetRange(sheetRange);
    const headers = rawData.length > 0 ? rawData[0] : [];
    const data = rawData.slice(1);
    return { headers, data };
}

/**
 * Create header mapping and parse data efficiently
 */
function parseDataWithHeaderMapping<T>(
    headers: string[],
    dataRows: any[][],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>
): { data: T[]; missing: string[] } {
    // Create header to column index mapping
    const columnMapping = new Map<keyof T, number>();
    const missing: string[] = [];

    Object.entries(headerMapping).forEach(([headerText, objectKey]) => {
        const columnIndex = headers.findIndex(header =>
            header.toLowerCase().trim() === headerText.toLowerCase().trim()
        );

        if (columnIndex >= 0) {
            columnMapping.set(objectKey, columnIndex);
        } else {
            missing.push(headerText);
        }
    });

    // Parse data rows
    const data = dataRows.map(row => {
        const item = {} as T;

        columnMapping.forEach((columnIndex, objectKey) => {
            if (columnIndex < row.length) {
                let value = row[columnIndex];

                // Apply transformation function if provided
                if (transformFunctions && objectKey in transformFunctions) {
                    const transformFn = transformFunctions[objectKey];
                    if (transformFn) {
                        value = transformFn(value);
                    }
                }

                item[objectKey] = value;
            }
        });

        return item;
    });

    return { data, missing };
}

/**
 * Convert objects to sheet rows using header mapping
 */
function convertToRowsWithHeaders<T>(
    data: T[],
    headers: string[],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>
): any[][] {
    // Create header to column index mapping
    const columnMapping = new Map<keyof T, number>();

    Object.entries(headerMapping).forEach(([headerText, objectKey]) => {
        const columnIndex = headers.findIndex(header =>
            header.toLowerCase().trim() === headerText.toLowerCase().trim()
        );

        if (columnIndex >= 0) {
            columnMapping.set(objectKey, columnIndex);
        }
    });

    return data.map(item => {
        // Create array with same length as headers, filled with empty strings
        const row = new Array(headers.length).fill('');

        // Fill in values at correct positions
        columnMapping.forEach((columnIndex, objectKey) => {
            let value = item[objectKey] ?? '';

            // Apply transformation if provided
            if (transformFunctions && objectKey in transformFunctions) {
                const transformFn = transformFunctions[objectKey];
                if (transformFn) {
                    value = transformFn(value);
                }
            }

            row[columnIndex] = value;
        });

        return row;
    });
}

/**
 * Read all draft picks from the sheet - SINGLE API CALL
 */
export async function readDraftPicks(): Promise<DraftPickData[]> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:Z` // Wide range to be safe
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
            DRAFT_PICKS_TRANSFORM_FUNCTIONS
        );

        if (missing.length > 0) {
            console.warn(`Draft picks sheet missing headers: ${missing.join(', ')}`);
        }

        return parsedData;
    } catch (error) {
        throw createAppError(
            'DRAFT_PICKS_READ_ERROR',
            'Failed to read draft picks from sheet',
            error
        );
    }
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
                range: `'${DRAFT_PICKS_SHEET_NAME}'!1:1`
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
            DRAFT_PICKS_WRITE_TRANSFORM_FUNCTIONS
        );

        // Append the data
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:${String.fromCharCode(64 + headers.length)}`
        };

        await appendToSheet(sheetRange, rows);

        console.log(`✅ Successfully added draft pick: ${draftPick.playerName} (Pick #${draftPick.pickNumber})`);

    } catch (error) {
        console.error('❌ Failed to add draft pick:', error);
        throw createAppError(
            'DRAFT_PICK_ADD_ERROR',
            'Failed to add draft pick to sheet',
            error
        );
    }
}

/**
 * Get draft picks by division ID - reuse cached data
 */
export async function getDraftPicksByDivision(divisionId: string): Promise<DraftPickData[]> {
    try {
        const allPicks = await readDraftPicks(); // Single API call (or uses cache)
        return allPicks
            .filter(pick => pick.divisionId === divisionId)
            .sort((a, b) => a.pickNumber - b.pickNumber);
    } catch (error) {
        throw createAppError(
            'DRAFT_PICKS_DIVISION_ERROR',
            `Failed to get draft picks for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Read current draft state - SINGLE API CALL
 */
export async function readDraftState(): Promise<DraftStateData | null> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_STATE_SHEET_NAME}'!A:Z`
        };

        // Single API call to get headers and data
        const { headers, data } = await readSheetWithHeaders(sheetRange);

        if (headers.length === 0 || data.length === 0) {
            return null;
        }

        // Cache headers for future use
        const cacheKey = `${spreadsheetId}:${DRAFT_STATE_SHEET_NAME}`;
        setCachedHeaders(cacheKey, headers);

        // Parse data with header mapping
        const { data: parsedData, missing } = parseDataWithHeaderMapping(
            headers,
            data,
            DRAFT_STATE_HEADERS,
            DRAFT_STATE_TRANSFORM_FUNCTIONS
        );

        if (missing.length > 0) {
            console.warn(`Draft state sheet missing headers: ${missing.join(', ')}`);
        }

        return parsedData[0] || null;
    } catch (error) {
        throw createAppError(
            'DRAFT_STATE_READ_ERROR',
            'Failed to read draft state from sheet',
            error
        );
    }
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
                range: `'${DRAFT_STATE_SHEET_NAME}'!1:1`
            };
            const headerData = await readSheetRange(headerRange);
            headers = headerData.length > 0 ? headerData[0] : [];
            setCachedHeaders(cacheKey, headers);
        }

        if (headers.length === 0) {
            // No headers exist, create sheet with headers and data
            const headerRow = Object.keys(DRAFT_STATE_HEADERS);
            const dataRows = convertToSheetRows(
                [draftState],
                DRAFT_STATE_HEADERS,
                false
            );

            // Apply write transforms manually
            const transformedRows = dataRows.map(row => {
                const transformedRow = [...row];
                Object.entries(DRAFT_STATE_HEADERS).forEach(([header, key], index) => {
                    if (DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS[key]) {
                        transformedRow[index] = DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS[key]!(transformedRow[index]);
                    }
                });
                return transformedRow;
            });

            const sheetRange: SheetRange = {
                spreadsheetId,
                range: `'${DRAFT_STATE_SHEET_NAME}'!A:${String.fromCharCode(64 + headerRow.length)}`
            };

            await writeSheetRange(sheetRange, [headerRow, ...transformedRows]);
        } else {
            // Headers exist, map data to correct columns and update row 2
            const rows = convertToRowsWithHeaders(
                [draftState],
                headers,
                DRAFT_STATE_HEADERS,
                DRAFT_STATE_WRITE_TRANSFORM_FUNCTIONS
            );

            const dataRange: SheetRange = {
                spreadsheetId,
                range: `'${DRAFT_STATE_SHEET_NAME}'!A2:${String.fromCharCode(64 + headers.length)}2`
            };

            await writeSheetRange(dataRange, rows);
        }

        console.log(`✅ Successfully updated draft state: Pick #${draftState.currentPick}, User: ${draftState.currentUserId}`);

    } catch (error) {
        console.error('❌ Failed to update draft state:', error);
        throw createAppError(
            'DRAFT_STATE_UPDATE_ERROR',
            'Failed to update draft state',
            error
        );
    }
}

/**
 * Batch read both draft state and picks efficiently - 2 API CALLS TOTAL
 */
export async function batchReadDraftData(divisionId: string): Promise<{
    draftState: DraftStateData | null;
    draftPicks: DraftPickData[];
    apiCallCount: number;
}> {
    try {
        // Read both sheets in parallel - 2 API calls total
        const [draftState, allPicks] = await Promise.all([
            readDraftState(),
            readDraftPicks()
        ]);

        const draftPicks = allPicks
            .filter(pick => pick.divisionId === divisionId)
            .sort((a, b) => a.pickNumber - b.pickNumber);

        return {
            draftState,
            draftPicks,
            apiCallCount: 2
        };
    } catch (error) {
        throw createAppError(
            'BATCH_READ_DRAFT_DATA_ERROR',
            'Failed to batch read draft data',
            error
        );
    }
}

/**
 * Debug function to check sheet structure
 */
export async function debugSheetStructure(): Promise<{
    draftPicksHeaders: string[];
    draftStateHeaders: string[];
    headerMappings: {
        draftPicks: Record<string, number>;
        draftState: Record<string, number>;
    };
    apiCallsUsed: number;
}> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

        // Try to get from cache first
        const picksCache = `${spreadsheetId}:${DRAFT_PICKS_SHEET_NAME}`;
        const stateCache = `${spreadsheetId}:${DRAFT_STATE_SHEET_NAME}`;

        let draftPicksHeaders = getCachedHeaders(picksCache);
        let draftStateHeaders = getCachedHeaders(stateCache);
        let apiCallsUsed = 0;

        // Only make API calls if not cached
        const promises: Promise<any>[] = [];

        if (!draftPicksHeaders) {
            promises.push(
                readSheetRange({
                    spreadsheetId,
                    range: `'${DRAFT_PICKS_SHEET_NAME}'!1:1`
                }).then(data => {
                    draftPicksHeaders = data.length > 0 ? data[0] : [];
                    setCachedHeaders(picksCache, draftPicksHeaders!);
                })
            );
            apiCallsUsed++;
        }

        if (!draftStateHeaders) {
            promises.push(
                readSheetRange({
                    spreadsheetId,
                    range: `'${DRAFT_STATE_SHEET_NAME}'!1:1`
                }).then(data => {
                    draftStateHeaders = data.length > 0 ? data[0] : [];
                    setCachedHeaders(stateCache, draftStateHeaders!);
                })
            );
            apiCallsUsed++;
        }

        await Promise.all(promises);

        // Create mapping debug info
        const draftPicksMapping: Record<string, number> = {};
        const draftStateMapping: Record<string, number> = {};

        Object.keys(DRAFT_PICKS_HEADERS).forEach(header => {
            const index = draftPicksHeaders!.findIndex(h =>
                h.toLowerCase().trim() === header.toLowerCase().trim()
            );
            draftPicksMapping[header] = index;
        });

        Object.keys(DRAFT_STATE_HEADERS).forEach(header => {
            const index = draftStateHeaders!.findIndex(h =>
                h.toLowerCase().trim() === header.toLowerCase().trim()
            );
            draftStateMapping[header] = index;
        });

        return {
            draftPicksHeaders: draftPicksHeaders!,
            draftStateHeaders: draftStateHeaders!,
            headerMappings: {
                draftPicks: draftPicksMapping,
                draftState: draftStateMapping
            },
            apiCallsUsed
        };
    } catch (error) {
        throw createAppError(
            'DEBUG_SHEET_STRUCTURE_ERROR',
            'Failed to debug sheet structure',
            error
        );
    }
}
