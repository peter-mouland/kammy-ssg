/* Location: app/_shared/lib/sheets/utils/common.ts */

// The scoped `@googleapis/sheets` rather than the `googleapis` umbrella. Importing
// `{ google }` from the umbrella loads Google's ENTIRE API surface -- hundreds of clients
// -- to talk to one spreadsheet. Measured on this machine: ~650ms warm and ~1.7s cold,
// against ~78ms for the scoped package. That cost was paid on every Cloud Function cold
// start, and in tests it was the direct cause of the flaky suite (see vitest.setup.ts).
//
// `JWT` is taken from `@googleapis/sheets`'s own `auth` export, NOT from the
// `google-auth-library` in this workspace. They are different: this package resolves
// google-auth-library 10.5.0 through a nested copy, while `draft` depends on 9.15.1, so a
// JWT built from the workspace copy is not the class `sheets()` expects -- it fails to
// type-check and would be a version mismatch at runtime. Taking auth from the same package
// makes the versions match by construction.
import { auth as googleAuth, sheets, type sheets_v4 } from '@googleapis/sheets';
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

let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null;

type GaxiosLikeRequest = {
    method?: string;
    url?: string;
    data?: unknown;
    body?: unknown;
    headers?: Record<string, string>;
    responseType?: string;
    params?: Record<string, string | number | boolean | undefined>;
    [key: string]: unknown;
};

/**
 * gaxios/node-fetch is failing with ERR_STREAM_PREMATURE_CLOSE against Google APIs
 * in this environment. Native fetch (undici) works, so use that as the transporter.
 */
async function fetchTransporterRequest(opts: GaxiosLikeRequest) {
    const method = (opts.method || 'GET').toUpperCase();
    let url = opts.url || '';

    if (opts.params && Object.keys(opts.params).length > 0) {
        const qs = new URLSearchParams();
        for (const [key, value] of Object.entries(opts.params)) {
            if (value !== undefined && value !== null) {
                qs.set(key, String(value));
            }
        }
        url += (url.includes('?') ? '&' : '?') + qs.toString();
    }

    const headers = { ...(opts.headers || {}) };
    let body: BodyInit | undefined;

    if (opts.data !== undefined && opts.data !== null && method !== 'GET' && method !== 'HEAD') {
        if (typeof opts.data === 'string' || opts.data instanceof URLSearchParams) {
            body = opts.data as BodyInit;
            if (!headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        } else if (Buffer.isBuffer(opts.data)) {
            body = opts.data;
        } else {
            body = JSON.stringify(opts.data);
            if (!headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/json';
            }
        }
    } else if (opts.body !== undefined) {
        body = opts.body as BodyInit;
    }

    const response = await fetch(url, { method, headers, body });
    const contentType = response.headers.get('content-type') || '';
    let data: unknown;

    if (opts.responseType === 'stream') {
        data = response.body;
    } else if (contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        headersObj[key] = value;
    });

    const result = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: headersObj,
        config: opts,
        request: { responseURL: response.url },
    };

    if (!response.ok) {
        const error = new Error(
            `Request failed with status ${response.status}: ${
                typeof data === 'object' && data && 'error' in data
                    ? JSON.stringify((data as { error: unknown }).error)
                    : response.statusText
            }`,
        ) as Error & { response: typeof result; config: GaxiosLikeRequest; code?: number };
        error.response = result;
        error.config = opts;
        error.code = response.status;
        throw error;
    }

    return result;
}

function isRetryableAuthError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const err = error as {
        code?: string | number;
        message?: string;
        error?: { code?: string; message?: string };
        details?: { code?: string; message?: string; error?: { code?: string; message?: string } };
    };
    const candidates = [
        String(err.code ?? ''),
        err.message,
        err.error?.code,
        err.error?.message,
        err.details?.code,
        err.details?.message,
        err.details?.error?.code,
        err.details?.error?.message,
    ].filter(Boolean) as string[];

    return candidates.some(
        (value) =>
            value === 'ERR_STREAM_PREMATURE_CLOSE' ||
            value.includes('Premature close') ||
            value.includes('ECONNRESET') ||
            value.includes('socket hang up'),
    );
}

async function withRetry<T>(operation: () => Promise<T>, label: string, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!isRetryableAuthError(error) || attempt === attempts) {
                throw error;
            }
            const delayMs = 200 * attempt;
            console.warn(`⚠️ ${label} failed (attempt ${attempt}/${attempts}), retrying in ${delayMs}ms…`, error);
            sheetsClientPromise = null;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    throw lastError;
}

