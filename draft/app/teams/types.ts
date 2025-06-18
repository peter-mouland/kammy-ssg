/* Location: app/teams/types/index.ts */

// Team component types
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

export interface TeamData {
    gameweek: number;
    players: FirestoreTeamMember[];
    lastUpdated: string;
}

export interface CurrentUser {
    id: string;
    userName: string;
    teamName: string;
    email?: string;
}

export interface Division {
    id: string;
    name: string;
    description?: string;
}

export interface TeamViewData {
    currentUser: CurrentUser;
    division: Division;
    currentGameweek: number;
    currentTeam: TeamData;
    gameweekHistory: TeamData[];
    availableGameweeks: number[];
}

export interface FormationData {
    goalkeeper: FirestoreTeamMember[];
    defenders: FirestoreTeamMember[];
    midfielders: FirestoreTeamMember[];
    forwards: FirestoreTeamMember[];
}

export interface TeamStats {
    totalPlayers: number;
    startingXI: number;
    substitutes: number;
    loanedOut: number;
    loanedIn: number;
    lastUpdated: string;
}

// Server-side types
export interface TeamRouteData {
    success: boolean;
    data?: TeamViewData;
    error?: string;
}
