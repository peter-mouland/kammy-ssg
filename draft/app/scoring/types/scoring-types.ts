// /scoring/types/scoring-types.ts

// ================================
// CORE SCORING TYPES
// ================================

/**
 * Custom position types for our fantasy system
 */
export type CustomPosition = 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';

/**
 * Player stats for a single gameweek
 */
export interface PlayerGameweekStatsData {
    appearance: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    penaltiesSaved: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    bonus: number;
}

/**
 * Extended gameweek stats with additional metadata
 */
export interface ExtendedPlayerGameweekStatsData extends PlayerGameweekStatsData {
    playerId?: string;
    gameweek?: number;
    fixtureMinutes?: number;
    updatedAt?: Date;
}

/**
 * Points breakdown for a player (gameweek or season)
 */
export interface PointsBreakdown {
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

/**
 * Detailed breakdown with formulas and relevance info
 */
export interface DetailedPointsBreakdown {
    [key: string]: {
        label: string;
        stat: number;
        points: number;
        formula: string | string[];
        isRelevant: boolean;
    };
}

/**
 * Fixture information for gameweek calculations
 */
export interface GameweekFixture {
    fixtureId: number;
    gameweek: number;
    fixtureMinutes: number;
    opponent: number;
    wasHome: boolean;
    teamHScore: number;
    teamAScore: number;
}

// ================================
// SCORING RULES & CONFIGURATION
// ================================

/**
 * Appearance point rules
 */
export interface AppearanceRules {
    under45Min: number;
    over45Min: number;
}

/**
 * Position-specific scoring rules
 */
export interface PositionScoringRules {
    goalPoints: number;
    assists: number;
    yellowCard: number;
    redCardPenalty: number;
    appearance: AppearanceRules;
    cleanSheetPoints?: number;
    goalsConcededPenalty?: number;
    savesThreshold?: number;
    savesRatio?: number;
    penaltiesSaved?: number;
    bonus?: number;
}

/**
 * Complete position rules configuration
 */
export interface ScoringRulesConfig {
    gk: PositionScoringRules;
    fb: PositionScoringRules;
    cb: PositionScoringRules;
    mid: PositionScoringRules;
    wa: PositionScoringRules;
    ca: PositionScoringRules;
}

// ================================
// GAMEWEEK POINTS SERVICE TYPES
// ================================

/**
 * Metadata about gameweek points generation
 */
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

/**
 * Result of a gameweek points update operation
 */
export interface GameweekUpdateResult {
    updated: boolean;
    reason: string;
    gameweeksGenerated: number[];
    playerCount: number;
    previousGameweek?: number;
    currentGameweek: number;
}

/**
 * Status of gameweek points generation
 */
export interface GameweekPointsStatus {
    lastGenerated: string | null;
    lastGameweek: number;
    currentGameweek: number;
    needsUpdate: boolean;
    reason: string;
}

/**
 * Parameters for points update operations
 */
export interface PointsUpdateParams {
    needed: boolean;
    reason: string;
    gameweeksToGenerate: number[];
}

// ================================
// FPL DATA INTEGRATION TYPES
// ================================

/**
 * FPL API gameweek data structure
 */
export interface FplPlayerGameweekData {
    element: number; // player ID
    fixture: number;
    opponent_team: number;
    total_points: number;
    was_home: boolean;
    kickoff_time: string;
    team_h_score: number;
    team_a_score: number;
    round: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
}

/**
 * FPL player season data structure
 */
export interface FplPlayerSeasonData {
    history: FplPlayerGameweekData[];
    history_past: any[];
    fixtures: any[];
}

// ================================
// ENHANCED PLAYER DATA TYPES
// ================================

/**
 * Gameweek stat with calculated points
 */
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
    customPoints: PointsBreakdown | null;

    // FPL original points
    fplPoints: number;

    // Metadata
    generatedAt: string | null;
}

/**
 * Season totals with performance metrics
 */
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

/**
 * Complete player detail data with scoring information
 */
export interface PlayerDetailData {
    player: any; // FPL player data
    team: {
        id: number;
        name: string;
        short_name: string;
    };
    position: string;
    gameweekStats: GameweekStatWithPoints[];
    seasonTotals: SeasonTotals;
    currentGameweek: number;
}

/**
 * Enhanced player data with draft information
 */
export interface EnhancedPlayerData {
    // Base FPL player data
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
    [key: string]: any; // Allow other FPL properties

    // Enhanced draft data
    draft: {
        position: string;
        pointsTotal: number;
        pointsBreakdown: DetailedPointsBreakdown;
        gameweekPoints?: Record<number, PointsBreakdown>;
        __generatedFor?: {
            gameweeks?: number[];
            generatedAt: string;
            type: 'selective' | 'full';
        };
    };
}

// ================================
// DATA GENERATION TYPES
// ================================

/**
 * Parameters for generating gameweek data
 */
export interface GameweekDataParams {
    targetGameweeks: number[];
    currentGameweek: number;
}

/**
 * Result of gameweek data generation
 */
export interface GameweekDataResult {
    playerCount: number;
    gameweeksGenerated: number[];
    generatedAt: string;
}

/**
 * Parameters for season data generation
 */
export interface SeasonDataParams {
    includeBreakdown?: boolean;
    targetGameweeks?: number[];
}

// ================================
// UTILITY TYPES
// ================================

/**
 * Stat relevance checker function type
 */
export type StatRelevanceChecker = (stat: string, position: string) => boolean;

/**
 * Position display configuration
 */
export interface PositionDisplayConfig {
    name: string;
    shortName: string;
    color: string;
    order: number;
}

/**
 * Points display formatting options
 */
export interface PointsDisplayOptions {
    showPrefix?: boolean;
    decimalPlaces?: number;
    colorize?: boolean;
}

// ================================
// VALIDATION TYPES
// ================================

/**
 * Scoring rule validation result
 */
export interface ScoringRuleValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Gameweek data validation result
 */
export interface GameweekDataValidation {
    isComplete: boolean;
    missingPlayers: number[];
    incompleteGameweeks: number[];
    dataQualityScore: number;
}

// ================================
// EXPORT HELPERS
// ================================

/**
 * Type guard to check if a position is valid
 */
export function isValidCustomPosition(position: string): position is CustomPosition {
    return ['gk', 'fb', 'cb', 'mid', 'wa', 'ca'].includes(position.toLowerCase());
}

/**
 * Type guard to check if points breakdown is complete
 */
export function isCompletePointsBreakdown(breakdown: any): breakdown is PointsBreakdown {
    return breakdown &&
        typeof breakdown.total === 'number' &&
        typeof breakdown.appearance === 'number' &&
        typeof breakdown.goals === 'number';
}
