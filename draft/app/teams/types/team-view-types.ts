// app/teams/types/team-view-types.ts
import type {
    PositionSlot,
    TeamPositionSlot,
    TeamGameweekData
} from '../../_shared/types/division-teams-types';

/**
 * Current user information
 */
export interface CurrentUser {
    id: string;
    userName: string;
    teamName: string;
}

/**
 * Division information
 */
export interface Division {
    id: string;
    name: string;
}

/**
 * Formation organized by position groups for display
 */
export interface TeamFormation {
    goalkeeper: TeamPositionSlot[];
    centrebacks: TeamPositionSlot[];
    fullbacks: TeamPositionSlot[];
    midfielders: TeamPositionSlot[]; // This might be empty in new structure
    wideattackers: TeamPositionSlot[];
    centralattackers: TeamPositionSlot[];
}

/**
 * Loan status information
 */
export interface LoanStatus {
    loanedOut: TeamPositionSlot[];
    loanedIn: TeamPositionSlot[];
}

/**
 * Team statistics for display
 */
export interface TeamStatsData {
    gameweek: number;
    totalPoints: number;
    gameweekPoints: number;
    averagePoints: number;
    startingXIPoints: number;
    benchPoints: number;
    topScorer: {
        slot: PositionSlot;
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
}

/**
 * Complete team view data structure
 */
export interface TeamViewData {
    currentUser: CurrentUser;
    division: Division;
    currentGameweek: number;
    currentTeam: TeamGameweekData;
    gameweekHistory: TeamGameweekData[];
    availableGameweeks: number[];
}

/**
 * Team view component props
 */
export interface TeamViewProps {
    // Props will be extracted from useLoaderData
}

/**
 * Formation display props
 */
export interface FormationDisplayProps {
    roster: Record<PositionSlot, TeamPositionSlot>;
    gameweek: number;
    isHistorical: boolean;
}

/**
 * Player card props for position slot
 */
export interface PositionSlotCardProps {
    slot: PositionSlot;
    positionSlot: TeamPositionSlot;
    gameweek: number;
    isSubstitute?: boolean;
    showPoints?: boolean;
    isHistorical?: boolean;
}

/**
 * Team stats component props
 */
export interface TeamStatsProps {
    teamData: TeamGameweekData;
    gameweek: number;
    isCurrentGameweek: boolean;
}

/**
 * Gameweek selector props
 */
export interface GameweekSelectorProps {
    currentGameweek: number;
    selectedGameweek: number;
    availableGameweeks: number[];
    onGameweekChange: (gameweek: number) => void;
}

/**
 * Loan status component props
 */
export interface LoanStatusProps {
    loanedOut: TeamPositionSlot[];
    loanedIn: TeamPositionSlot[];
    gameweek: number;
}

/**
 * Legacy compatibility types (for gradual migration)
 */
export interface LegacyPlayerData {
    playerCode: number;
    player: string;
    teamPosition: string;
    playerPosition: string;
    isSub: boolean;
    onLoanTo: string | null;
    onLoanStart: string | null;
    gameweek: number;
    userId: string;
}

/**
 * Helper type for converting between old and new structures
 */
export interface MigrationHelpers {
    convertLegacyToRoster: (players: LegacyPlayerData[]) => Record<PositionSlot, TeamPositionSlot>;
    convertRosterToFormation: (roster: Record<PositionSlot, TeamPositionSlot>) => TeamFormation;
    extractLoanStatus: (roster: Record<PositionSlot, TeamPositionSlot>, currentUserId: string) => LoanStatus;
}
