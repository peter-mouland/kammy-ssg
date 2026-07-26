// app/draft/types/draft-types.ts
// Updated to support multiple divisions

import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition } from '../../players/types/player-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';

export interface DraftStateData {
    divisionId: DivisionId; // Division identifier
    isActive: boolean;
    currentPick: number; // CALCULATED: Computed from picks data, not stored in sheets
    currentUserId: string;
    picksPerTeam: number;
    startedAt: Date | null;
    completedAt: Date | null;
}

export interface DraftPickData {
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
    divisionId: string;
}

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

/**
 * One manager's slot in a division's draft order, as stored in the DraftOrder sheet.
 * `position` is 1-based; the snake reverses it on even rounds.
 */
export interface DraftOrderData {
    divisionId: DivisionId;
    position: number;
    userId: string;
    userName: string;
    generatedAt: Date;
}

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
