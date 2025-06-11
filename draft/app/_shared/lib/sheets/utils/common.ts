import { google } from 'googleapis';
import type { AppError } from '../../../types';

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID as string;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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
