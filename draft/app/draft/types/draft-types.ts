// app/draft/types/draft-types.ts
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { DivisionId, DivisionSheetData } from '../../teams/types/team-types';
import type { UserTeamsSheetData } from '../../teams/types/team-types';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';


/**
 * Draft domain type definitions
 * Contains all types related to the drafting process
 */

export type DraftSequence = Array<{ pick: number; userId: string; userName: string }>;

export interface DraftLoaderData {
    draftState: DraftStateData | null;
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
    availablePlayers:  EnhancedPlayerData[];
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
    playerId: string;
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

/**
 * Draft room state for real-time updates
 */
export interface DraftRoom {
    divisionId: string;
    isActive: boolean;
    currentPick: number;
    currentUserId: string;
    totalPicks: number;
    draftOrder: DraftOrderData[];
    availablePlayers: DraftPlayer[];
    draftedPlayers: DraftPickData[];
    timePerPick: number;
    pickDeadline?: Date;
}

/**
 * Player with draft-specific information
 */
export interface DraftPlayer {
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
    teamCode: number;
    teamName: string;
    position: string;
    isAvailable: boolean;
    isDrafted: boolean;
    draftedBy?: string;
    draftRound?: number;
    draftPick?: number;
    draft: {
        position: string;
        pointsTotal: number;
    };
}

/**
 * Position slot for team formation display
 */
export interface DraftPositionSlot {
    id: string;
    position: string;
    player?: DraftPickData;
    isEmpty: boolean;
}

/**
 * Team formation for draft display
 */
export interface TeamFormation {
    userId: string;
    userName: string;
    positions: {
        gk: DraftPositionSlot[];
        cb: DraftPositionSlot[];
        fb: DraftPositionSlot[];
        mid: DraftPositionSlot[];
        wa: DraftPositionSlot[];
        ca: DraftPositionSlot[];
        sub: DraftPositionSlot[];
    };
}

/**
 * Draft team component props
 */
export interface DraftTeamProps {
    userId: string;
    userName: string;
    draftPicks: DraftPickData[];
    isCompact?: boolean;
}

/**
 * Draft teams view props
 */
export interface DraftTeamsProps {
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
}

/**
 * Server-sent event types for draft updates
 */
export interface DraftUpdateMessage {
    type: 'draft-update';
    data: {
        currentPick: number;
        currentUserId: string;
        pickDeadline?: Date;
        recentPicks: DraftPickData[];
    };
    timestamp: Date;
}

export interface PickMadeMessage {
    type: 'pick-made';
    data: DraftPickData;
    timestamp: Date;
}

export interface TurnChangeMessage {
    type: 'turn-change';
    data: {
        newUserId: string;
        pickNumber: number;
        pickDeadline: Date;
    };
    timestamp: Date;
}

export interface DraftCompleteMessage {
    type: 'draft-complete';
    data: {
        completedAt: Date;
        finalPicks: DraftPickData[];
    };
    timestamp: Date;
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
