// app/_shared/types/sheets-types.ts

/**
 * The shapes of rows as they exist in the Google Sheet.
 *
 * These belong to the persistence layer, not to a domain. A reader in
 * `_shared/lib/sheets/` returns these and nothing else -- it does no interpretation and
 * derives no values. A domain then maps rows into its own model.
 *
 * That split is what keeps `_shared` free of domain dependencies (architecture.test.ts
 * Rule 1), and it is what makes a reader trivial to fake in a loader test: a fake only
 * has to return plain rows.
 *
 * A field belongs here only if it is literally a column in the sheet. Anything computed
 * -- like a draft's `currentPick` -- belongs to the domain that computes it.
 */

import type { DivisionId } from './league-types';

export type PlayersSheetData = {
    isHidden: string;
    code: number;
    position: string;
    team: string;
    webName: string;
    new: string;
};

/** A row of the `Draft` sheet: one pick that has been made. */
export interface DraftPickRow {
    pickNumber: number;
    round: number;
    userId: string;
    playerId: number;
    playerCode: number;
    playerName: string;
    teamCode: string;
    teamName: string;
    position: string;
    pickedAt: Date;
    divisionId: DivisionId;
}

/**
 * A row of the `DraftState` sheet.
 *
 * Deliberately has no `currentPick`: that column was removed from the sheet and is now
 * derived from the picks. The draft domain adds it (see DraftStateData).
 */
export interface DraftStateRow {
    isActive: boolean;
    currentUserId: string;
    divisionId: DivisionId;
    picksPerTeam: number;
    startedAt: Date | null;
    completedAt: Date | null;
}

/** A row of the `DraftOrder` sheet: one manager's slot in a division's snake order. */
export interface DraftOrderRow {
    divisionId: DivisionId;
    /** 1-based; the snake reverses it on even rounds. */
    position: number;
    userId: string;
    userName: string;
    generatedAt: Date;
}
