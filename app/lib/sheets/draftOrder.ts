import type { sheets_v4 } from 'googleapis';
import type { DraftOrderData } from '../../types';
import {
    readSheetRange,
    writeSheetRange,
    parseHeaderBasedData,
    convertToSheetRows,
    parseSheetNumber,
    parseSheetDate,
    createAppError,
    type SheetRange
} from './common';

// Sheet configuration
const DRAFT_ORDER_SHEET_NAME = 'DraftOrder';
const DRAFT_ORDER_HEADERS = {
    'Division ID': 'divisionId' as keyof DraftOrderData,
    'Position': 'position' as keyof DraftOrderData,
    'User ID': 'userId' as keyof DraftOrderData,
    'User Name': 'userName' as keyof DraftOrderData,
    'Generated At': 'generatedAt' as keyof DraftOrderData
};

// Transform functions for parsing
const DRAFT_ORDER_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftOrderData, (value: any) => any>> = {
    position: parseSheetNumber,
    generatedAt: parseSheetDate
};

/**
 * Read all draft orders from the sheet
 */
export async function readDraftOrders(): Promise<DraftOrderData[]> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_ORDER_SHEET_NAME}'!A:E`
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<DraftOrderData>(
            rawData,
            DRAFT_ORDER_HEADERS,
            DRAFT_ORDER_TRANSFORM_FUNCTIONS
        );
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDERS_READ_ERROR',
            'Failed to read draft orders from sheet',
            error
        );
    }
}

/**
 * Write draft orders to the sheet (overwrites existing data)
 */
export async function writeDraftOrders(
    draftOrders: DraftOrderData[]
): Promise<void> {

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
    try {
        // Transform dates to ISO strings for sheet storage
        const transformedOrders = draftOrders.map(order => ({
            ...order,
            generatedAt: order.generatedAt.toISOString()
        }));

        const sheetRows = convertToSheetRows(transformedOrders, DRAFT_ORDER_HEADERS, true);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_ORDER_SHEET_NAME}'!A:E`
        };

        await writeSheetRange(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDERS_WRITE_ERROR',
            'Failed to write draft orders to sheet',
            error
        );
    }
}

/**
 * Get draft order for a specific division
 */
