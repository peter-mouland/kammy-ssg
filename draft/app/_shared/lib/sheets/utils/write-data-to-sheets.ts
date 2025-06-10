import {
    appendToSheet,
    createAppError,
    createHeaderMappingFromActual,
    readSheetWithHeaders,
    type SheetRange,
    type SheetWriteOptions,
    writeSheetRange,
    SPREADSHEET_ID
} from './common';

export interface SaveDataOptions extends SheetWriteOptions {
    /** Whether to create headers if sheet is empty */
    createHeaders?: boolean;
    /** Whether to append to existing data or overwrite */
    mode?: 'append' | 'overwrite';
    /** Custom transformations for specific object keys */
    transformFunctions?: Record<string, (value: any) => any>;
    /** Whether to validate all object keys have matching headers */
    requireAllHeaders?: boolean;
}

/**
 * Convert column number to Excel column letter(s)
 * 1 = A, 26 = Z, 27 = AA, etc.
 */
function getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
        columnNumber--; // Adjust for 0-based indexing
        result = String.fromCharCode(65 + (columnNumber % 26)) + result;
        columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
}

/**
 * Calculates optimal range string for the data
 */
function calculateDataRange(sheetName: string, headerOrder: string[]): string {
    // Calculate the end column based on number of headers
    const endColumn = getColumnLetter(headerOrder.length);

    // Use open range for flexibility
    return `'${sheetName}'!A:${endColumn}`;
}

/**
 * Convert array of objects to 2D array rows using specified header order
 * This ensures consistent column structure even when data objects have different keys
 */
function convertDataToRowsWithOrder<T extends Record<string, any>>(
    data: T[],
    headerOrder: string[],
    transformFunctions: Record<string, (value: any) => any> = {}
): any[][] {
    return data.map(item => {
        return headerOrder.map(header => {
            let value = item[header] ?? '';

            // Apply transformation if provided
            if (transformFunctions[header]) {
                value = transformFunctions[header](value);
            }

            return value;
        });
    });
}

/**
 * Saves an array of objects to a Google Sheet by automatically mapping object keys to column headers
 *
 * @param sheetName - The name of the sheet to save data to
 * @param data - Array of objects where keys correspond to column headers
 * @param headerOrder - Array of string where values correspond to column headers
 * @param options - Configuration options including required headerOrder
 *
 * @example
 * ```typescript
 * const data = [
 *   { Name: "pete", "post code": "GU30 7hq", age: 25 },
 *   { Name: "jane", age: 30 } // Missing "post code" - will be empty
 * ];
 *
 * await _saveDataToSheet(
 *   'People',
 *   data,
 *    ['Name', 'post code', 'age'],
 *   {
 *     mode: 'append',
 *     createHeaders: true
 *   }
 * );
 * ```
 */
async function _saveDataToSheet<T extends Record<string, any>>(
    sheetName: string,
    data: T[],
    headerOrder: string[],
    options: SaveDataOptions
): Promise<{
    success: boolean;
    rowsWritten: number;
    missingHeaders: string[];
    message: string;
}> {
    try {
        if (!data || data.length === 0) {
            return {
                success: true,
                rowsWritten: 0,
                missingHeaders: [],
                message: 'No data provided to save'
            };
        }

        if (!SPREADSHEET_ID) {
            throw createAppError(
                'MISSING_SPREADSHEET_ID',
                'GOOGLE_SHEETS_ID environment variable is not set',
                {}
            );
        }

        const {
            createHeaders = true,
            mode = 'append',
            transformFunctions = {},
            requireAllHeaders = false,
            ...writeOptions
        } = options;

        if (!headerOrder || headerOrder.length === 0) {
            throw createAppError(
                'MISSING_HEADER_ORDER',
                'headerOrder is required and must contain at least one header',
                { providedOptions: options }
            );
        }

        // Calculate the range based on header order
        const range = calculateDataRange(sheetName, headerOrder);
        const sheetRange: SheetRange = { spreadsheetId: SPREADSHEET_ID, range };

        // Create header mapping from header order
        const headerMapping = headerOrder.reduce((acc, key) => {
            acc[key] = key as keyof T;
            return acc;
        }, {} as Record<string, keyof T>);

        let existingHeaders: string[] = [];
        let sheetIsEmpty = false;

        try {
            const { headers, data: existingData } = await readSheetWithHeaders({
                ...sheetRange,
                range: `'${sheetName}'!1:1000` // Read reasonable range to check if empty
            });

            existingHeaders = headers;
            sheetIsEmpty = headers.length === 0 && existingData.length === 0;
        } catch (error) {
            // If reading fails, assume sheet is empty or doesn't exist
            sheetIsEmpty = true;
        }

        let missingHeaders: string[] = [];

        if (sheetIsEmpty && createHeaders) {
            // Create new sheet with headers from headerOrder
            const headerRow = [headerOrder];
            const dataRows = convertDataToRowsWithOrder(data, headerOrder, transformFunctions);

            await writeSheetRange(sheetRange, [...headerRow, ...dataRows], writeOptions);

            return {
                success: true,
                rowsWritten: data.length,
                missingHeaders: [],
                message: `Created new sheet with ${headerOrder.length} headers and saved ${data.length} rows`
            };
        }

        if (existingHeaders.length === 0 && !createHeaders) {
            throw createAppError(
                'NO_HEADERS_ERROR',
                'Sheet has no headers and createHeaders is disabled. Cannot determine column mapping.',
                { headerOrder, sheetRange }
            );
        }

        // Map headers from headerOrder to existing headers
        const { mapping, missing } = createHeaderMappingFromActual(
            existingHeaders,
            headerMapping
        );

        missingHeaders = missing;

        if (requireAllHeaders && missingHeaders.length > 0) {
            throw createAppError(
                'MISSING_HEADERS_ERROR',
                `Required headers not found in sheet: ${missingHeaders.join(', ')}`,
                { missingHeaders, existingHeaders, headerOrder }
            );
        }

        // Convert data to rows using headerOrder for consistent column structure
        const rows = convertDataToRowsWithOrder(data, headerOrder, transformFunctions);

        // Save data based on mode
        if (mode === 'append') {
            await appendToSheet(sheetRange, rows, writeOptions);
        } else {
            // For overwrite mode, include headers
            const headerRow = [headerOrder];
            await writeSheetRange(sheetRange, [...headerRow, ...rows], writeOptions);
        }

        const warningMessage = missingHeaders.length > 0
            ? ` Warning: ${missingHeaders.length} headers had no matching columns and were skipped.`
            : '';

        return {
            success: true,
            rowsWritten: data.length,
            missingHeaders,
            message: `Successfully saved ${data.length} rows to sheet.${warningMessage}`
        };

    } catch (error) {
        throw createAppError(
            'SAVE_DATA_ERROR',
            `Failed to save data to sheet: ${sheetName}`,
            error
        );
    }
}

