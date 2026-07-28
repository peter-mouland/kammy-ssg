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

import type { DivisionId, ManagerId } from './league-types';

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

/**
 * A row of the `player-gw-points` sheet: one player, plus a column per gameweek holding
 * that gameweek's total custom points (`gw-1`, `gw-2`, … and `gw-N-b` for the second
 * match of a double gameweek).
 *
 * The points themselves are computed by the scoring domain — this is only the shape they
 * are stored in. See `scoring/server/services/player-gw-points.service.ts`.
 */
export interface PlayerGameweekPointsRow {
    playerCode: number;
    webName: string;
    position: string;
    teamName: string;
    /** Gameweek columns, e.g. "gw-1". */
    [key: string]: string | number;
}

/**
 * A raw row of the `Transfers` sheet, exactly as the headers spell it.
 * The transfers domain normalises and interprets these — see `transfers/lib/transfer-rows.ts`.
 *
 * The property names are the literal spreadsheet column headers, so they cannot be
 * camelCase without breaking the mapping. `ProcessedTransferSheetData` below is the
 * camelCase form everything downstream actually uses.
 */
// biome-ignore-start lint/style/useNamingConvention: these are literal sheet column headers
export interface TransferSheetData {
    Status: 'Y' | 'N' | null | string; // Y = approved, N = rejected, null/empty = pending
    Timestamp: Date;
    Manager: string; // userId
    'Transfer Out': string; // player.web_name
    'Code Out': number; // player.code
    'Transfer In': string; // player.web_name
    'Code In': number; // player.code
    'Transfer Type': 'Transfer' | 'swap' | 'loan start' | 'loan end' | 'trade' | 'new player';
    Comment: string;
    'Loan To': string; // userId of manager receiving the loan (NEW)
    'Loan From': string; // userId of manager lending the player (NEW)
}
// biome-ignore-end lint/style/useNamingConvention: end of sheet-header block
export interface ProcessedTransferSheetData {
    status: 'Y' | 'N' | null | string; // Y = approved, N = rejected, null/empty = pending
    timestamp: Date;
    manager: string; // userId
    transferOut: string; // player.web_name
    codeOut: number; // player.code
    transferIn: string; // player.web_name
    codeIn: number; // player.code
    transferType: 'Transfer' | 'swap' | 'loan start' | 'loan end' | 'trade' | 'new player';
    comment: string;
    loanTo: string; // userId of manager receiving the loan (NEW)
    loanFrom: string; // userId of manager lending the player (NEW)
}

// biome-ignore-start lint/style/useNamingConvention: these are literal sheet column headers
/** A raw row of the `Cup` sheet, exactly as the headers spell it. */
export interface CupSheetData {
    Status: string; // '' = pending, 'Y' = confirmed, 'N' = rejected
    Timestamp: string | number | Date;
    Manager: string;
    Division: string;
    Gameweek: string | number;
    Stage: string;
    Leg: string | number;
    Players: string; // comma-separated player codes
    SubmittedByAdmin: string | boolean;
    AdminReason: string;
}
// biome-ignore-end lint/style/useNamingConvention: end of sheet-header block

/**
 * A `Cup` sheet row after type coercion, but before the cup domain interprets it.
 *
 * `stage` is a plain string here on purpose: narrowing it to `CupStageId` is the cup
 * domain's job, and doing it in the reader is what made `_shared` import `cup`.
 */
export interface CupSubmissionRow {
    status: string;
    timestamp: Date;
    manager: ManagerId;
    division: DivisionId;
    gameweek: number;
    stage: string;
    leg: number;
    players: number[];
    submittedByAdmin: boolean;
    adminReason: string;
}

/** A key/value row of the `CupConfig` tab. The cup domain parses these into a CupConfig. */
export interface CupConfigRow {
    key: string;
    value: string;
}

/** A row of the `CupBracket` tab, coerced but not yet interpreted as a CupMatchup. */
export interface CupBracketRow {
    stage: string;
    tie: number;
    home: ManagerId | null;
    away: ManagerId | null;
    homeAggregate?: number;
    awayAggregate?: number;
    winner?: ManagerId | null;
}