export async function getDraftOrderByDivision(
    divisionId: string
): Promise<DraftOrderData[]> {
    try {
        const allOrders = await readDraftOrders();
        const divOrder =  allOrders
            .filter(order => order.divisionId === divisionId)
            .sort((a, b) => a.position - b.position);

        return divOrder;
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_DIVISION_ERROR',
            `Failed to get draft order for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Generate random draft order for a division
 */
export async function generateRandomDraftOrder(
    divisionId: string,
    userTeams: Array<{ userId: string; userName: string }>
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
            generatedAt: new Date()
        }));

        // Remove existing order for this division and add new one
        const allOrders = await readDraftOrders();
        const otherDivisionOrders = allOrders.filter(order => order.divisionId !== divisionId);
        const newAllOrders = [...otherDivisionOrders, ...draftOrder];

        await writeDraftOrders(newAllOrders);

        return draftOrder;
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_GENERATE_ERROR',
            `Failed to generate random draft order for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Update draft order for a division (manual reordering)
 */
export async function updateDraftOrder(
    spreadsheetId: string,
    divisionId: string,
    newOrder: Array<{ userId: string; userName: string }>
): Promise<DraftOrderData[]> {
    try {
        // Create new draft order entries
        const draftOrder: DraftOrderData[] = newOrder.map((team, index) => ({
            divisionId,
            position: index + 1,
            userId: team.userId,
            userName: team.userName,
            generatedAt: new Date()
        }));

        // Remove existing order for this division and add new one
        const allOrders = await readDraftOrders();
        const otherDivisionOrders = allOrders.filter(order => order.divisionId !== divisionId);
        const newAllOrders = [...otherDivisionOrders, ...draftOrder];

        await writeDraftOrders(newAllOrders);

        return draftOrder;
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_UPDATE_ERROR',
            `Failed to update draft order for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Clear draft order for a division
 */
export async function clearDraftOrder(
    divisionId: string
): Promise<void> {
    try {
        const allOrders = await readDraftOrders();
        const filteredOrders = allOrders.filter(order => order.divisionId !== divisionId);

        await writeDraftOrders(filteredOrders);
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_CLEAR_ERROR',
            `Failed to clear draft order for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Get user's draft position in a division
 */
export async function getUserDraftPosition(
    divisionId: string,
    userId: string
): Promise<number | null> {
    try {
        const draftOrder = await getDraftOrderByDivision(divisionId);
        const userOrder = draftOrder.find(order => order.userId === userId);
        return userOrder?.position || null;
    } catch (error) {
        throw createAppError(
            'USER_DRAFT_POSITION_ERROR',
            `Failed to get user draft position for user: ${userId} in division: ${divisionId}`,
            error
        );
    }
}

/**
 * Get next user to pick in draft order
 */
export async function getNextDraftUser(
    divisionId: string,
    currentPickNumber: number,
    totalRounds: number
): Promise<{ userId: string; userName: string; position: number } | null> {
    try {
        const draftOrder = await getDraftOrderByDivision(divisionId);

        if (draftOrder.length === 0) {
            return null;
        }

        const totalTeams = draftOrder.length;
        const currentRound = Math.ceil(currentPickNumber / totalTeams);

        if (currentRound > totalRounds) {
            return null; // Draft complete
        }

        // Calculate position in current round
        const positionInRound = ((currentPickNumber - 1) % totalTeams) + 1;

        let actualPosition: number;

        // Snake draft logic: even rounds are reversed
        if (currentRound % 2 === 0) {
            actualPosition = totalTeams - positionInRound + 1;
        } else {
            actualPosition = positionInRound;
        }

        const nextUser = draftOrder.find(order => order.position === actualPosition);

        return nextUser ? {
            userId: nextUser.userId,
            userName: nextUser.userName,
            position: actualPosition
        } : null;
    } catch (error) {
        throw createAppError(
            'NEXT_DRAFT_USER_ERROR',
            `Failed to get next draft user for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Check if draft order exists for division
 */
export async function draftOrderExists(
    divisionId: string
): Promise<boolean> {
    try {
        const draftOrder = await getDraftOrderByDivision(divisionId);
        return draftOrder.length > 0;
    } catch (error) {
        throw createAppError(
            'DRAFT_ORDER_EXISTS_ERROR',
            `Failed to check if draft order exists for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Get all divisions with draft orders
 */
export async function getDivisionsWithDraftOrders(
): Promise<string[]> {
    try {
        const allOrders = await readDraftOrders();
        const divisionIds = new Set(allOrders.map(order => order.divisionId));
        return Array.from(divisionIds);
    } catch (error) {
        throw createAppError(
            'DIVISIONS_WITH_ORDERS_ERROR',
            'Failed to get divisions with draft orders',
            error
        );
    }
}

/**
 * Validate draft order data
 */
export function validateDraftOrderData(data: Partial<DraftOrderData>): string[] {
    const errors: string[] = [];

    if (!data.divisionId || typeof data.divisionId !== 'string' || data.divisionId.trim().length === 0) {
        errors.push('Division ID is required and must be a non-empty string');
    }

    if (data.position === undefined || data.position < 1) {
        errors.push('Position must be a positive number');
    }

    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
        errors.push('User ID is required and must be a non-empty string');
    }

    if (!data.userName || typeof data.userName !== 'string' || data.userName.trim().length === 0) {
        errors.push('User name is required and must be a non-empty string');
    }

    return errors;
}

/**
 * Get draft pick sequence for a user across all rounds
 */
export async function getUserPickSequence(
    divisionId: string,
    userId: string,
    totalRounds: number
): Promise<number[]> {
    try {
        const draftOrder = await getDraftOrderByDivision(divisionId);
        const totalTeams = draftOrder.length;
        const userPosition = draftOrder.find(order => order.userId === userId)?.position;

        if (!userPosition) {
            return [];
        }

        const pickSequence: number[] = [];

        for (let round = 1; round <= totalRounds; round++) {
            let pickInRound: number;

            // Snake draft logic
            if (round % 2 === 1) {
                // Odd rounds: normal order
                pickInRound = userPosition;
            } else {
                // Even rounds: reversed order
                pickInRound = totalTeams - userPosition + 1;
            }

            // Calculate overall pick number
            const overallPick = (round - 1) * totalTeams + pickInRound;
            pickSequence.push(overallPick);
        }

        return pickSequence;
    } catch (error) {
        throw createAppError(
            'USER_PICK_SEQUENCE_ERROR',
            `Failed to get pick sequence for user: ${userId}`,
            error
        );
    }
}
