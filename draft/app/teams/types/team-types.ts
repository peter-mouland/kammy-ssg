// app/teams/types/team-types.ts
/** biome-ignore-all lint/style/useNamingConvention: <explanation> */

import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type {
    DivisionId,
    DivisionSheetData,
    ManagerId,
    PositionSlotKey,
    UserTeamsSheetData,
} from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { RosterPlayer, TeamPositionSlot, TeamRoster } from '../../_shared/types/squad-types';
import type { TeamOfTheWeekData } from '../../leagues';
import type { AllTeamsData } from './team-view-types';

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
