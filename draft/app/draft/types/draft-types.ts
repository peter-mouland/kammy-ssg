// app/draft/types/draft-types.ts
/** biome-ignore-all lint/style/useNamingConvention: <fpl init> */

import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { DraftStatusByDivisionId } from '../../admin/types/admin-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';

/**
 * Draft domain type definitions
 * Contains all types related to the drafting process
 */

export type DraftSequence = Array<{ pick: number; userId: string; userName: string }>;

export interface DraftLoaderData {
    draftState: DraftStateData | null;
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
    availablePlayers: EnhancedPlayerData[];
    currentUser: string;
    isUserTurn: boolean;
    divisions: DivisionSheetData[];
    userTeams: UserTeamsSheetData[];
    selectedDivision: DivisionId;
    selectedUser: string;
    draftSequence: DraftSequence;
    teams: FplTeam[];
    filters: {
        selectedUser: string;
        search: string;
        position: string;
    };
}

export interface DraftActionData {
    success?: boolean;
    error?: string;
    pick?: DraftPickData;
    action?: string;
}

export interface DraftPickData {
    pickNumber: number;
    round: number;
    userId: string;
    playerId: number;
    playerCode: number;
    playerName: string;
    teamCode: number;
    teamName: string;
    position: string;
    pickedAt: Date;
    divisionId: DivisionId;
}

export interface DraftStateData {
    isActive: boolean;
    currentPick: number;
    currentUserId: string;
    currentDivisionId: DivisionId;
    picksPerTeam: number;
    startedAt: Date | null;
    completedAt: Date | null;
}

export type DraftAction =
    | 'generateOrder'
    | 'startDraft'
    | 'stopDraft'
    | 'syncDraft'
    | 'commitTeamsToFirestore'
    | 'reset';

export interface DraftStatusData {
    stage: 'order' | 'running' | 'commit' | 'complete' | 'stop' | 'start';
    isComplete: boolean;
    isActive: boolean;
    totalPicks: number;
    currentPick: number | null;
    currentUserId: string | null;
    currentDivisionId: DivisionId | null;
    picksPerTeam: number;
    startedAt: Date | null;
    completedAt: Date | null;
    byDivision: DraftStatusByDivisionId;
}

export interface DraftOrderData {
    divisionId: DivisionId;
    position: number;
    userId: string;
    userName: string;
    generatedAt: Date;
}

export interface PositionCounts {
    gk: number;
    cb: number;
    fb: number;
    mid: number;
    wa: number;
    ca: number;
    sub: number;
    total: number;
}

export interface TeamCounts {
    [teamCode: number]: {
        count: number;
        teamName: string;
    };
}

export type SquadComposition = {
    positionCounts: PositionCounts;
    teamCounts: TeamCounts;
};
