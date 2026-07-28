// app/draft/lib/draft-state.ts

import type { DivisionId } from '../../_shared/types/league-types';
import type { DraftPickRow, DraftStateRow } from '../../_shared/types/sheets-types';
import type { DraftStateData } from '../types/draft-types';
import { calculateCurrentPick } from './draft-pick-calculator';

/**
 * Turn raw DraftState rows into draft state the app can use.
 *
 * `currentPick` is not a column in the sheet -- it was removed, and is derived from how
 * many picks a division has made. That derivation used to live inside the sheets reader
 * in `_shared`, which meant the persistence layer imported draft logic and computed a
 * domain value. It lives here instead: the reader returns rows, the draft domain
 * interprets them.
 *
 * Pure, and in `lib/` rather than `server/`, so other domains (admin orchestrates the
 * draft) can use it without reaching into draft's server code.
 */
export function toDraftStates(rows: DraftStateRow[], allPicks: DraftPickRow[]): DraftStateData[] {
    return rows.map((row) => ({
        ...row,
        currentPick: calculateCurrentPick(row.divisionId, allPicks),
    }));
}

/** The same, for a single division. Returns null when that division has no state row. */
export function toDraftStateForDivision(
    rows: DraftStateRow[],
    allPicks: DraftPickRow[],
    divisionId: DivisionId,
): DraftStateData | null {
    const row = rows.find((state) => state.divisionId === divisionId);

    return row ? { ...row, currentPick: calculateCurrentPick(divisionId, allPicks) } : null;
}
