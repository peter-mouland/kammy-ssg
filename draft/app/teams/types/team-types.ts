// app/teams/types/team-types.ts
/** biome-ignore-all lint/style/useNamingConvention: <explanation> */

import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition, PlayerGameweekStatsData } from '../../players/types/player-types';
import type { EnhancedPlayerData, Points } from '../../scoring/types/scoring-types';
import type { TeamOfTheWeekData } from '../../leagues/types/league-standings-types';
import type { AllTeamsData } from './team-view-types';

export type ManagerId = string;

/**
 * Core team and division data structures
 */
export interface DivisionSheetData {
    id: DivisionId;
    label: string;
    order: number;
}

export interface UserTeamsSheetData {
    userId: ManagerId;
    userName: string;
    teamName: string;
    divisionId: DivisionId;
    lastUpdated: Date;
}

/**
 * Position slot types for team formations
 * NOTE: Using underscore notation to match existing codebase (gk_0, cb_0, etc)
 */
export type PositionSlotKey =
    | 'gk_0'
    | 'cb_0'
    | 'cb_1'
    | 'fb_0'
    | 'fb_1'
    | 'mid_0'
    | 'mid_1'
    | 'wa_0'
    | 'wa_1'
    | 'ca_0'
    | 'ca_1'
    | 'sub_0'
    | 'on_loan_0';

export type RosterPosition = 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca' | 'sub' | 'on_loan';

export type RosterPlayer = {
    playerId: number; // FPL player ID
    playerCode: number; // FPL player code at time of assignment
    playerName: string; // web_name at time of assignment
    playerPosition: CustomPosition; // sheets position
    teamPosition: RosterPosition; // actual team slot
    teamSlotIndex: number; // 0-based index within position
    isSub: boolean;
    onLoanTo: string | null; // userId
    onLoanFrom: string | null; // userId of team lending player (NEW)
    onLoanStart: string | null; // ISO date string
    assignedAt: string; // ISO date when assigned to this slot
};

/**
 * Team position slot with player data and points
 */
export interface TeamPositionSlot {
    // Player info (from draft/transfers)
    player: RosterPlayer;

    // Points data per gameweek
    gameweek: {
        stats: PlayerGameweekStatsData;
        points: Points;
    };

    // Season totals for this position slot
    season: {
        stats: PlayerGameweekStatsData; // cumulative stats
        points: Points; // cumulative points
        seasonUpToGameweek: number; // highest gameweek included in season totals (0 = no gameweeks included)
        seasonGeneratedOn: string; // ISO date when season totals were last updated
    };
}

/**
 * Team roster structure
 */
export type TeamRoster = {
    ca_0: TeamPositionSlot;
    ca_1: TeamPositionSlot;
    cb_0: TeamPositionSlot;
    cb_1: TeamPositionSlot;
    fb_0: TeamPositionSlot;
    fb_1: TeamPositionSlot;
    gk_0: TeamPositionSlot;
    mid_0: TeamPositionSlot;
    mid_1: TeamPositionSlot;
    on_loan_0?: TeamPositionSlot;
    sub_0: TeamPositionSlot;
    wa_0: TeamPositionSlot;
    wa_1: TeamPositionSlot;
};

/**
 * Team gameweek data structure
 */
export interface TeamGameweekData {
    gameweek: number;
    roster: TeamRoster;
    lastUpdated: string;
}

export type RosterByManagerId = {
    [userId: ManagerId]: {
        roster: TeamRoster;
    };
};

/**
 * Division teams document structure
 * MOVED: From shared types to teams domain where it belongs
 */
export interface DivisionTeamsDocument {
    divisionId: DivisionId;
    gameweek: number; // Current gameweek being tracked
    lastUpdated: string; // ISO timestamp

    // All teams in the division
    teams: RosterByManagerId;

    metadata: {
        createdAt: string;
        updatedAt: string;
        pointsLastUpdated: string | null;
        pointsLastGameweek: number | null;
    };
}

/**
 * Loan status for team management
 */
export interface LoanStatus {
    loanedOut: RosterPlayer[];
    loanedIn: RosterPlayer[];
}

export type DivisionId = 'leagueOne' | 'championship' | 'premierLeague';

/**
 * Current user info for team views
 */
export interface CurrentUser {
    id: string;
    divisionId: DivisionId;
    userName: string;
    teamName: string;
}

/**
 * Complete team view data
 */
// currentUser, division, currentTeam, allTeamsData
export interface TeamViewData {
    currentUser?: UserTeamsSheetData;
    division?: DivisionSheetData;
    currentGameweek: number;
    currentGameweekData: GameWeekData;
    selectedGameweekData: GameWeekData;
    currentTeam?: TeamGameweekData;
    availableGameweeks: number[];
    allTeamsData?: AllTeamsData;
    teamsByCode: Record<number, FplTeam>;
    fplPlayersByCode: Record<number, EnhancedPlayerData>;
    userTeams: UserTeamsSheetData[];
    teamOfTheWeek?: TeamOfTheWeekData;
}

/**
 * Team statistics for performance analysis
 */
export interface TeamStatsData {
    gameweek: number;
    totalPoints: number;
    gameweekPoints: number;
    averagePoints: number;
    topScorer: {
        slot: PositionSlotKey;
        player: TeamPositionSlot;
        points: number;
    } | null;
    positionBreakdown: {
        [position: string]: {
            points: number;
            players: number;
            averagePoints: number;
        };
    };
    contributingStats: ContributingStatsBreakdown;
}

/**
 * Component props interfaces
 */
export type StatsViewMode = 'season' | 'gameweek';

export interface FormationDisplayProps {
    roster: TeamRoster;
    gameweek: number;
    isHistorical: boolean;
    viewMode?: StatsViewMode;
}

export interface PositionSlotCardProps {
    slot: PositionSlotKey;
    positionSlot: TeamPositionSlot;
    gameweek: number;
    isSubstitute?: boolean;
    showPoints?: boolean;
    isHistorical?: boolean;
    viewMode?: StatsViewMode;
}

export interface TeamStatsProps {
    teamData: TeamGameweekData;
    gameweek: number;
    isCurrentGameweek: boolean;
    viewMode: StatsViewMode;
}

export interface ContributingStatsProps {
    statsBreakdown: ContributingStatsBreakdown;
    viewMode: StatsViewMode;
    isExpanded: boolean;
    onToggleExpanded: () => void;
}

// app/teams/types/team-types.ts - Add these interfaces to the existing file

/**
 * Contributing stats breakdown for the team
 */
interface ContributingStatsBreakdown {
    appearance: ContributingStatItem;
    goals: ContributingStatItem;
    assists: ContributingStatItem;
    cleanSheets: ContributingStatItem;
    yellowCards: ContributingStatItem;
    redCards: ContributingStatItem;
    saves: ContributingStatItem;
    penaltiesSaved: ContributingStatItem;
    goalsConceded: ContributingStatItem;
    bonus: ContributingStatItem;
}

/**
 * Individual contributing stat item
 */
interface ContributingStatItem {
    label: string;
    statValue: number;
    pointsValue: number;
    isRelevant: boolean;
    description: string;
}
