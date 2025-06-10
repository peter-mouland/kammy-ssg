import {
    type SheetReadOptions,
    type SheetRange,
    createAppError,
    readSheetWithHeaders,
    parseHeaderBasedData,
    SPREADSHEET_ID
} from './common';

export interface ReadDataOptions extends SheetReadOptions {
    /** Required: Ordered list of expected headers for consistent column mapping */
    headerOrder: string[];
    /** Custom transformations for specific object keys */
    transformFunctions?: Record<string, (value: any) => any>;
    /** Whether to require all headers to be present */
    requireAllHeaders?: boolean;
    /** Whether to warn about missing headers */
    warnMissingHeaders?: boolean;
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
 * Calculate optimal range for reading data based on expected headers
 */
function calculateReadRange(sheetName: string, headerOrder: string[]): string {
    const endColumn = getColumnLetter(headerOrder.length);
    // Use open range to read all rows
    return `'${sheetName}'!A:${endColumn}`;
}

/**
 * Reads data from a Google Sheet by automatically mapping column headers to object properties
 *
 * @param sheetName - The name of the sheet to read from
 * @param options - Configuration options including required headerOrder
 *
 * @example
 * ```typescript
 * const data = await readDataFromSheet<PersonData>('People', {
 *   headerOrder: ['Name', 'post code', 'age'],
 *   transformFunctions: {
 *     age: (value) => parseInt(value) || 0,
 *     'post code': (value) => value?.toUpperCase() || ''
 *   }
 * });
 *
 * // Returns: PersonData[] with proper typing
 * ```
 */
async function _readDataFromSheet<T extends Record<string, any>>(
    sheetName: string,
    options: ReadDataOptions
): Promise<{
    data: T[];
    headers: string[];
    missingHeaders: string[];
    extraHeaders: string[];
    message: string;
}> {
    try {
        if (!SPREADSHEET_ID) {
            throw createAppError(
                'MISSING_SPREADSHEET_ID',
                'GOOGLE_SHEETS_ID environment variable is not set',
                {}
            );
        }

        const {
            headerOrder,
            transformFunctions = {},
            requireAllHeaders = false,
            warnMissingHeaders = true,
            ...readOptions
        } = options;

        if (!headerOrder || headerOrder.length === 0) {
            throw createAppError(
                'MISSING_HEADER_ORDER',
                'headerOrder is required and must contain at least one header',
                { providedOptions: options }
            );
        }

        // Calculate the range based on header order
        const range = calculateReadRange(sheetName, headerOrder);
        const sheetRange: SheetRange = { spreadsheetId: SPREADSHEET_ID, range };

        // Read the sheet data with headers
        const { headers, data: rawData } = await readSheetWithHeaders(sheetRange, readOptions);

        if (headers.length === 0) {
            return {
                data: [],
                headers: [],
                missingHeaders: headerOrder,
                extraHeaders: [],
                message: 'Sheet is empty or has no headers'
            };
        }

        // Create header mapping from headerOrder
        const headerMapping = headerOrder.reduce((acc, header) => {
            acc[header] = header as keyof T;
            return acc;
        }, {} as Record<string, keyof T>);

        // Check which headers are missing and which are extra
        const normalizedActualHeaders = headers.map(h => h.toLowerCase().trim());
        const normalizedExpectedHeaders = headerOrder.map(h => h.toLowerCase().trim());

        const missingHeaders = headerOrder.filter(expected => {
            const normalized = expected.toLowerCase().trim();
            return !normalizedActualHeaders.some(actual =>
                actual === normalized ||
                actual.includes(normalized) ||
                normalized.includes(actual)
            );
        });

        const extraHeaders = headers.filter(actual => {
            const normalized = actual.toLowerCase().trim();
            return !normalizedExpectedHeaders.some(expected =>
                expected === normalized ||
                expected.includes(normalized) ||
                normalized.includes(expected)
            );
        });

        if (requireAllHeaders && missingHeaders.length > 0) {
            throw createAppError(
                'MISSING_REQUIRED_HEADERS',
                `Required headers not found in sheet: ${missingHeaders.join(', ')}`,
                { missingHeaders, actualHeaders: headers, expectedHeaders: headerOrder }
            );
        }

        // Parse the data using the header mapping
        const parsedData = parseHeaderBasedData<T>(
            [headers, ...rawData], // Include headers row for parseHeaderBasedData
            headerMapping,
            transformFunctions as Partial<Record<keyof T, (value: any) => any>>
        );

        // Create message
        let message = `Successfully read ${parsedData.length} rows from sheet`;
        if (missingHeaders.length > 0 && warnMissingHeaders) {
            message += `. Warning: ${missingHeaders.length} expected headers not found: ${missingHeaders.join(', ')}`;
        }
        if (extraHeaders.length > 0) {
            message += `. Note: ${extraHeaders.length} extra headers found in sheet`;
        }

        return {
            data: parsedData,
            headers,
            missingHeaders,
            extraHeaders,
            message
        };

    } catch (error) {
        throw createAppError(
            'READ_DATA_ERROR',
            `Failed to read data from sheet: ${sheetName}`,
            error
        );
    }
}

/**
 * Simple version that just returns the data array (most common use case)
 */
export async function readDataFromSheet<T extends Record<string, any>>(
    sheetName: string,
    options: ReadDataOptions
): Promise<T[]> {
    const result = await _readDataFromSheet<T>(sheetName, options);

    if (options.warnMissingHeaders !== false && result.missingHeaders.length > 0) {
        console.warn(`Sheet '${sheetName}' missing expected headers:`, result.missingHeaders);
    }

    return result.data;
}

/**
 * Read data with automatic header detection (for when you don't know the exact headers)
 */
export async function readDataFromSheetWithHeaders<T extends Record<string, any>>(
    sheetName: string,
    options: Omit<ReadDataOptions, 'headerOrder'> & {
        /** Optional: Expected headers, but will work with whatever is found */
        expectedHeaders?: string[];
    } = {}
): Promise<{
    data: T[];
    headers: string[];
    message: string;
}> {
    try {
        if (!SPREADSHEET_ID) {
            throw createAppError(
                'MISSING_SPREADSHEET_ID',
                'GOOGLE_SHEETS_ID environment variable is not set',
                {}
            );
        }

        const {
            expectedHeaders = [],
            transformFunctions = {},
            ...readOptions
        } = options;

        // Use a wide range to discover all headers
        const range = `'${sheetName}'!A:ZZ`;
        const sheetRange: SheetRange = { spreadsheetId: SPREADSHEET_ID, range };

        // Read the sheet data with headers
        const { headers, data: rawData } = await readSheetWithHeaders(sheetRange, readOptions);

        if (headers.length === 0) {
            return {
                data: [],
                headers: [],
                message: 'Sheet is empty or has no headers'
            };
        }

        // Create header mapping from actual headers found
        const headerMapping = headers.reduce((acc, header) => {
            acc[header] = header as keyof T;
            return acc;
        }, {} as Record<string, keyof T>);

        // Parse the data using the discovered headers
        const parsedData = parseHeaderBasedData<T>(
            [headers, ...rawData], // Include headers row for parseHeaderBasedData
            headerMapping,
            transformFunctions as Partial<Record<keyof T, (value: any) => any>>
        );

        let message = `Successfully read ${parsedData.length} rows with ${headers.length} columns from sheet`;

        if (expectedHeaders.length > 0) {
            const foundExpected = expectedHeaders.filter(expected =>
                headers.some(actual =>
                    actual.toLowerCase().trim() === expected.toLowerCase().trim()
                )
            );
            message += `. Found ${foundExpected.length}/${expectedHeaders.length} expected headers`;
        }

        return {
            data: parsedData,
            headers,
            message
        };

    } catch (error) {
        throw createAppError(
            'READ_DATA_AUTO_ERROR',
            `Failed to auto-read data from sheet: ${sheetName}`,
            error
        );
    }
}
