// app/draft/types/draft-types.ts
// Updated to support multiple divisions

import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type {
    CustomPosition,
    DivisionId,
    DivisionSheetData,
    UserTeamsSheetData,
} from '../../_shared/types/league-types';
import type { DraftOrderRow, DraftPickRow, DraftStateRow } from '../../_shared/types/sheets-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';

/**
 * The draft state as the app uses it: the sheet row, plus `currentPick`.
 *
 * `currentPick` is NOT in the sheet -- that column was removed. It is derived from the
 * picks by calculateCurrentPick(), which is why this type lives in the draft domain
 * while DraftStateRow lives with the other sheet shapes.
 */
export interface DraftStateData extends DraftStateRow {
    currentPick: number;
}

/** A pick is exactly a row of the Draft sheet; nothing is derived. */
export type DraftPickData = DraftPickRow;

// NEW: Interface for comparing Firebase vs Sheets data
export interface DraftSyncComparison {
    divisionId: string;
    sheetsState: DraftStateData | null;
    firebaseState: FirebaseDraftState | null;
    sheetsPicks: DraftPickData[];
    firebasePicks: FirebaseDraftPick[];
    differences: DraftSyncDifference[];
    lastSyncedAt?: number;
}

export interface DraftSyncDifference {
    type: 'state' | 'pick' | 'missing-pick' | 'extra-pick';
    field?: string;
    sheetsValue?: any;
    firebaseValue?: any;
    pickNumber?: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
}

export interface FirebaseDraftState {
    currentPick: number;
    currentUserId: string;
    isActive: boolean;
    lastUpdate: number;
    totalPicks?: number;
    syncedFromSheets?: boolean;
}

export interface FirebaseDraftPick {
    pickNumber: number;
    round: number;
    userId: string;
    playerId: number;
    playerCode: number;
    playerName: string;
    teamCode: string;
    teamName: string;
    position: string;
    pickedAt: string;
    divisionId: string;
    timestamp: number;
}

/** A draft order slot is exactly a row of the DraftOrder sheet. */
export type DraftOrderData = DraftOrderRow;

/** A single pick slot in the expanded snake order, before anyone has picked. */
export interface DraftSequenceEntry {
    pickNumber: number;
    round: number;
    userId: string;
    userName: string;
    /** The manager's position in the draft order for this round, after snake reversal. */
    position: number;
}

export type DraftSequence = DraftSequenceEntry[];

/** Where a division's draft has got to. Drives which admin action is offered next. */
export type DraftStage =
    | 'order' // the draft order has not been generated yet
    | 'start' // order exists, draft not started
    | 'running' // picks are being made
    | 'stop' // all picks in, draft not stopped yet
    | 'commit' // stopped, squads not yet written to Firestore
    | 'complete'
    // The status could not be derived (Sheets or Firestore unreachable). Deliberately
    // its own stage: defaulting a failure to 'order' would tell an admin to regenerate
    // a draft order that may already exist.
    | 'unknown';

export interface DraftDivisionStatus {
    doesDraftOrderExists: boolean;
    pickCount: number;
    picksRemaining: number;
    isCommitted: boolean;
}

export type DraftStatusByDivisionId = Partial<Record<DivisionId, DraftDivisionStatus>>;

/**
 * The whole draft's progress, across every division.
 *
 * Distinct from DraftStateData, which is the raw row in the DraftState sheet. This is
 * the derived view the admin dashboard reads -- note `stage`, which exists nowhere in
 * the sheets and is computed from the picks and the commit state.
 */
export interface DraftStatusData {
    stage: DraftStage;
    isComplete: boolean;
    isActive: boolean;
    divisionId: DivisionId | null;
    currentUserId: string | null;
    currentPick: number | null;
    totalPicks: number;
    startedAt: Date | null;
    completedAt: Date | null;
    picksPerTeam: number;
    byDivision: DraftStatusByDivisionId;
}

/** Every draft operation an admin can trigger. */
export type DraftAction =
    | 'generateOrder'
    | 'startDraft'
    | 'stopDraft'
    | 'syncDraft'
    | 'commitTeamsToFirestore'
    | 'reset';

/**
 * How many players a manager has drafted into each position.
 *
 * NOTE: this counts a MANAGER'S SQUAD. It is not the same as how many players are
 * available to pick in each position -- that is PositionAvailabilityCounts below.
 * The two were previously both called `PositionCounts`, which is part of why this
 * file lost its exports.
 */
export interface PositionCounts {
    gk: number;
    cb: number;
    fb: number;
    mid: number;
    wa: number;
    ca: number;
    /** Players beyond a position's maximum, who fill the substitute slot. */
    sub: number;
    total: number;
}

/** How many players a manager has drafted from each real-world club, keyed by team code. */
export type TeamCounts = Record<string, { count: number; teamName: string }>;

/** A manager's squad so far, used to decide whether another player may be drafted. */
export interface SquadComposition {
    positionCounts: PositionCounts;
    teamCounts: TeamCounts;
}

/** How many players are on offer, and how many of those are eligible, per position. */
export type PositionAvailabilityCounts = Partial<Record<CustomPosition, { total: number; eligible: number }>>;

/** The same, per real-world club, keyed by FPL team code. */
export type TeamAvailabilityCounts = Record<number, { total: number; eligible: number }>;

/** Everything the live draft page needs. Returned by `loadDraftData`. */
export interface DraftLoaderData {
    draftState: DraftStateData | undefined;
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
    draftSequence: DraftSequence;
    availablePlayers: EnhancedPlayerData[];
    currentUser: string;
    currentUserInfo: UserTeamsSheetData | undefined;
    isUserTurn: boolean;
    divisions: DivisionSheetData[];
    userTeams: UserTeamsSheetData[];
    selectedDivision: DivisionId;
    selectedUser: string;
    teams: FplTeam[];
    filters: {
        selectedUser: string;
        search: string;
        position: string;
    };
}

/** The result of a draft action. Exactly one of `pick` or `error` is present. */
export interface DraftActionData {
    success?: boolean;
    error?: string;
    pick?: DraftPickData;
}
