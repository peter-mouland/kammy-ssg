import { google } from 'googleapis';
import type { AppError } from '../../../types';

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export interface SheetsCredentials {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

export interface SheetRange {
    spreadsheetId: string;
    range: string;
}

export interface SheetReadOptions {
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
    majorDimension?: 'ROWS' | 'COLUMNS';
}

export interface SheetWriteOptions {
    valueInputOption?: 'RAW' | 'USER_ENTERED';
    insertDataOption?: 'OVERWRITE' | 'INSERT_ROWS';
    includeValuesInResponse?: boolean;
    responseValueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    responseDateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
}


// Initialize Google Sheets API client
export async function createSheetsClient() {
    try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
        }

        if (!SPREADSHEET_ID) {
            throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
        }

        let credentials;
        try {
            const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
            const decodedCredentials = atob(credentialsString);
            credentials = JSON.parse(decodedCredentials);

            if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
                throw new Error('Invalid service account credentials - missing required fields');
            }

        } catch (parseError) {
            console.error('Failed to parse service account credentials:', parseError);
            throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Ensure it\'s base64 encoded JSON.');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: credentials.type,
                project_id: credentials.project_id,
                private_key_id: credentials.private_key_id,
                private_key: credentials.private_key,
                client_email: credentials.client_email,
                client_id: credentials.client_id,
                auth_uri: credentials.auth_uri || 'https://accounts.google.com/o/oauth2/auth',
                token_uri: credentials.token_uri || 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: credentials.auth_provider_x509_cert_url || 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: credentials.client_x509_cert_url,
            },
            scopes: SCOPES,
        });

        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });

        return sheets;
    } catch (error) {
        console.error('Failed to initialize Google Sheets client:', error);
        throw error;
    }
}

