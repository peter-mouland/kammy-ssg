import type { DivisionData } from '../../types';
import {
    readSheetRange,
    writeSheetRange,
    appendToSheet,
    parseHeaderBasedData,
    convertToSheetRows,
    parseSheetNumber,
    createAppError,
    type SheetRange
} from './utils/common';

// Sheet configuration
const DIVISIONS_SHEET_NAME = 'Divisions';
const DIVISIONS_HEADERS = {
    'ID': 'id' as keyof DivisionData,
    'Label': 'label' as keyof DivisionData,
    'Order': 'order' as keyof DivisionData
};

// Transform functions for parsing
const DIVISIONS_TRANSFORM_FUNCTIONS: Partial<Record<keyof DivisionData, (value: any) => any>> = {
    order: parseSheetNumber
};

/**
 * Read all divisions from the sheet
 */
export async function readDivisions(): Promise<DivisionData[]> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

    try {
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DIVISIONS_SHEET_NAME}'!A:C`
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<DivisionData>(
            rawData,
            DIVISIONS_HEADERS,
            DIVISIONS_TRANSFORM_FUNCTIONS
        );
    } catch (error) {
        throw createAppError(
            'DIVISIONS_READ_ERROR',
            'Failed to read divisions from sheet',
            error
        );
    }
}

/**
 * Write divisions to the sheet (overwrites existing data)
 */
export async function writeDivisions(
    divisions: DivisionData[]
): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRows = convertToSheetRows(divisions, DIVISIONS_HEADERS, true);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DIVISIONS_SHEET_NAME}'!A:C`
        };

        await writeSheetRange(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'DIVISIONS_WRITE_ERROR',
            'Failed to write divisions to sheet',
            error
        );
    }
}

/**
 * Add a new division to the sheet
 */
export async function addDivision(
    division: DivisionData
): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRows = convertToSheetRows([division], DIVISIONS_HEADERS, false);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DIVISIONS_SHEET_NAME}'!A:C`
        };

        await appendToSheet(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'DIVISION_ADD_ERROR',
            'Failed to add division to sheet',
            error
        );
    }
}

/**
 * Find a division by ID
 */
export async function findDivisionById(
    divisionId: string
): Promise<DivisionData | null> {
    try {
        const divisions = await readDivisions();
        return divisions.find(div => div.id === divisionId) || null;
    } catch (error) {
        throw createAppError(
            'DIVISION_FIND_ERROR',
            `Failed to find division with ID: ${divisionId}`,
            error
        );
    }
}

/**
 * Get divisions ordered by their order field
 */
export async function getDivisionsOrdered(): Promise<DivisionData[]> {
    try {
        const divisions = await readDivisions();
        return divisions.sort((a, b) => a.order - b.order);
    } catch (error) {
        throw createAppError(
            'DIVISIONS_ORDER_ERROR',
            'Failed to get ordered divisions',
            error
        );
    }
}

/**
 * Update a division by ID
 */
export async function updateDivision(
    divisionId: string,
    updates: Partial<DivisionData>
): Promise<boolean> {
    try {
        const divisions = await readDivisions();
        const divisionIndex = divisions.findIndex(div => div.id === divisionId);

        if (divisionIndex === -1) {
            return false;
        }

        divisions[divisionIndex] = { ...divisions[divisionIndex], ...updates };
        await writeDivisions(divisions);

        return true;
    } catch (error) {
        throw createAppError(
            'DIVISION_UPDATE_ERROR',
            `Failed to update division with ID: ${divisionId}`,
            error
        );
    }
}

/**
 * Delete a division by ID
 */
export async function deleteDivision(
    divisionId: string
): Promise<boolean> {
    try {
        const divisions = await readDivisions();
        const filteredDivisions = divisions.filter(div => div.id !== divisionId);

        if (filteredDivisions.length === divisions.length) {
            return false; // Division not found
        }

        await writeDivisions(filteredDivisions);
        return true;
    } catch (error) {
        throw createAppError(
            'DIVISION_DELETE_ERROR',
            `Failed to delete division with ID: ${divisionId}`,
            error
        );
    }
}

/**
 * Validate division data
 */
export function validateDivisionData(data: Partial<DivisionData>): string[] {
    const errors: string[] = [];

    if (!data.id || typeof data.id !== 'string' || data.id.trim().length === 0) {
        errors.push('Division ID is required and must be a non-empty string');
    }

    if (!data.label || typeof data.label !== 'string' || data.label.trim().length === 0) {
        errors.push('Division label is required and must be a non-empty string');
    }

    if (data.order === undefined || data.order === null || typeof data.order !== 'number' || data.order < 0) {
        errors.push('Division order is required and must be a non-negative number');
    }

    return errors;
}

/**
 * Generate a new division ID
 */
export function generateDivisionId(label: string): string {
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Check if division ID is unique
 */
export async function isDivisionIdUnique(
    divisionId: string
): Promise<boolean> {
    try {
        const divisions = await readDivisions();
        return !divisions.some(div => div.id === divisionId);
    } catch (error) {
        throw createAppError(
            'DIVISION_UNIQUE_CHECK_ERROR',
            `Failed to check if division ID is unique: ${divisionId}`,
            error
        );
    }
}
