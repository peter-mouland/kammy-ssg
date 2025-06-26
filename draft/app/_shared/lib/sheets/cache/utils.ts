/* Location: app/_shared/lib/sheets/draft.ts */

import { readSheetRange, type SheetRange } from '../utils/common';

// Header cache to avoid repeated API calls
const headerCache = new Map<string, { headers: string[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

export function getCachedHeaders(cacheKey: string): string[] | null {
    const cached = headerCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.headers;
    }
    return null;
}

export function setCachedHeaders(cacheKey: string, headers: string[]): void {
    headerCache.set(cacheKey, { headers, timestamp: Date.now() });
}

/**
 * Read headers and data in single API call
 */
export async function readSheetWithHeaders(sheetRange: SheetRange): Promise<{ headers: string[]; data: any[][] }> {
    const rawData = await readSheetRange(sheetRange);
    const headers = rawData.length > 0 ? rawData[0] : [];
    const data = rawData.slice(1);
    return { headers, data };
}

/**
 * Create header mapping and parse data efficiently
 */
export function parseDataWithHeaderMapping<T>(
    headers: string[],
    dataRows: any[][],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>,
): { data: T[]; missing: string[] } {
    // Create header to column index mapping
    const columnMapping = new Map<keyof T, number>();
    const missing: string[] = [];

    Object.entries(headerMapping).forEach(([headerText, objectKey]) => {
        const columnIndex = headers.findIndex(
            (header) => header.toLowerCase().trim() === headerText.toLowerCase().trim(),
        );

        if (columnIndex >= 0) {
            columnMapping.set(objectKey, columnIndex);
        } else {
            missing.push(headerText);
        }
    });

    // Parse data rows
    const data = dataRows.map((row) => {
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
export function convertToRowsWithHeaders<T>(
    data: T[],
    headers: string[],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>,
): any[][] {
    // Create header to column index mapping
    const columnMapping = new Map<keyof T, number>();

    Object.entries(headerMapping).forEach(([headerText, objectKey]) => {
        const columnIndex = headers.findIndex(
            (header) => header.toLowerCase().trim() === headerText.toLowerCase().trim(),
        );

        if (columnIndex >= 0) {
            columnMapping.set(objectKey, columnIndex);
        }
    });

    return data.map((item) => {
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
