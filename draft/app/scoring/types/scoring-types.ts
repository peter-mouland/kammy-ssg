// app/scoring/types/scoring-types.ts

import type { CustomPosition } from '../../players/types/player-types';

export interface Points {
    appearance: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    goalsConceded: number;
    bonus: number;
    total: number;
}

// ================================
// ENHANCED PLAYER DATA TYPES
// ================================

export interface GameweekStatWithPoints {
    gameweek: number;
    // Basic stats
    minutes: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    bonus: number;

    // Match info
    opponent: number;
    opponentName: string;
    wasHome: boolean;
    teamHScore: number;
    teamAScore: number;

    // Points breakdown
    customPoints: number | null;

    // FPL original points
    fplPoints: number;

    // Metadata
    generatedAt: string | null;
}

export interface SeasonTotals {
    // Basic stats
    gamesPlayed: number;
    totalMinutes: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    bonus: number;

    // Points
    totalFplPoints: number;
    totalCustomPoints: number;

    // Averages
    averageMinutes: number;
    averageFplPoints: number;
    averageCustomPoints: number;

    // Performance metrics
    goalsPerGame: number;
    assistsPerGame: number;
    cleanSheetPercentage: number;
}

interface PointsBreakdown {
    appearance: PointsBreakdownItem;
    goals: PointsBreakdownItem;
    assists: PointsBreakdownItem;
    cleanSheets: PointsBreakdownItem;
    yellowCards: PointsBreakdownItem;
    redCards: PointsBreakdownItem;
    saves: PointsBreakdownItem;
    penaltiesSaved: PointsBreakdownItem;
    goalsConceded: PointsBreakdownItem;
    bonus: PointsBreakdownItem;
    total: PointsBreakdownItem;
}

export interface PointsBreakdownItem {
    label: string;
    isRelevant?: boolean;
    points: number;
    stat: number;
    formula: string | string[];
}

export interface EnhancedPlayerData {
    // Base FPL player data
    id: number;
    code: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team_code: number;

    // Enhanced draft data
    draft: {
        position: CustomPosition;
        pointsTotal: number;
        pointsBreakdown: PointsBreakdown;
        __generatedFor?: {
            gameweeks?: number[];
            generatedAt: string;
            type: 'selective' | 'full' | 'season';
        };
    };
}

export type PlayersByCode = Record<EnhancedPlayerData['code'], EnhancedPlayerData>;
