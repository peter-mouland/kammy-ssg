/* Location: app/_shared/test/sheet-range.ts */

/**
 * Parsing the A1 ranges the app sends to the Sheets API.
 *
 * Shared by the two MSW layers so they cannot drift: `google-sheets-msw.ts` (hand-written
 * rows, for unit tests) and `fixtures/fixture-msw-handlers.ts` (the real captured tabs,
 * for the harness). A range that resolved to one tab in one layer and another tab in the
 * other would be an exceptionally annoying afternoon.
 *
 * The app builds ranges in exactly two shapes, both quoted and percent-encoded in transit:
 *
 *   'UserTeams'!A:G        an open range -- the whole tab from row 1
 *   'Draft'!A12:M12        a single row, used to update one record in place
 *
 * plus `'Sheet'!1:1000` and `'Sheet'!A:ZZ` from the write path's is-it-empty probe.
 */

/** `'premierLeague-transfers'!A:M` -> `premierLeague-transfers`. */
export function tabNameFromRange(range: string): string {
    return range.replace(/^'?/, '').replace(/'?!.*$/, '');
}

/**
 * The 1-based first row a write targets. `'Draft'!A12:M12` -> 12; an open range -> 1.
 *
 * This is what makes an in-place row update land on the right row: both
 * `sheets/draft.ts:330` and `admin/server/transfers-admin.server.tsx:267` compute a row
 * number and write a single row back to it, which is how a transfer gets approved.
 */
export function startRowFromRange(range: string): number {
    const cells = range.split('!')[1];
    if (!cells) return 1;

    const firstRow = cells.split(':')[0].match(/(\d+)$/);
    return firstRow ? Number(firstRow[1]) : 1;
}
