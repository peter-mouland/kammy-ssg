/* Location: app/_shared/lib/sheets/player-inbox.ts */

import { createAppError, readSheetRange, type SheetRange, writeSheetRange } from './utils/common';

/**
 * The `PlayerInbox` tab: players FPL has that the `Players` tab does not, plus whatever
 * position research has been done on them.
 *
 * This exists because approving a position and letting a player into the game are two
 * decisions, and `Players` cannot express the gap between them. A row in `Players` IS a
 * player in the game -- every `filter(code in sheet)` in the app says so -- and its
 * `isHidden` column is a formula off FPL status (`=IF(H2="u","hidden","")`), meaning
 * "unavailable", not "held". So a player waits here, and `Players` is written exactly
 * once per player, at release.
 *
 * A reader here returns rows and interprets nothing, as everything in this directory does.
 */

const PLAYER_INBOX_SHEET_NAME = 'PlayerInbox';

/** Column order is the sheet's contract. Adding a column means appending to this list. */
export const PLAYER_INBOX_HEADERS = [
    'code',
    'name',
    'club',
    'fplType',
    'suggested',
    'confidence',
    'basis',
    'summary',
    'reasoning',
    'sources',
    'added',
    'position',
    'status',
] as const;

const LAST_COLUMN = 'M'; // 13 headers -> A..M. Keep in step with PLAYER_INBOX_HEADERS.

/**
 * '' -- waiting for a position.
 * 'approved' -- position agreed, held, not yet in the game.
 * 'released' -- written into `Players`; kept as the record of what was suggested versus chosen.
 */
export type PlayerInboxStatus = '' | 'approved' | 'released';

export interface PlayerInboxSource {
    label: string;
    url: string;
}

export interface PlayerInboxRow {
    /** 1-based row in the tab, so an update can target it rather than rewriting the tab. */
    rowNumber: number;
    code: number;
    name: string;
    club: string;
    fplType: string;
    suggested: string;
    confidence: string;
    basis: string;
    summary: string;
    reasoning: string[];
    sources: PlayerInboxSource[];
    added: string;
    position: string;
    status: PlayerInboxStatus;
}

export type NewPlayerInboxRow = Omit<PlayerInboxRow, 'rowNumber'>;

/**
 * A cell holding several points, one per line.
 *
 * Multi-line beats JSON here because someone reading the tab in Google Sheets is a real
 * user of it -- the whole point of an inbox is that a human looks at it.
 */
const encodeLines = (lines: string[]): string => lines.filter(Boolean).join('\n');
const decodeLines = (cell: string): string[] =>
    String(cell ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

/** `Sofascore lineups | https://...` -- label first, because a bare URL says nothing. */
const encodeSources = (sources: PlayerInboxSource[]): string =>
    encodeLines(sources.map((source) => `${source.label} | ${source.url}`));

const decodeSources = (cell: string): PlayerInboxSource[] =>
    decodeLines(cell).map((line) => {
        const separator = line.lastIndexOf(' | ');
        if (separator === -1) return { label: line, url: line };
        return { label: line.slice(0, separator).trim(), url: line.slice(separator + 3).trim() };
    });

const inboxRange = (cells: string): SheetRange => ({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
    range: `'${PLAYER_INBOX_SHEET_NAME}'!${cells}`,
});

function toRow(cells: unknown[], rowNumber: number): PlayerInboxRow | null {
    const value = (index: number): string => String(cells[index] ?? '').trim();
    const code = Number.parseInt(value(0), 10);

    // A row without a code identifies nothing, so there is nothing useful to do with it.
    if (!code || Number.isNaN(code)) return null;

    return {
        rowNumber,
        code,
        name: value(1),
        club: value(2),
        fplType: value(3),
        suggested: value(4),
        confidence: value(5),
        basis: value(6),
        summary: value(7),
        reasoning: decodeLines(String(cells[8] ?? '')),
        sources: decodeSources(String(cells[9] ?? '')),
        added: value(10),
        position: value(11),
        status: value(12) as PlayerInboxStatus,
    };
}

function toCells(row: NewPlayerInboxRow): (string | number)[] {
    return [
        row.code,
        row.name,
        row.club,
        row.fplType,
        row.suggested,
        row.confidence,
        row.basis,
        row.summary,
        encodeLines(row.reasoning),
        encodeSources(row.sources),
        row.added,
        row.position,
        row.status,
    ];
}

/** Raised when the tab does not exist, so a caller can say so rather than show an empty inbox. */
export const PLAYER_INBOX_MISSING = 'PLAYER_INBOX_MISSING';

/**
 * `readSheetRange` wraps whatever it caught in an AppError and puts the original under
 * `details`, so the Sheets API's own words are one level down -- and the wrapper's message
 * ("Failed to read sheet range") is the same for a missing tab and a broken key. Searching
 * the whole shape is what tells those apart.
 *
 * `withRetry` only retries auth failures, so this fails fast rather than after three goes.
 */
function isMissingTab(error: unknown): boolean {
    try {
        return JSON.stringify(error, (_key, value) => (value instanceof Error ? value.message : value))?.includes(
            'Unable to parse range',
        );
    } catch {
        return false;
    }
}

/**
 * Every row in the tab, header excluded.
 *
 * Throws rather than returning [] when the tab is absent: an empty inbox and a missing
 * inbox look identical on screen but mean opposite things, and only one of them needs
 * somebody to go and create a tab.
 */
export async function readPlayerInbox(): Promise<PlayerInboxRow[]> {
    try {
        const data = await readSheetRange(inboxRange(`A:${LAST_COLUMN}`));

        // Row 1 is the header, so a data row's sheet row number is its index + 2.
        return data
            .slice(1)
            .map((cells, index) => toRow(cells, index + 2))
            .filter((row): row is PlayerInboxRow => row !== null);
    } catch (error) {
        if (isMissingTab(error)) {
            throw createAppError(
                PLAYER_INBOX_MISSING,
                `The '${PLAYER_INBOX_SHEET_NAME}' tab does not exist. Create it with the header row: ${PLAYER_INBOX_HEADERS.join(', ')}`,
                error,
            );
        }
        throw error;
    }
}

/**
 * Add rows to the end of the tab.
 *
 * Takes the current row count rather than using `values.append` so the caller knows where
 * the rows landed -- it has just read the tab to work out what is new, and re-reading to
 * find out what it wrote would be a second chance to race with somebody editing the sheet.
 */
export async function appendPlayerInboxRows(rows: NewPlayerInboxRow[], existingRowCount: number): Promise<void> {
    if (rows.length === 0) return;

    const firstRow = existingRowCount + 2; // +1 for the header, +1 for the next free row
    const lastRow = firstRow + rows.length - 1;

    await writeSheetRange(inboxRange(`A${firstRow}:${LAST_COLUMN}${lastRow}`), rows.map(toCells));
}

/** Rewrite one row in place. */
export async function updatePlayerInboxRow(row: PlayerInboxRow): Promise<void> {
    await writeSheetRange(inboxRange(`A${row.rowNumber}:${LAST_COLUMN}${row.rowNumber}`), [toCells(row)]);
}
