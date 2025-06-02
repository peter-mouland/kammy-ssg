// app/server/sheets/draft-quick.ts
import { readSheetRange, type SheetRange } from './common';

const DRAFT_PICKS_SHEET_NAME = 'Draft';

/**
 * Get quick pick count for a division without parsing all pick data
 * Uses minimal data transfer by only reading the division column
 */
export async function getQuickPickCount(divisionId: string): Promise<number> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

        // Only read the Division ID column (column J based on your draft.ts headers)
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!J:J` // Only division ID column
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length <= 1) { // Only header or empty
            return 0;
        }

        // Count rows that match the division (skip header row)
        let count = 0;
        for (let i = 1; i < rawData.length; i++) {
            if (rawData[i][0] === divisionId) {
                count++;
            }
        }

        return count;

    } catch (error) {
        console.error(`Error getting quick pick count for division ${divisionId}:`, error);
        return 0; // Safe fallback
    }
}

/**
 * Get the last pick timestamp for a division (for change detection)
 */
export async function getLastPickTimestamp(divisionId: string): Promise<Date | null> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

        // Read only the timestamp and division columns
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!I:J` // Picked At (I) and Division ID (J)
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length <= 1) {
            return null;
        }

        let latestTimestamp: Date | null = null;

        // Find the most recent pick for this division
        for (let i = 1; i < rawData.length; i++) {
            const [timestampStr, divisionIdValue] = rawData[i];

            if (divisionIdValue === divisionId && timestampStr) {
                const timestamp = new Date(timestampStr);
                if (!isNaN(timestamp.getTime())) {
                    if (!latestTimestamp || timestamp > latestTimestamp) {
                        latestTimestamp = timestamp;
                    }
                }
            }
        }

        return latestTimestamp;

    } catch (error) {
        console.error(`Error getting last pick timestamp for division ${divisionId}:`, error);
        return null;
    }
}

/**
 * Get minimal draft summary for polling (count + last update)
 */
export async function getDraftSummary(divisionId: string): Promise<{
    pickCount: number;
    lastPickAt: Date | null;
}> {
    try {
        // We can optimize this further by reading both columns at once
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${DRAFT_PICKS_SHEET_NAME}'!I:J` // Picked At (I) and Division ID (J)
        };

        const rawData = await readSheetRange(sheetRange);

        if (rawData.length <= 1) {
            return { pickCount: 0, lastPickAt: null };
        }

        let pickCount = 0;
        let lastPickAt: Date | null = null;

        for (let i = 1; i < rawData.length; i++) {
            const [timestampStr, divisionIdValue] = rawData[i];

            if (divisionIdValue === divisionId) {
                pickCount++;

                if (timestampStr) {
                    const timestamp = new Date(timestampStr);
                    if (!isNaN(timestamp.getTime())) {
                        if (!lastPickAt || timestamp > lastPickAt) {
                            lastPickAt = timestamp;
                        }
                    }
                }
            }
        }

        return { pickCount, lastPickAt };

    } catch (error) {
        console.error(`Error getting draft summary for division ${divisionId}:`, error);
        return { pickCount: 0, lastPickAt: null };
    }
}