/**
 * Enhanced version that can auto-detect and create missing headers
 */
export async function saveDataToSheet<T extends Record<string, any>>(
    sheetName: string,
    data: T[],
    headerOrder: string[],
    options: SaveDataOptions & {
        /** Whether to add missing headers as new columns */
        addMissingHeaders?: boolean;
    } = { }
): Promise<{
    success: boolean;
    rowsWritten: number;
    headersAdded: string[];
    missingHeaders: string[];
    message: string;
}> {
    try {
        if (!data || data.length === 0) {
            return {
                success: true,
                rowsWritten: 0,
                headersAdded: [],
                missingHeaders: [],
                message: 'No data provided to save'
            };
        }

        const {
            addMissingHeaders = false,
            transformFunctions = {},
            ...saveOptions
        } = options;

        if (!headerOrder || headerOrder.length === 0) {
            throw createAppError(
                'MISSING_HEADER_ORDER',
                'headerOrder is required and must contain at least one header',
                { providedOptions: options }
            );
        }

        // Try initial save
        const initialResult = await _saveDataToSheet(sheetName, data, headerOrder, {
            ...saveOptions,
            requireAllHeaders: false
        });

        // If we have missing headers and should add them
        if (addMissingHeaders && initialResult.missingHeaders.length > 0) {
            const range = calculateDataRange(sheetName, headerOrder);
            const sheetRange: SheetRange = { spreadsheetId: SPREADSHEET_ID, range };

            // Read current headers
            const { headers: currentHeaders } = await readSheetWithHeaders({
                ...sheetRange,
                range: `'${sheetName}'!1:1`
            });

            // The missing headers should be added in the order they appear in headerOrder
            const orderedMissingHeaders = headerOrder.filter(h =>
                initialResult.missingHeaders.includes(h)
            );

            const newHeaders = [...currentHeaders, ...orderedMissingHeaders];

            // Update the sheet with new headers (this will require reading all data and rewriting)
            const { data: existingData } = await readSheetWithHeaders({
                ...sheetRange,
                range: `'${sheetName}'!A:Z`
            });

            // Convert data using headerOrder for consistent structure
            const rows = convertDataToRowsWithOrder(data, headerOrder, transformFunctions);

            // Write headers and data
            const headerRow = [newHeaders];
            await writeSheetRange(sheetRange, [...headerRow, ...rows], saveOptions);

            return {
                success: true,
                rowsWritten: data.length,
                headersAdded: orderedMissingHeaders,
                missingHeaders: [],
                message: `Added ${orderedMissingHeaders.length} new headers and saved ${data.length} rows`
            };
        }

        return {
            success: initialResult.success,
            rowsWritten: initialResult.rowsWritten,
            headersAdded: [],
            missingHeaders: initialResult.missingHeaders,
            message: initialResult.message
        };

    } catch (error) {
        throw createAppError(
            'SAVE_DATA_SMART_ERROR',
            `Failed to smart save data to sheet: ${sheetName}`,
            error
        );
    }
}
