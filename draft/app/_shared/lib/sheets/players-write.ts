/* Location: app/_shared/lib/sheets/players-write.ts */

import { CACHE_KEYS } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { readSheetRange, type SheetRange, writeSheetRange } from './utils/common';

/**
 * Adding a player to the `Players` tab.
 *
 * Kept apart from `players.ts` because that file is the read path used by every request,
 * and this is a rare admin write with very different obligations.
 *
 * **Four of the eight columns are formulas.** Only `new`, `code`, `web_name` and
 * `position` are literal values; club, FPL value and status are VLOOKUPs against the
 * `FPL_Player_export` tab, and `isHidden` derives from status. That is what keeps a row
 * current when a player changes club or gets injured -- so a row written as plain values
 * would look right on the day and silently stop tracking reality afterwards.
 *
 * The formulas reference their own row, so rows have to be written at known row numbers
 * (`values.update` at an explicit range) rather than appended blind.
 */

const PLAYERS_SHEET_NAME = 'Players';

/** The tab the formula columns look up. Nick refreshes it from FPL; the site never writes it. */
const FPL_EXPORT_SHEET_NAME = 'FPL_Player_export';

/**
 * The real header row, in order:
 *   A isHidden | B new | C code | D web_name | E club_shortcode | F position | G fpl_value | H status
 */
const CODE_COLUMN_INDEX = 2;

/** Any non-empty value makes `draft.isNew` true (`scoring/lib/generators.ts`). */
const NEW_PLAYER_FLAG = 'Y';

const EXPORT_LOOKUP = (row: number, column: number) => `=VLOOKUP(C${row},FPL_Player_export!$A$2:$ZZ,${column},FALSE)`;

export interface PlayersRowToAdd {
    code: number;
    webName: string;
    position: string;
}

const playersRange = (cells: string): SheetRange => ({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
    range: `'${PLAYERS_SHEET_NAME}'!${cells}`,
});

/**
 * Every code currently in the tab.
 *
 * Deliberately not `readPlayers()`: that is cached for 24 hours, and a duplicate check
 * against a day-old list is not a check. This reads through.
 */
export async function readPlayersCodes(): Promise<Set<number>> {
    const data = await readSheetRange(playersRange('A:H'));

    return new Set(
        data
            .slice(1)
            .map((row) => Number.parseInt(String(row[CODE_COLUMN_INDEX] ?? ''), 10))
            .filter((code) => Number.isFinite(code)),
    );
}

/**
 * Every code the `FPL_Player_export` tab currently holds.
 *
 * The four formula columns all look a player up in that tab, so appending a row for a code
 * it does not carry yet writes four `#N/A` cells, and `isHidden` then derives from an
 * `#N/A` status. The export lands a day or so behind FPL's own list, so this is a real gap
 * rather than a theoretical one: a signing can exist in the API and not in the tab.
 */
export async function readFplExportCodes(): Promise<Set<number>> {
    const data = await readSheetRange({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
        range: `'${FPL_EXPORT_SHEET_NAME}'!A:A`,
    });

    return new Set(
        data
            .slice(1)
            .map((row) => Number.parseInt(String(row[0] ?? ''), 10))
            .filter((code) => Number.isFinite(code)),
    );
}

/**
 * Append rows, formulas included, and drop the cached player list.
 *
 * `USER_ENTERED` is required: the default `RAW` would store `=VLOOKUP(...)` as the literal
 * text of a formula, leaving club, value and status permanently blank.
 */
export async function appendPlayersRows(players: PlayersRowToAdd[]): Promise<void> {
    if (players.length === 0) return;

    const existing = await readSheetRange(playersRange('A:H'));
    const firstRow = existing.length + 1; // existing includes the header, so this is the next free row

    const values = players.map((player, index) => {
        const row = firstRow + index;

        return [
            `=IF(H${row}="u","hidden","")`, // A isHidden
            NEW_PLAYER_FLAG, //                B new
            player.code, //                    C code
            player.webName, //                 D web_name
            EXPORT_LOOKUP(row, 11), //         E club_shortcode  (team_code)
            player.position, //                F position
            `${EXPORT_LOOKUP(row, 6)}/10`, //  G fpl_value       (now_cost)
            EXPORT_LOOKUP(row, 8), //          H status
        ];
    });

    await writeSheetRange(playersRange(`A${firstRow}:H${firstRow + players.length - 1}`), values, {
        valueInputOption: 'USER_ENTERED',
    });

    dataCache.invalidate(CACHE_KEYS.SHEETS.PLAYERS);
}
