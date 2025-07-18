// app/draft/types/draft-types.ts
// Updated to support multiple divisions

import type { DivisionId } from '../../teams/types/team-types';

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
    playerId: string;
    playerCode: string;
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
    playerId: string;
    playerCode: string;
    playerName: string;
    teamCode: string;
    teamName: string;
    position: string;
    pickedAt: string;
    divisionId: string;
    timestamp: number;
}
