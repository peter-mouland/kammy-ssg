// /scoring/index.ts - Main scoring domain exports

// ================================
// TYPES
// ================================
export type {
    // Core scoring types
    CustomPosition,
    PlayerGameweekStatsData,
    ExtendedPlayerGameweekStatsData,
    PointsBreakdown,
    DetailedPointsBreakdown,
    GameweekFixture,

    // Scoring rules & configuration
    AppearanceRules,
    PositionScoringRules,
    ScoringRulesConfig,

    // Gameweek points service types
    GameweekPointsMetadata,
    GameweekUpdateResult,
    GameweekPointsStatus,
    PointsUpdateParams,

    // FPL data integration
    FplPlayerGameweekData,
    FplPlayerSeasonData,

    // Enhanced player data
    GameweekStatWithPoints,
    SeasonTotals,
    PlayerDetailData,
    EnhancedPlayerData,

    // Data generation
    GameweekDataParams,
    GameweekDataResult,
    SeasonDataParams,

    // Utilities
    StatRelevanceChecker,
    PositionDisplayConfig,
    PointsDisplayOptions,

    // Validation
    ScoringRuleValidation,
    GameweekDataValidation,

    // Type guards
    isValidCustomPosition,
    isCompletePointsBreakdown
} from './types/scoring-types';

// ================================
// CORE CALCULATION FUNCTIONS
// ================================
export {
    calculateSeasonTotalFromGameweekPoints,
    calculateGameweekPoints,
    calculateSeasonPoints,
    getFullBreakdown,
    // Individual calculation functions
    calculateAppearancePoints,
    calculateGoalPoints,
    calculateAssistPoints,
    calculateCleanSheetPoints,
    calculateYellowCardPenalty,
    calculateRedCardPenalty,
    calculateSavesBonus,
    calculatePenaltiesSaved,
    calculateGoalsConcededPenalty,
    calculateBonus,
} from './lib/calculations';

// ================================
// DATA GENERATION FUNCTIONS
// ================================
export {
    generateSeasonData,
    generateGameweekData
} from './lib/generators';

// ================================
// UTILITY FUNCTIONS
// ================================
export {
    getLatestGameweekPoints,
    hasGameweekData,
    getAvailableGameweeks,
    getLatestGameweekWithData,
    isGameweekComplete,
    isStatRelevant,
    getPositionDisplayName,
    getPositionColor,
    formatPointsDisplay
} from './lib/utils';

// ================================
// DATA CONVERSION
// ================================
export {
    convertToPlayerGameweeksStats,
    convertToPlayerGameweekStats
} from './lib/data-conversion';

// ================================
// SCORING RULES/CONSTANTS
// ================================
export { POSITION_RULES } from './lib/rules';

// ================================
// SERVICES
// ================================
export { GameweekPointsService } from './server/services/gameweek-points.service';

// ================================
// COMPONENTS
// ================================
export { GameStats } from './components/game-stats';
export { ScoringInfo } from './components/scoring-info';
