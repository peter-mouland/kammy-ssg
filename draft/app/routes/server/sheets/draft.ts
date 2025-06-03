import type { DraftPickData, DraftStateData } from '../../types';
import {
    readSheetRange,
    writeSheetRange,
    appendToSheet,
    parseHeaderBasedData,
    convertToSheetRows,
    parseSheetNumber,
    parseSheetDate,
    parseSheetBoolean,
    createAppError,
    type SheetRange
} from './common';

// Draft picks sheet configuration
const DRAFT_PICKS_SHEET_NAME = 'Draft';
const DRAFT_PICKS_HEADERS = {
    'Pick Number': 'pickNumber' as keyof DraftPickData,
    'Round': 'round' as keyof DraftPickData,
    'User ID': 'userId' as keyof DraftPickData,
    'Player ID': 'playerId' as keyof DraftPickData,
    'Player Name': 'playerName' as keyof DraftPickData,
    'Team': 'team' as keyof DraftPickData,
    'Position': 'position' as keyof DraftPickData,
    'Price': 'price' as keyof DraftPickData,
    'Picked At': 'pickedAt' as keyof DraftPickData,
    'Division ID': 'divisionId' as keyof DraftPickData
};

// Draft state sheet configuration
const DRAFT_STATE_SHEET_NAME = 'DraftState';
const DRAFT_STATE_HEADERS = {
    'Is Active': 'isActive' as keyof DraftStateData,
    'Current Pick': 'currentPick' as keyof DraftStateData,
    'Current User ID': 'currentUserId' as keyof DraftStateData,
    'Current Division ID': 'currentDivisionId' as keyof DraftStateData,
    'Picks Per Team': 'picksPerTeam' as keyof DraftStateData,
    'Started At': 'startedAt' as keyof DraftStateData,
    'Completed At': 'completedAt' as keyof DraftStateData
};

// Transform functions for parsing
const DRAFT_PICKS_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftPickData, (value: any) => any>> = {
    pickNumber: parseSheetNumber,
    round: parseSheetNumber,
    price: parseSheetNumber,
    pickedAt: parseSheetDate
};

const DRAFT_STATE_TRANSFORM_FUNCTIONS: Partial<Record<keyof DraftStateData, (value: any) => any>> = {
    isActive: parseSheetBoolean,
    currentPick: parseSheetNumber,
    picksPerTeam: parseSheetNumber,
    startedAt: (value: any) => value ? parseSheetDate(value) : null,
    completedAt: (value: any) => value ? parseSheetDate(value) : null
};

/**
 * Read all draft picks from the sheet
 */
export async function readDraftPicks(
): Promise<DraftPickData[]> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:J`
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length === 0) {
            return [];
        }

        return parseHeaderBasedData<DraftPickData>(
            rawData,
            DRAFT_PICKS_HEADERS,
            DRAFT_PICKS_TRANSFORM_FUNCTIONS
        );
    } catch (error) {
        throw createAppError(
            'DRAFT_PICKS_READ_ERROR',
            'Failed to read draft picks from sheet',
            error
        );
    }
}

/**
 * Add a new draft pick to the sheet
 */
export async function addDraftPick(
    draftPick: DraftPickData
): Promise<void> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const transformedPick = {
            ...draftPick,
            pickedAt: draftPick.pickedAt.toISOString()
        };

        const sheetRows = convertToSheetRows([transformedPick], DRAFT_PICKS_HEADERS, false);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:J`
        };

        await appendToSheet(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'DRAFT_PICK_ADD_ERROR',
            'Failed to add draft pick to sheet',
            error
        );
    }
}

/**
 * Get draft picks by division ID
 */
export async function getDraftPicksByDivision(
    divisionId: string
): Promise<DraftPickData[]> {

    try {
        const allPicks = await readDraftPicks();
        return allPicks
            .filter(pick => pick.divisionId === divisionId)
            .sort((a, b) => a.pickNumber - b.pickNumber);
    } catch (error) {
        throw createAppError(
            'DRAFT_PICKS_DIVISION_ERROR',
            `Failed to get draft picks for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Read current draft state
 */
export async function readDraftState(
): Promise<DraftStateData | null> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_STATE_SHEET_NAME}'!A:H`
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length < 2) {
            return null; // No data or only headers
        }

        const states = parseHeaderBasedData<DraftStateData>(
            rawData,
            DRAFT_STATE_HEADERS,
            DRAFT_STATE_TRANSFORM_FUNCTIONS
        );

        return states[0] || null;
    } catch (error) {
        throw createAppError(
            'DRAFT_STATE_READ_ERROR',
            'Failed to read draft state from sheet',
            error
        );
    }
}

/**
 * Update draft state
 */
export async function updateDraftState(
    draftState: DraftStateData
): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const transformedState = {
            ...draftState,
            startedAt: draftState.startedAt?.toISOString() || '',
            completedAt: draftState.completedAt?.toISOString() || ''
        };

        const sheetRows = convertToSheetRows([transformedState], DRAFT_STATE_HEADERS, true);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_STATE_SHEET_NAME}'!A:H`
        };

        await writeSheetRange(sheetRange, sheetRows);
    } catch (error) {
        throw createAppError(
            'DRAFT_STATE_UPDATE_ERROR',
            'Failed to update draft state',
            error
        );
    }
}

