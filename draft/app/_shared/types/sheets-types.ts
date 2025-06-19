// app/_shared/types/sheets-types.ts

/**
 * Sheet-related types that are used across multiple domains
 */

export interface SheetReadOptions {
    // Base options for sheet reading operations
}

export interface SheetRange {
    spreadsheetId: string;
    range: string;
}

export interface ReadDataOptions extends SheetReadOptions {
    /** Required: Ordered list of expected headers for consistent column mapping */
    headerOrder: string[];
    /** Custom transformations for specific object keys */
    transformFunctions?: Record<string, (value: unknown) => unknown>; // FIXED: was 'any'
    /** Whether to require all headers to be present */
    requireAllHeaders?: boolean;
    /** Whether to warn about missing headers */
    warnMissingHeaders?: boolean;
}

export interface SheetConfig {
    spreadsheetId: string;
    sheetName: string;
    range?: string;
    headers: string[];
}
