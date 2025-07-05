// app/draft/types/draft-types.ts
/** biome-ignore-all lint/style/useNamingConvention: <fpl init> */

import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
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
