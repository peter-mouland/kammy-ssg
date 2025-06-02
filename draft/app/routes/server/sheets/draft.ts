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
 * Get draft picks by user ID
 */
export async function getDraftPicksByUser(
    userId: string
): Promise<DraftPickData[]> {
    try {
        const allPicks = await readDraftPicks();
        return allPicks
            .filter(pick => pick.userId === userId)
            .sort((a, b) => a.pickNumber - b.pickNumber);
    } catch (error) {
        throw createAppError(
            'DRAFT_PICKS_USER_ERROR',
            `Failed to get draft picks for user: ${userId}`,
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

/**
 * Check if player is already drafted
 */
export async function isPlayerDrafted(
    playerId: string,
    divisionId?: string
): Promise<boolean> {
    try {
        const allPicks = await readDraftPicks();

        if (divisionId) {
            return allPicks.some(pick =>
                pick.playerId === playerId && pick.divisionId === divisionId
            );
        }

        return allPicks.some(pick => pick.playerId === playerId);
    } catch (error) {
        throw createAppError(
            'PLAYER_DRAFTED_CHECK_ERROR',
            `Failed to check if player is drafted: ${playerId}`,
            error
        );
    }
}

/**
 * Get drafted players for a division
 */
export async function getDraftedPlayers(
    divisionId: string
): Promise<string[]> {
    try {
        const picks = await getDraftPicksByDivision(divisionId);
        return picks.map(pick => pick.playerId);
    } catch (error) {
        throw createAppError(
            'DRAFTED_PLAYERS_ERROR',
            `Failed to get drafted players for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Calculate next pick information
 */
export async function calculateNextPick(
    divisionId: string,
    totalTeams: number,
    picksPerTeam: number
): Promise<{ pickNumber: number; round: number; isSnakeDraft: boolean } | null> {
    try {
        const picks = await getDraftPicksByDivision(divisionId);
        const nextPickNumber = picks.length + 1;

        if (nextPickNumber > totalTeams * picksPerTeam) {
            return null; // Draft complete
        }

        const round = Math.ceil(nextPickNumber / totalTeams);
        const isSnakeDraft = round % 2 === 0; // Even rounds are reversed

        return {
            pickNumber: nextPickNumber,
            round,
            isSnakeDraft
        };
    } catch (error) {
        throw createAppError(
            'NEXT_PICK_CALCULATION_ERROR',
            'Failed to calculate next pick',
            error
        );
    }
}

/**
 * Get recent draft picks for a division
 */
export async function getRecentDraftPicks(
    divisionId: string,
    limit = 10
): Promise<DraftPickData[]> {
    try {
        const picks = await getDraftPicksByDivision(divisionId);
        return picks
            .sort((a, b) => b.pickNumber - a.pickNumber)
            .slice(0, limit);
    } catch (error) {
        throw createAppError(
            'RECENT_PICKS_ERROR',
            `Failed to get recent draft picks for division: ${divisionId}`,
            error
        );
    }
}

/**
 * Clear all draft data
 */
export async function clearDraftData(
): Promise<void> {
    try {

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        // Clear draft picks
        const picksRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:J`
        };

        const picksHeaders = convertToSheetRows([], DRAFT_PICKS_HEADERS, true);
        await writeSheetRange(picksRange, picksHeaders);

        // Reset draft state
        const defaultState: DraftStateData = {
            isActive: false,
            currentPick: 1,
            currentUserId: '',
            currentDivisionId: '',
            picksPerTeam: 12,
            startedAt: null,
            completedAt: null
        };

        await updateDraftState(defaultState);
    } catch (error) {
        throw createAppError(
            'DRAFT_CLEAR_ERROR',
            'Failed to clear draft data',
            error
        );
    }
}

/**
 * Delete a draft pick by pick number and division ID
 */
export async function deleteDraftPick(
    pickNumber: number,
    divisionId: string
): Promise<void> {
    try {
        // Read all current picks
        const allPicks = await readDraftPicks();

        // Find the pick to delete
        const pickToDelete = allPicks.find(pick =>
            pick.pickNumber === pickNumber && pick.divisionId === divisionId
        );

        if (!pickToDelete) {
            throw new Error(`Pick ${pickNumber} not found in division ${divisionId}`);
        }

        // Filter out the pick to delete
        const remainingPicks = allPicks.filter(pick =>
            !(pick.pickNumber === pickNumber && pick.divisionId === divisionId)
        );

        // Transform the remaining picks for sheet format
        const transformedPicks = remainingPicks.map(pick => ({
            ...pick,
            pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt
        }));

        // Convert to sheet rows format
        const sheetRows = convertToSheetRows(transformedPicks, DRAFT_PICKS_HEADERS, true);

        // Clear the sheet and write the remaining picks
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:J`
        };

        await writeSheetRange(sheetRange, sheetRows);

        console.log(`🗑️ Successfully deleted pick ${pickNumber} (${pickToDelete.playerName}) from division ${divisionId}`);

    } catch (error) {
        throw createAppError(
            'DRAFT_PICK_DELETE_ERROR',
            `Failed to delete draft pick ${pickNumber} from division ${divisionId}`,
            error
        );
    }
}

/**
 * Delete multiple draft picks by pick numbers and division ID
 * More efficient for removing multiple picks at once
 */
export async function deleteDraftPicks(
    pickNumbers: number[],
    divisionId: string
): Promise<DraftPickData[]> {
    try {
        // Read all current picks
        const allPicks = await readDraftPicks();

        // Find the picks to delete
        const picksToDelete = allPicks.filter(pick =>
            pickNumbers.includes(pick.pickNumber) && pick.divisionId === divisionId
        );

        if (picksToDelete.length === 0) {
            throw new Error(`No picks found matching numbers ${pickNumbers.join(', ')} in division ${divisionId}`);
        }

        // Create a Set for faster lookup
        const pickNumbersSet = new Set(pickNumbers);

        // Filter out the picks to delete
        const remainingPicks = allPicks.filter(pick =>
            !(pickNumbersSet.has(pick.pickNumber) && pick.divisionId === divisionId)
        );

        // Transform the remaining picks for sheet format
        const transformedPicks = remainingPicks.map(pick => ({
            ...pick,
            pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt
        }));

        // Convert to sheet rows format
        const sheetRows = convertToSheetRows(transformedPicks, DRAFT_PICKS_HEADERS, true);

        // Clear the sheet and write the remaining picks
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:J`
        };

        await writeSheetRange(sheetRange, sheetRows);

        console.log(`🗑️ Successfully deleted ${picksToDelete.length} picks from division ${divisionId}:`,
            picksToDelete.map(p => `${p.pickNumber}: ${p.playerName}`));

        return picksToDelete;

    } catch (error) {
        throw createAppError(
            'DRAFT_PICKS_DELETE_ERROR',
            `Failed to delete draft picks ${pickNumbers.join(', ')} from division ${divisionId}`,
            error
        );
    }
}

/**
 * Delete the last N draft picks from a division
 * Optimized for the "remove last pick" functionality
 */
export async function deleteLastDraftPicks(
    divisionId: string,
    count: number = 1
): Promise<DraftPickData[]> {
    try {
        if (count < 1 || count > 50) {
            throw new Error('Count must be between 1 and 50');
        }

        // Get picks for this division only
        const divisionPicks = await getDraftPicksByDivision(divisionId);

        if (divisionPicks.length === 0) {
            throw new Error(`No picks found in division ${divisionId}`);
        }

        // Sort by pick number descending to get the most recent picks
        const sortedPicks = divisionPicks.sort((a, b) => b.pickNumber - a.pickNumber);

        // Get the picks to delete (last N picks)
        const actualCount = Math.min(count, sortedPicks.length);
        const picksToDelete = sortedPicks.slice(0, actualCount);
        const pickNumbersToDelete = picksToDelete.map(p => p.pickNumber);

        // Use the multi-delete function for efficiency
        return await deleteDraftPicks(pickNumbersToDelete, divisionId);

    } catch (error) {
        throw createAppError(
            'LAST_PICKS_DELETE_ERROR',
            `Failed to delete last ${count} picks from division ${divisionId}`,
            error
        );
    }
}

/**
 * Reorder pick numbers after deletion to maintain sequence
 * Call this after deleting picks to fix the numbering
 */
export async function reorderPickNumbers(divisionId: string): Promise<void> {
    try {
        // Get all picks for this division
        const divisionPicks = await getDraftPicksByDivision(divisionId);

        if (divisionPicks.length === 0) {
            return; // Nothing to reorder
        }

        // Sort by the original pick time/date to maintain draft order
        const sortedPicks = divisionPicks.sort((a, b) => {
            // First sort by pick number as fallback
            const timeA = a.pickedAt instanceof Date ? a.pickedAt.getTime() : new Date(a.pickedAt).getTime();
            const timeB = b.pickedAt instanceof Date ? b.pickedAt.getTime() : new Date(b.pickedAt).getTime();
            return timeA - timeB;
        });

        // Reassign pick numbers sequentially
        const reorderedPicks = sortedPicks.map((pick, index) => ({
            ...pick,
            pickNumber: index + 1,
            round: Math.ceil((index + 1) / getDraftOrderLength(divisionId)) // You'll need to calculate this
        }));

        // Get all picks (not just this division) to preserve other divisions
        const allPicks = await readDraftPicks();
        const otherDivisionPicks = allPicks.filter(pick => pick.divisionId !== divisionId);

        // Combine reordered picks with other divisions
        const allReorderedPicks = [...otherDivisionPicks, ...reorderedPicks];

        // Transform for sheet format
        const transformedPicks = allReorderedPicks.map(pick => ({
            ...pick,
            pickedAt: pick.pickedAt instanceof Date ? pick.pickedAt.toISOString() : pick.pickedAt
        }));

        // Write back to sheet
        const sheetRows = convertToSheetRows(transformedPicks, DRAFT_PICKS_HEADERS, true);

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!A:J`
        };

        await writeSheetRange(sheetRange, sheetRows);

        console.log(`🔄 Reordered pick numbers for division ${divisionId}`);

    } catch (error) {
        throw createAppError(
            'PICK_REORDER_ERROR',
            `Failed to reorder pick numbers for division ${divisionId}`,
            error
        );
    }
}

// Helper function to get draft order length (you might need to adjust this)
function getDraftOrderLength(divisionId: string): number {
    // This should return the number of teams in the division
    // You might need to import and call getDraftOrderByDivision or have this as a parameter
    // For now, assuming a default of 10 teams
    return 10; // Replace with actual logic
}

/**
 * Validate draft pick data
 */
export function validateDraftPickData(data: Partial<DraftPickData>): string[] {
    const errors: string[] = [];

    if (data.pickNumber === undefined || data.pickNumber < 1) {
        errors.push('Pick number must be a positive number');
    }

    if (data.round === undefined || data.round < 1) {
        errors.push('Round must be a positive number');
    }

    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
        errors.push('User ID is required and must be a non-empty string');
    }

    if (!data.playerId || typeof data.playerId !== 'string' || data.playerId.trim().length === 0) {
        errors.push('Player ID is required and must be a non-empty string');
    }

    if (!data.playerName || typeof data.playerName !== 'string' || data.playerName.trim().length === 0) {
        errors.push('Player name is required and must be a non-empty string');
    }

    if (!data.divisionId || typeof data.divisionId !== 'string' || data.divisionId.trim().length === 0) {
        errors.push('Division ID is required and must be a non-empty string');
    }

    if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
        errors.push('Price must be a non-negative number');
    }

    return errors;
}

/**
 * Validate draft state data
 */
export function validateDraftStateData(data: Partial<DraftStateData>): string[] {
    const errors: string[] = [];

    if (data.currentPick !== undefined && (typeof data.currentPick !== 'number' || data.currentPick < 1)) {
        errors.push('Current pick must be a positive number');
    }

    if (data.picksPerTeam !== undefined && (typeof data.picksPerTeam !== 'number' || data.picksPerTeam < 1)) {
        errors.push('Picks per team must be a positive number');
    }

    return errors;
}
