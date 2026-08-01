/* Location: app/_shared/lib/sheets/divisions.ts */
/** biome-ignore-all lint/style/useNamingConvention: <?> */

import type { DivisionSheetData } from '../../types/league-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import {
    createAppError,
    parseHeaderBasedData,
    parseSheetBoolean,
    parseSheetNumber,
    readSheetRange,
    type SheetRange,
} from './utils/common';

// Sheet configuration
const DIVISIONS_SHEET_NAME = 'Divisions';
const DIVISIONS_HEADERS = {
    ID: 'id' as keyof DivisionSheetData,
    Label: 'label' as keyof DivisionSheetData,
    Order: 'order' as keyof DivisionSheetData,
    // What the division takes part in. Absent columns parse as false, which is the safe
    // default: a division opts IN to promotion, relegation and the cup, it is not assumed.
    promotion: 'promotion' as keyof DivisionSheetData,
    relegation: 'relegation' as keyof DivisionSheetData,
    cup: 'cup' as keyof DivisionSheetData,
};

// Transform functions for parsing
const DIVISIONS_TRANSFORM_FUNCTIONS: Partial<Record<keyof DivisionSheetData, (value: any) => any>> = {
    order: parseSheetNumber,
    // The sheet stores these as the strings "TRUE"/"FALSE".
    promotion: parseSheetBoolean,
    relegation: parseSheetBoolean,
    cup: parseSheetBoolean,
};

/**
 * Read all divisions from the sheet
 */
async function originalReadDivisions(): Promise<DivisionSheetData[]> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

    try {
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DIVISIONS_SHEET_NAME}'!A:H`,
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<DivisionSheetData>(rawData, DIVISIONS_HEADERS, DIVISIONS_TRANSFORM_FUNCTIONS);
    } catch (error) {
        throw createAppError('DIVISIONS_READ_ERROR', 'Failed to read divisions from sheet', error);
    }
}
export async function readDivisions() {
    return await dataCache.get(CACHE_KEYS.SHEETS.DIVISIONS, originalReadDivisions, {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.DIVISIONS),
    });
}
