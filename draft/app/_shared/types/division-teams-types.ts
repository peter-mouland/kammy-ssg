// app/_shared/types/division-teams-types.ts

import type { PlayerGameweekStatsData } from '../../players/types/player-types';
import type { PointsBreakdown } from '../../scoring/types/scoring-types';

/**
 * Position slot identifier (e.g., "gk_0", "cb_0", "cb_1", "sub_0")
 */
export type PositionSlotKey = "gk_0" | "sub_0" | "cb_0" | "cb_1" | "fb_0" | "fb_1" | "mid_0" | "mid_1" | "wa_0" | "wa_1" | "ca_0" | "ca_1";

/**
 * Player information and points for a specific position slot
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
        points: PointsBreakdown;
    };

    // Season totals for this position slot
    season: {
        stats: PlayerGameweekStatsData; // cumulative stats
        points: PointsBreakdown; // cumulative points
    };
}

type Roster = Record<PositionSlotKey, TeamPositionSlot>

/**
 * Complete division teams document structure
 */
export interface DivisionTeamsDocument {
    divisionId: string;
    gameweek: number; // Current gameweek being tracked
    lastUpdated: string; // ISO timestamp

    // All teams in the division
    teams: {
        [userId: string]: {
            roster: Roster;
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
 * User team snapshot from division document
 */
export interface UserTeamRoster {
    userId: string;
    roster: Roster;
}

/**
 * Team data for specific gameweek (what components expect)
 */
export interface TeamGameweekData {
    gameweek: number;
    roster: Roster;
    lastUpdated: string;
}

/**
 * Update parameters for division teams
 */
export interface DivisionTeamsUpdateParams {
    divisionId: string;
    gameweek: number;
    userId?: string; // Optional: update specific user only
}

/**
 * Player transfer/assignment data
 */
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

/**
 * Loan update operation
 */
export interface LoanUpdateOperation {
    userId: string;
    positionSlot: PositionSlotKey;
    onLoanTo: string | null;
    onLoanStart: string | null;
}

/**
 * Points update operation
 */
export interface PositionPointsUpdate {
    positionSlot: PositionSlotKey;
    gameweekStats: PlayerGameweekStatsData;
    gameweekPoints: PointsBreakdown;
    seasonStats: PlayerGameweekStatsData;
    seasonPoints: PointsBreakdown;
}
