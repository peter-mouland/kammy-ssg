/* Location: app/_shared/types/team-types.ts */

// Team Firestore types
export interface FirestoreTeamMember {
    userId: string;
    teamPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca' | 'sub';
    playerPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';
    player: string; // web_name from FPL
    playerId: number; // FPL player code
    playerCode: number; // FPL player code
    onLoanTo: string | null; // userId of team receiving loan
    onLoanStart: string | null; // ISO date string when loan started
    isSub: boolean; // true if on bench
    gameweek: number; // current gameweek (draft = 0)
}

export interface DivisionTeamsDocument {
    divisionId: string;
    gameweek: number;
    lastUpdated: string; // ISO timestamp
    teams: Record<string, FirestoreTeamMember[]>; // userId -> array of team members
    metadata: {
        totalPlayers: number;
        totalTeams: number;
        draftCompleted: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

export interface PlayerLoanUpdate {
    userId: string;
    playerCode: number;
    onLoanTo: string | null;
    onLoanStart: string | null; // ISO date string
}

export interface TeamUpdateParams {
    divisionId: string;
    gameweek?: number;
    userId?: string; // Optional: update specific user only
}

// Query result types
export interface UserTeamSnapshot {
    userId: string;
    players: FirestoreTeamMember[];
    startingXI: FirestoreTeamMember[];
    substitutes: FirestoreTeamMember[];
    loanedOut: FirestoreTeamMember[];
    loanedIn: FirestoreTeamMember[];
}

export interface DivisionSnapshot {
    divisionId: string;
    gameweek: number;
    lastUpdated: string;
    userTeams: UserTeamSnapshot[];
    metadata: {
        totalPlayers: number;
        totalTeams: number;
        draftCompleted: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

// Position constraints
export const POSITION_LIMITS = {
    gk: 1,
    cb: 2,
    fb: 2,
    mid: 2,
    wa: 2,
    ca: 2
} as const;

export const POSITION_PRIORITY = {
    gk: 1,
    cb: 2,
    fb: 3,
    mid: 4,
    wa: 5,
    ca: 6
} as const;

// Utility types
export type PlayerPosition = keyof typeof POSITION_LIMITS;
export type TeamPosition = PlayerPosition | 'sub';