// Initialize Google Sheets API client (shared across requests to avoid OAuth stampedes)
async function createSheetsClient() {
    if (!sheetsClientPromise) {
        sheetsClientPromise = (async () => {
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
                    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Ensure it's base64 encoded JSON.");
                }

                const transporter = {
                    request: fetchTransporterRequest,
                };

                const auth = new googleAuth.JWT({
                    email: credentials.client_email,
                    key: credentials.private_key,
                    scopes: SCOPES,
                });

                // Prefer self-signed JWT access tokens (no token-endpoint round trip)
                auth.useJWTAccessWithScope = true;
                auth.transporter = transporter as typeof auth.transporter;

                return sheets({ version: 'v4', auth });
            } catch (error) {
                sheetsClientPromise = null;
                console.error('Failed to initialize Google Sheets client:', error);
                throw error;
            }
        })();
    }

    return sheetsClientPromise;
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
            message: `Connected successfully to spreadsheet: ${response.data.properties?.title || 'Unknown'}`,
        };
    } catch (error) {
        return {
            success: false,
            message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        timestamp: new Date(),
    };
}

/**
 * Read data from a Google Sheet range
 */
export async function readSheetRange(sheetRange: SheetRange, options: SheetReadOptions = {}): Promise<any[][]> {
    try {
        return await withRetry(async () => {
            const sheetsClient = await createSheetsClient();
            const response = await sheetsClient.spreadsheets.values.get({
                spreadsheetId: sheetRange.spreadsheetId,
                range: sheetRange.range,
                valueRenderOption: options.valueRenderOption || 'UNFORMATTED_VALUE',
                dateTimeRenderOption: options.dateTimeRenderOption || 'FORMATTED_STRING',
                majorDimension: options.majorDimension || 'ROWS',
            });

            return response.data.values || [];
        }, `readSheetRange(${sheetRange.range})`);
    } catch (error) {
        throw createAppError('SHEET_READ_ERROR', `Failed to read sheet range: ${sheetRange.range}`, error);
    }
}

/**
 * Write data to a Google Sheet range
 */
export async function writeSheetRange(
    sheetRange: SheetRange,
    values: any[][],
    options: SheetWriteOptions = {},
): Promise<void> {
    try {
        await withRetry(async () => {
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
                    majorDimension: 'ROWS',
                },
            });
        }, `writeSheetRange(${sheetRange.range})`);
    } catch (error) {
        throw createAppError('SHEET_WRITE_ERROR', `Failed to write to sheet range: ${sheetRange.range}`, error);
    }
}

/**
 * Append data to a Google Sheet
 */
export async function appendToSheet(
    sheetRange: SheetRange,
    values: any[][],
    options: SheetWriteOptions = {},
): Promise<void> {
    try {
        await withRetry(async () => {
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
                    majorDimension: 'ROWS',
                },
            });
        }, `appendToSheet(${sheetRange.range})`);
    } catch (error) {
        throw createAppError('SHEET_APPEND_ERROR', `Failed to append to sheet range: ${sheetRange.range}`, error);
    }
}

/**
 * Parse header-based sheet data into objects
 */
export function parseHeaderBasedData<T>(
    rawData: any[][],
    headerMapping: Record<string, keyof T>,
    transformFunctions?: Partial<Record<keyof T, (value: any) => any>>,
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

    return dataRows.map((row) => {
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
    includeHeaders = true,
): any[][] {
    const headers = Object.keys(headerMapping);
    const rows: any[][] = [];

    if (includeHeaders) {
        rows.push(headers);
    }

    data.forEach((item) => {
        const row = headers.map((header) => {
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
function normalizeHeaderName(header: string): string {
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
        return Number.isNaN(parsed.getTime()) ? null : parsed;
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
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
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
    options: SheetReadOptions = {},
): Promise<{ headers: string[]; data: any[][]; rawData: any[][] }> {
    try {
        return await withRetry(async () => {
            const sheetsClient = await createSheetsClient();
            const response = await sheetsClient.spreadsheets.values.get({
                spreadsheetId: sheetRange.spreadsheetId,
                range: sheetRange.range,
                valueRenderOption: options.valueRenderOption || 'UNFORMATTED_VALUE',
                dateTimeRenderOption: options.dateTimeRenderOption || 'FORMATTED_STRING',
                majorDimension: options.majorDimension || 'ROWS',
            });

            const rawData = response.data.values || [];
            const headers = rawData.length > 0 ? rawData[0] : [];
            const data = rawData.slice(1);

            return { headers, data, rawData };
        }, `readSheetWithHeaders(${sheetRange.range})`);
    } catch (error) {
        throw createAppError(
            'SHEET_READ_WITH_HEADERS_ERROR',
            `Failed to read sheet with headers: ${sheetRange.range}`,
            error,
        );
    }
}

/**
 * Create header-to-column mapping from actual sheet headers
 */
export function createHeaderMappingFromActual<T>(
    actualHeaders: string[],
    expectedHeaderMapping: Record<string, keyof T>,
): { mapping: Map<keyof T, number>; missing: string[]; found: string[] } {
    const mapping = new Map<keyof T, number>();
    const missing: string[] = [];
    const found: string[] = [];

    Object.entries(expectedHeaderMapping).forEach(([headerText, objectKey]) => {
        const columnIndex = actualHeaders.findIndex(
            (header) => normalizeHeaderName(header) === normalizeHeaderName(headerText),
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
