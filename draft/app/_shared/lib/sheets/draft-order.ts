/* Location: app/_shared/lib/sheets/draft-order.ts */

import type { DraftOrderData } from '../../../draft/types/draft-types';
import type { DivisionId } from '../../types/league-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import {
    convertToSheetRows,
    createAppError,
    parseHeaderBasedData,
    parseSheetDate,
    parseSheetNumber,
    readSheetRange,
    type SheetRange,
    writeSheetRange,
} from './utils/common';

// Sheet configuration
const DRAFT_ORDER_SHEET_NAME = 'DraftOrder';
const DRAFT_ORDER_HEADERS: Record<string, keyof DraftOrderData> = {
    'Division ID': 'divisionId',
    Position: 'position',
    'User ID': 'userId',
    'User Name': 'userName',
    'Generated At': 'generatedAt',
};

// Transform functions for parsing
const DRAFT_ORDER_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftOrderData, (value: any) => any>> = {
    position: parseSheetNumber,
    generatedAt: parseSheetDate,
};

/**
 * Read all draft orders from the sheet
 */
async function originalReadDraftOrders(): Promise<Record<DivisionId, DraftOrderData[]>> {
    try {
        const draftOrders: Record<DivisionId, DraftOrderData[]> = {
            premierLeague: [],
            championship: [],
            leagueOne: [],
        };
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_ORDER_SHEET_NAME}'!A:E`,
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return draftOrders;
        }

        const draftOrder = parseHeaderBasedData<DraftOrderData>(
            rawData,
            DRAFT_ORDER_HEADERS,
            DRAFT_ORDER_TRANSFORM_FUNCTIONS,
        );
        // Fetch user teams and draft orders for each division
        draftOrder.forEach((order) => {
            draftOrders[order.divisionId].push(order);
        });
        return draftOrders;
    } catch (error) {
        throw createAppError('DRAFT_ORDERS_READ_ERROR', 'Failed to read draft orders from sheet', error);
    }
}
export async function readDraftOrders() {
    return await dataCache.get(CACHE_KEYS.SHEETS.DRAFT_ORDERS, originalReadDraftOrders, {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.DRAFT_ORDERS),
    });
}
/**
 * Write draft orders to the sheet (overwrites existing data)
 */
async function writeDraftOrders(draftOrders: DraftOrderData[]): Promise<void> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
    try {
        // Transform dates to ISO strings for sheet storage
        const transformedOrders = draftOrders.map((order) => ({
            ...order,
            generatedAt: order.generatedAt.toISOString(),
        }));

        const sheetRows = convertToSheetRows(transformedOrders, DRAFT_ORDER_HEADERS, true);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_ORDER_SHEET_NAME}'!A:E`,
        };

        await writeSheetRange(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError('DRAFT_ORDERS_WRITE_ERROR', 'Failed to write draft orders to sheet', error);
    }
}

/**
 * Get draft order for a specific division
 */
export async function getDraftOrderByDivision(divisionId: DivisionId): Promise<DraftOrderData[]> {
    try {
        const allOrders = await readDraftOrders();
        return allOrders[divisionId].sort((a, b) => a.position - b.position);
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_DIVISION_ERROR',
            `Failed to get draft order for division: ${divisionId}`,
            error,
        );
    }
}

/**
 * Generate random draft order for a division
 */
export async function generateRandomDraftOrder(
    divisionId: DivisionId,
    userTeams: Array<{ userId: string; userName: string }>,
): Promise<DraftOrderData[]> {
    try {
        // Shuffle the user teams array
        const shuffledTeams = [...userTeams];
        for (let i = shuffledTeams.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
        }

        // Create draft order entries
        const draftOrder: DraftOrderData[] = shuffledTeams.map((team, index) => ({
            divisionId,
            position: index + 1,
            userId: team.userId,
            userName: team.userName,
            generatedAt: new Date(),
        }));

        // Remove existing order for this division and add new one
        const allOrders = await readDraftOrders();
        const otherDivisionOrders = (Object.keys(allOrders) as DivisionId[])
            .filter((div) => div !== divisionId)
            .flatMap((div) => allOrders[div]);
        const newAllOrders = [...otherDivisionOrders, ...draftOrder];

        await writeDraftOrders(newAllOrders);

        return draftOrder;
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_GENERATE_ERROR',
            `Failed to generate random draft order for division: ${divisionId}`,
            error,
        );
    }
}

/**
 * Clear draft order for a division
 */
export async function clearDraftOrder(divisionId: string): Promise<void> {
    try {
        const allOrders = await readDraftOrders();
        const filteredOrders = (Object.keys(allOrders) as DivisionId[])
            .filter((div) => div !== divisionId)
            .flatMap((div) => allOrders[div]);

        await writeDraftOrders(filteredOrders);
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_CLEAR_ERROR',
            `Failed to clear draft order for division: ${divisionId}`,
            error,
        );
    }
}

/**
 * Check if draft order exists for division
 */
export async function draftOrderExists(divisionId: DivisionId): Promise<boolean> {
    try {
        const draftOrder = await getDraftOrderByDivision(divisionId);
        return draftOrder.length > 0;
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_EXISTS_ERROR',
            `Failed to check if draft order exists for division: ${divisionId}`,
            error,
        );
    }
}