// Test connection function
export async function testConnection(): Promise<{ success: boolean; message: string }> {
    try {
        const sheets = await createSheetsClient();

        const response = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        return {
            success: true,
            message: `Connected successfully to spreadsheet: ${response.data.properties?.title || 'Unknown'}`
        };
    } catch (error) {
        return {
            success: false,
            message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Create standardized application error
 */
export function createAppError(code: string, message: string, details?: unknown): AppError {
    return {
        code,
        message,
        details,
        timestamp: new Date()
    };
}

/**
 * Read data from a Google Sheet range
 */
export async function readSheetRange(
    sheetRange: SheetRange,
    options: SheetReadOptions = {}
): Promise<any[][]> {
    try {
        const sheetsClient = await createSheetsClient();
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: sheetRange.spreadsheetId,
            range: sheetRange.range,
            valueRenderOption: options.valueRenderOption || 'UNFORMATTED_VALUE',
            dateTimeRenderOption: options.dateTimeRenderOption || 'FORMATTED_STRING',
            majorDimension: options.majorDimension || 'ROWS'
        });

        return response.data.values || [];
    } catch (error) {
        throw createAppError(
            'SHEET_READ_ERROR',
            `Failed to read sheet range: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Write data to a Google Sheet range
 */
export async function writeSheetRange(
    sheetRange: SheetRange,
    values: any[][],
    options: SheetWriteOptions = {}
): Promise<void> {
    try {
        const sheetsClient = await createSheetsClient();
        await sheetsClient.spreadsheets.values.update({
            spreadsheetId: sheetRange.spreadsheetId,
            range: sheetRange.range,
            valueInputOption: options.valueInputOption || 'RAW',
            includeValuesInResponse: options.includeValuesInResponse || false,
            responseValueRenderOption: options.responseValueRenderOption || 'FORMATTED_VALUE',
            responseDateTimeRenderOption: options.responseDateTimeRenderOption || 'FORMATTED_STRING',
            requestBody: {
                values,
                majorDimension: 'ROWS'
            }
        });
    } catch (error) {
        throw createAppError(
            'SHEET_WRITE_ERROR',
            `Failed to write to sheet range: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Append data to a Google Sheet
 */
export async function appendToSheet(
    sheetRange: SheetRange,
    values: any[][],
    options: SheetWriteOptions = {}
): Promise<void> {
    try {
        const sheetsClient = await createSheetsClient();
        await sheetsClient.spreadsheets.values.append({
            spreadsheetId: sheetRange.spreadsheetId,
            range: sheetRange.range,
            valueInputOption: options.valueInputOption || 'RAW',
            insertDataOption: options.insertDataOption || 'INSERT_ROWS',
            includeValuesInResponse: options.includeValuesInResponse || false,
            responseValueRenderOption: options.responseValueRenderOption || 'FORMATTED_VALUE',
            responseDateTimeRenderOption: options.responseDateTimeRenderOption || 'FORMATTED_STRING',
            requestBody: {
                values,
                majorDimension: 'ROWS'
            }
        });
    } catch (error) {
        throw createAppError(
            'SHEET_APPEND_ERROR',
            `Failed to append to sheet range: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Parse header-based sheet data into objects
 */
export function parseHeaderBasedData<T>(
    rawData: any[][],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>
): T[] {
    if (rawData.length === 0) return [];

    const headers = rawData[0];
    const dataRows = rawData.slice(1);

    // Create header index mapping
    const headerIndexMap = new Map<string, number>();
    headers.forEach((header, index) => {
        const normalizedHeader = normalizeHeaderName(header);
        headerIndexMap.set(normalizedHeader, index);
    });

    return dataRows.map(row => {
        const item = {} as T;

        Object.entries(headerMapping).forEach(([headerKey, objectKey]) => {
            const normalizedKey = normalizeHeaderName(headerKey);
            const columnIndex = headerIndexMap.get(normalizedKey);

            if (columnIndex !== undefined && columnIndex < row.length) {
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
}

/**
 * Convert objects to sheet rows using header mapping
 */
export function convertToSheetRows<T>(
    data: T[],
    headerMapping: Record<string, keyof T>,
    includeHeaders = true
): any[][] {
    const headers = Object.keys(headerMapping);
    const rows: any[][] = [];

    if (includeHeaders) {
        rows.push(headers);
    }

    data.forEach(item => {
        const row = headers.map(header => {
            const objectKey = headerMapping[header];
            return item[objectKey] ?? '';
        });
        rows.push(row);
    });

    return rows;
}

/**
 * Normalize header names for consistent matching
 */
export function normalizeHeaderName(header: string): string {
    return header
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Find column index by header name (case-insensitive)
 */
export function findColumnIndex(headers: string[], searchHeader: string): number {
    const normalizedSearch = normalizeHeaderName(searchHeader);
    return headers.findIndex(header =>
        normalizeHeaderName(header) === normalizedSearch
    );
}

/**
 * Validate sheet structure has required headers
 */
export function validateSheetHeaders(
    actualHeaders: string[],
    requiredHeaders: string[]
): { isValid: boolean; missingHeaders: string[] } {
    const normalizedActual = actualHeaders.map(normalizeHeaderName);
    const missingHeaders: string[] = [];

    requiredHeaders.forEach(required => {
        const normalizedRequired = normalizeHeaderName(required);
        if (!normalizedActual.includes(normalizedRequired)) {
            missingHeaders.push(required);
        }
    });

    return {
        isValid: missingHeaders.length === 0,
        missingHeaders
    };
}

/**
 * Safe date parsing for sheet values
 */
export function parseSheetDate(value: any): Date | null {
    if (!value) return null;

    // Handle different date formats
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof value === 'number') {
        // Handle Excel serial date numbers
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    }

    return null;
}

/**
 * Safe number parsing for sheet values
 */
export function parseSheetNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

/**
 * Safe boolean parsing for sheet values
 */
export function parseSheetBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === 'yes' || lower === '1';
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    return false;
}

/**
 * Get sheet range string for data operations
 */
export function getSheetRangeString(
    sheetName: string,
    startRow = 1,
    startCol = 'A',
    endRow?: number,
    endCol?: string
): string {
    let range = `'${sheetName}'!${startCol}${startRow}`;

    if (endRow && endCol) {
        range += `:${endCol}${endRow}`;
    }

    return range;
}

/**
 * Batch multiple sheet operations
 */
export async function batchSheetOperations(
    spreadsheetId: string,
    operations: Array<{
        range: string;
        values: any[][];
        operation: 'update' | 'append';
        options?: SheetWriteOptions;
    }>
): Promise<void> {
    try {
        // Execute operations sequentially to avoid conflicts
        for (const op of operations) {
            const sheetRange = { spreadsheetId, range: op.range };

            if (op.operation === 'update') {
                await writeSheetRange(sheetRange, op.values, op.options);
            } else {
                await appendToSheet(sheetRange, op.values, op.options);
            }
        }
    } catch (error) {
        throw createAppError(
            'BATCH_OPERATION_ERROR',
            'Failed to execute batch sheet operations',
            error
        );
    }
}

/**
 * Read headers from a sheet to create dynamic mapping
 */
export async function readSheetHeaders(
    sheetRange: SheetRange
): Promise<string[]> {
    try {
        const sheetsClient = await createSheetsClient();
        const headerRange = {
            ...sheetRange,
            range: sheetRange.range.split('!')[0] + '!1:1' // Get only first row
        };

        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: headerRange.spreadsheetId,
            range: headerRange.range,
            valueRenderOption: 'UNFORMATTED_VALUE'
        });

        return response.data.values?.[0] || [];
    } catch (error) {
        throw createAppError(
            'SHEET_HEADERS_READ_ERROR',
            `Failed to read headers from sheet: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Create a mapping from object keys to column indices based on actual sheet headers
 */
export function createHeaderMapping<T>(
    actualHeaders: string[],
    headerMapping: Record<string, keyof T>
): Map<keyof T, number> {
    const mapping = new Map<keyof T, number>();

    Object.entries(headerMapping).forEach(([headerText, objectKey]) => {
        const columnIndex = actualHeaders.findIndex(header =>
            normalizeHeaderName(header) === normalizeHeaderName(headerText)
        );

        if (columnIndex >= 0) {
            mapping.set(objectKey, columnIndex);
        } else {
            console.warn(`Header "${headerText}" not found in sheet. Available headers:`, actualHeaders);
        }
    });

    return mapping;
}

/**
 * Convert objects to sheet rows using dynamic header mapping
 */
export function convertToSheetRowsWithMapping<T>(
    data: T[],
    actualHeaders: string[],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>
): any[][] {
    const columnMapping = createHeaderMapping(actualHeaders, headerMapping);

    return data.map(item => {
        // Create array with same length as headers, filled with empty strings
        const row = new Array(actualHeaders.length).fill('');

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
 * Smart append that handles header mapping automatically
 */
export async function smartAppendToSheet<T>(
    sheetRange: SheetRange,
    data: T[],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>,
    options: SheetWriteOptions = {}
): Promise<void> {
    try {
        // Read current headers from sheet
        const actualHeaders = await readSheetHeaders(sheetRange);

        if (actualHeaders.length === 0) {
            throw new Error('No headers found in sheet. Please ensure the sheet has a header row.');
        }

        // Convert data to rows using actual header positions
        const rows = convertToSheetRowsWithMapping(
            data,
            actualHeaders,
            headerMapping,
            transformFunctions
        );

        // Append the rows
        await appendToSheet(sheetRange, rows, options);

    } catch (error) {
        throw createAppError(
            'SMART_APPEND_ERROR',
            `Failed to smart append to sheet: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Smart update that handles header mapping automatically
 */
export async function smartUpdateSheet<T>(
    sheetRange: SheetRange,
    data: T[],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>,
    includeHeaders = true,
    options: SheetWriteOptions = {}
): Promise<void> {
    try {
        let rows: any[][];

        if (includeHeaders) {
            // Use the header mapping keys as headers
            const headers = Object.keys(headerMapping);
            const dataRows = convertToSheetRows(data, headerMapping, false);
            rows = [headers, ...dataRows];
        } else {
            // Read existing headers and map data accordingly
            const actualHeaders = await readSheetHeaders(sheetRange);
            rows = convertToSheetRowsWithMapping(
                data,
                actualHeaders,
                headerMapping,
                transformFunctions
            );
        }

        await writeSheetRange(sheetRange, rows, options);

    } catch (error) {
        throw createAppError(
            'SMART_UPDATE_ERROR',
            `Failed to smart update sheet: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Validate that required headers exist in the sheet
 */
export async function validateRequiredHeaders<T>(
    sheetRange: SheetRange,
    headerMapping: Record<string, keyof T>,
    requiredKeys?: (keyof T)[]
): Promise<{ isValid: boolean; missingHeaders: string[]; extraHeaders: string[] }> {
    try {
        const actualHeaders = await readSheetHeaders(sheetRange);
        const expectedHeaders = Object.keys(headerMapping);
        const normalizedActual = actualHeaders.map(normalizeHeaderName);
        const normalizedExpected = expectedHeaders.map(normalizeHeaderName);

        const missingHeaders = expectedHeaders.filter(header =>
            !normalizedActual.includes(normalizeHeaderName(header))
        );

        const extraHeaders = actualHeaders.filter(header =>
            !normalizedExpected.includes(normalizeHeaderName(header))
        );

        // If specific keys are required, check only those
        const requiredHeaders = requiredKeys
            ? Object.entries(headerMapping)
                .filter(([_, key]) => requiredKeys.includes(key))
                .map(([header, _]) => header)
            : expectedHeaders;

        const missingRequired = requiredHeaders.filter(header =>
            !normalizedActual.includes(normalizeHeaderName(header))
        );

        return {
            isValid: missingRequired.length === 0,
            missingHeaders: missingRequired,
            extraHeaders
        };
    } catch (error) {
        throw createAppError(
            'HEADER_VALIDATION_ERROR',
            `Failed to validate headers for sheet: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Get safe column range that includes all mapped columns
 */
export function getSafeColumnRange<T>(
    sheetName: string,
    headerMapping: Record<string, keyof T>,
    actualHeaders: string[]
): string {
    const mappedIndices = Object.keys(headerMapping)
        .map(headerText =>
            actualHeaders.findIndex(header =>
                normalizeHeaderName(header) === normalizeHeaderName(headerText)
            )
        )
        .filter(index => index >= 0);

    if (mappedIndices.length === 0) {
        return `'${sheetName}'!A:A`; // Fallback to column A
    }

    const maxIndex = Math.max(...mappedIndices);
    const maxColumn = String.fromCharCode(65 + maxIndex); // Convert to letter (A, B, C, etc.)

    return `'${sheetName}'!A:${maxColumn}`;
}


/**
 * Read sheet data and extract headers in one call
 */
export async function readSheetWithHeaders(
    sheetRange: SheetRange,
    options: SheetReadOptions = {}
): Promise<{ headers: string[]; data: any[][]; rawData: any[][] }> {
    try {
        const sheetsClient = await createSheetsClient();
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: sheetRange.spreadsheetId,
            range: sheetRange.range,
            valueRenderOption: options.valueRenderOption || 'UNFORMATTED_VALUE',
            dateTimeRenderOption: options.dateTimeRenderOption || 'FORMATTED_STRING',
            majorDimension: options.majorDimension || 'ROWS'
        });

        const rawData = response.data.values || [];
        const headers = rawData.length > 0 ? rawData[0] : [];
        const data = rawData.slice(1);

        return { headers, data, rawData };
    } catch (error) {
        throw createAppError(
            'SHEET_READ_WITH_HEADERS_ERROR',
            `Failed to read sheet with headers: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Create header-to-column mapping from actual sheet headers
 */
export function createHeaderMappingFromActual<T>(
    actualHeaders: string[],
    expectedHeaderMapping: Record<string, keyof T>
): { mapping: Map<keyof T, number>; missing: string[]; found: string[] } {
    const mapping = new Map<keyof T, number>();
    const missing: string[] = [];
    const found: string[] = [];

    Object.entries(expectedHeaderMapping).forEach(([headerText, objectKey]) => {
        const columnIndex = actualHeaders.findIndex(header =>
            normalizeHeaderName(header) === normalizeHeaderName(headerText)
        );

        if (columnIndex >= 0) {
            mapping.set(objectKey, columnIndex);
            found.push(headerText);
        } else {
            missing.push(headerText);
        }
    });

    return { mapping, missing, found };
}

/**
 * Parse sheet data using dynamic header mapping - single API call
 */
export function parseSheetDataWithMapping<T>(
    headers: string[],
    dataRows: any[][],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>
): { data: T[]; mapping: Map<keyof T, number>; missing: string[] } {
    const { mapping, missing } = createHeaderMappingFromActual(headers, headerMapping);

    const data = dataRows.map(row => {
        const item = {} as T;

        mapping.forEach((columnIndex, objectKey) => {
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

    return { data, mapping, missing };
}

/**
 * Convert objects to sheet rows using actual header positions - no API call needed
 */
export function convertToRowsWithActualHeaders<T>(
    data: T[],
    actualHeaders: string[],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>
): any[][] {
    const { mapping } = createHeaderMappingFromActual(actualHeaders, headerMapping);

    return data.map(item => {
        // Create array with same length as headers, filled with empty strings
        const row = new Array(actualHeaders.length).fill('');

        // Fill in values at correct positions
        mapping.forEach((columnIndex, objectKey) => {
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
 * Optimized smart append - single API call to read headers
 */
export async function optimizedSmartAppend<T>(
    sheetRange: SheetRange,
    data: T[],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>,
    options: SheetWriteOptions = {}
): Promise<void> {
    try {
        // Single API call to get headers and existing data
        const { headers } = await readSheetWithHeaders(sheetRange);

        if (headers.length === 0) {
            throw new Error('No headers found in sheet. Please ensure the sheet has a header row.');
        }

        // Convert data to rows using actual header positions
        const rows = convertToRowsWithActualHeaders(
            data,
            headers,
            headerMapping,
            transformFunctions
        );

        // Append the rows
        await appendToSheet(sheetRange, rows, options);

    } catch (error) {
        throw createAppError(
            'OPTIMIZED_SMART_APPEND_ERROR',
            `Failed to smart append to sheet: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Optimized read with header mapping - single API call
 */
export async function optimizedReadWithMapping<T>(
    sheetRange: SheetRange,
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>,
    options: SheetReadOptions = {}
): Promise<{ data: T[]; missing: string[]; headers: string[] }> {
    try {
        // Single API call to get everything
        const { headers, data: dataRows } = await readSheetWithHeaders(sheetRange, options);

        if (headers.length === 0) {
            return { data: [], missing: Object.keys(headerMapping), headers: [] };
        }

        // Parse data using header mapping
        const { data, missing } = parseSheetDataWithMapping(
            headers,
            dataRows,
            headerMapping,
            transformFunctions
        );

        return { data, missing, headers };

    } catch (error) {
        throw createAppError(
            'OPTIMIZED_READ_WITH_MAPPING_ERROR',
            `Failed to read sheet with mapping: ${sheetRange.range}`,
            error
        );
    }
}

/**
 * Cache headers to avoid repeated API calls within same request
 */
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
 * Get headers with caching to reduce API calls
 */
export async function getCachedSheetHeaders(sheetRange: SheetRange): Promise<string[]> {
    const cacheKey = `${sheetRange.spreadsheetId}:${sheetRange.range.split('!')[0]}`;

    // Check cache first
    const cachedHeaders = getCachedHeaders(cacheKey);
    if (cachedHeaders) {
        return cachedHeaders;
    }

    // Read from API and cache
    const { headers } = await readSheetWithHeaders({
        ...sheetRange,
        range: sheetRange.range.split('!')[0] + '!1:1'
    });

    setCachedHeaders(cacheKey, headers);
    return headers;
}
