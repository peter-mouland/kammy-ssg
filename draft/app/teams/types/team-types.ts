// app/teams/types/team-types.ts

import type { PlayerGameweekStatsData } from '../../players/types/player-types';
import type { Points, PointsBreakdown } from '../../scoring/types/scoring-types';

/**
 * Core team and division data structures
 */
export interface DivisionSheetData {
    id: DivisionId;
    label: string;
    order: number;
}

export interface UserTeamsSheetData {
    userId: string;
    userName: string;
    teamName: string;
    divisionId: DivisionId;
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
    | 'sub_0';

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
/**
 * Team position slot with player data and points
 */
export interface TeamPositionSlot {
    // Player info (from draft/transfers)
    player: {
        playerId: number; // FPL player ID
        playerCode: number; // FPL player code at time of assignment
        playerName: string; // web_name at time of assignment
        playerPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca'; // sheets position
        teamPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca' | 'sub'; // actual team slot
        teamSlotIndex: number; // 0-based index within position
        isSub: boolean;
        onLoanTo: string | null; // userId
        onLoanStart: string | null; // ISO date string
        assignedAt: string; // ISO date when assigned to this slot
    };

    // Points data per gameweek
    gameweek: {
        stats: PlayerGameweekStatsData;
        points: Points;
    };

    // Season totals for this position slot
    season: {
        stats: PlayerGameweekStatsData; // cumulative stats
        points: Points; // cumulative points
    };
}

/**
 * Team roster structure
 */
export type TeamRoster = Record<PositionSlotKey, TeamPositionSlot>

/**
 * Team gameweek data structure
 */
export interface TeamGameweekData {
    gameweek: number;
    roster: TeamRoster;
    lastUpdated: string;
}

/**
 * Division teams document structure
 * MOVED: From shared types to teams domain where it belongs
 */
export interface DivisionTeamsDocument {
    divisionId: string;
    gameweek: number; // Current gameweek being tracked
    lastUpdated: string; // ISO timestamp

    // All teams in the division
    teams: {
        [userId: string]: {
            roster: TeamRoster;
        };
    };

    metadata: {
        createdAt: string;
        updatedAt: string;
        pointsLastUpdated: string | null;
        pointsLastGameweek: number | null;
    };
}

/**
 * Team formation for display components
 */
export interface TeamFormation {
    goalkeeper: TeamPositionSlot[];
    centrebacks: TeamPositionSlot[];
    fullbacks: TeamPositionSlot[];
    midfielders: TeamPositionSlot[];
    wideattackers: TeamPositionSlot[];
    centralattackers: TeamPositionSlot[];
    substitutes: TeamPositionSlot[];
}

/**
 * Loan status for team management
 */
export interface LoanStatus {
    loanedOut: TeamPositionSlot[];
    loanedIn: TeamPositionSlot[];
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
 * Division info for team views
 */
export interface Division {
    id: DivisionId;
    name: string;
}

/**
 * Complete team view data
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
 * Team statistics for performance analysis
 */
export interface TeamStatsData {
    gameweek: number;
    totalPoints: number;
    gameweekPoints: number;
    averagePoints: number;
    startingXIPoints: number;
    benchPoints: number;
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
}

/**
 * Component props interfaces
 */
export type TeamViewProps = {}

export interface FormationDisplayProps {
    roster: TeamRoster;
    gameweek: number;
    isHistorical: boolean;
}

export interface PositionSlotCardProps {
    slot: PositionSlotKey;
    positionSlot: TeamPositionSlot;
    gameweek: number;
    isSubstitute?: boolean;
    showPoints?: boolean;
    isHistorical?: boolean;
}

export interface TeamStatsProps {
    teamData: TeamGameweekData;
    gameweek: number;
    isCurrentGameweek: boolean;
}

export interface GameweekSelectorProps {
    currentGameweek: number;
    selectedGameweek: number;
    availableGameweeks: number[];
    onGameweekChange: (gameweek: number) => void;
}

export interface LoanStatusProps {
    loanedOut: TeamPositionSlot[];
    loanedIn: TeamPositionSlot[];
    gameweek: number;
}

/**
 * Service/API interfaces
 */
export interface DivisionTeamsUpdateParams {
    divisionId: DivisionId;
    gameweek: number;
    userId?: string; // Optional: update specific user only
}

export interface UserTeamRoster {
    userId: string;
    roster: TeamRoster;
}

export interface PlayerAssignmentData {
    playerId: number;
    playerCode: number;
    playerName: string;
    playerPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';
    teamPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca' | 'sub';
    teamSlotIndex: number;
    isSub: boolean;
    onLoanTo: string | null;
    onLoanStart: string | null;
    assignedAt: string;
}

export interface LoanUpdateOperation {
    userId: string;
    positionSlot: PositionSlotKey;
    onLoanTo: string | null;
    onLoanStart: string | null;
}

export interface PositionPointsUpdate {
    positionSlot: PositionSlotKey;
    gameweekStats: PlayerGameweekStatsData;
    gameweekPoints: PointsBreakdown;
    seasonStats: PlayerGameweekStatsData;
    seasonPoints: PointsBreakdown;
}

/**
 * Legacy types for migration support
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
 * Type guards and utility functions
 */
export function isValidPositionSlot(slot: string): slot is PositionSlotKey {
    const validSlots: PositionSlotKey[] = [
        'gk_0',
        'cb_0',
        'cb_1',
        'fb_0',
        'fb_1',
        'mid_0',
        'mid_1',
        'wa_0',
        'wa_1',
        'ca_0',
        'ca_1',
        'sub_0',
    ];
    return validSlots.includes(slot as PositionSlotKey);
}

export function isSubstituteSlot(slot: PositionSlotKey): boolean {
    return slot.startsWith('sub');
}

export function getPositionFromSlot(slot: PositionSlotKey): string {
    if (slot.startsWith('gk')) return 'gk';
    if (slot.startsWith('cb')) return 'cb';
    if (slot.startsWith('fb')) return 'fb';
    if (slot.startsWith('mid')) return 'mid';
    if (slot.startsWith('wa')) return 'wa';
    if (slot.startsWith('ca')) return 'ca';
    if (slot.startsWith('sub')) return 'sub';
    return 'unknown';
}
