// app/teams/types/team-types.ts

export interface DivisionData {
    id: string;
    label: string;
    order: number;
}

export interface UserTeamData {
    userId: string;
    userName: string;
    teamName: string;
    fplId: string;
    divisionId: string;
    currentGwPoints: number;
    totalPoints: number;
    overallRank: number;
    leagueRank: number;
    lastUpdated: Date;
}

export interface WeeklyPointsData {
    userId: string;
    gameweek: number;
    points: number;
    transfers: number;
    hits: number;
    captain: string;
    viceCaptain: string;
    benchBoost: boolean;
    tripleCaptain: boolean;
    wildcard: boolean;
    freeHit: boolean;
    dateRecorded: Date;
}
