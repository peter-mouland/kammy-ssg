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
// SCORING RULES TYPES
// ================================

export interface PositionScoringRules {
    appearance?: number;
    goals?: number;
    assists?: number;
    cleanSheets?: number;
    goalsConceded?: number;
    goalsConcededPenalty?: number;
    savesThreshold?: number;
    savesRatio?: number;
    penaltiesSaved?: number;
    bonus?: number;
}

export interface ScoringRulesConfig {
    gk: PositionScoringRules;
    fb: PositionScoringRules;
    cb: PositionScoringRules;
    mid: PositionScoringRules;
    wa: PositionScoringRules;
    ca: PositionScoringRules;
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

export interface PointsBreakdown {
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

// ================================
// DATA GENERATION TYPES
// ================================

export interface GameweekDataParams {
    targetGameweeks: number[];
    currentGameweek: number;
}

export interface GameweekDataResult {
    playerCount: number;
    gameweeksGenerated: number[];
    generatedAt: string;
}

export interface SeasonDataParams {
    includeBreakdown?: boolean;
    targetGameweeks?: number[];
}

// ================================
// GAMEWEEK POINTS SERVICE TYPES
// ================================

export interface GameweekPointsMetadata {
    lastGeneratedGameweek: number;
    lastGeneratedAt: string;
    currentGameweek: number;
    generationHistory: Array<{
        gameweek: number;
        generatedAt: string;
        playerCount: number;
        type: 'full' | 'selective';
    }>;
}

export interface GameweekUpdateResult {
    updated: boolean;
    reason: string;
    gameweeksGenerated: number[];
    playerCount: number;
    previousGameweek?: number;
    currentGameweek: number;
}

export interface GameweekPointsStatus {
    lastGenerated: string | null;
    lastGameweek: number;
    currentGameweek: number;
    needsUpdate: boolean;
    reason: string;
}

export interface PointsUpdateParams {
    needed: boolean;
    reason: string;
    gameweeksToGenerate: number[];
}

// ================================
// UTILITY TYPES
// ================================

export type StatRelevanceChecker = (stat: string, position: CustomPosition) => boolean;

export interface PositionDisplayConfig {
    name: string;
    shortName: string;
    color: string;
    order: number;
}

export interface PointsDisplayOptions {
    showPrefix?: boolean;
    decimalPlaces?: number;
    colorize?: boolean;
}

// ================================
// VALIDATION TYPES
// ================================

export interface ScoringRuleValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface GameweekDataValidation {
    isComplete: boolean;
    missingPlayers: number[];
    incompleteGameweeks: number[];
    dataQualityScore: number;
}

// ================================
// TYPE GUARDS (functions belong in utils, not types file)
// ================================
// REMOVED: Functions don't belong in types files
// These should be moved to app/scoring/utils/type-guards.ts
