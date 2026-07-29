/* Location: app/scoring/index.ts */

/**
 * The scoring domain's public API.
 *
 * This is the only file other domains may import from, alongside `index.server.ts` for
 * server operations. `server/`, `components/` and the internals behind these exports are
 * private — see `.kiro/steering/ai-contribution-rules.md`, "A domain is reached only
 * through its public API", enforced by `architecture.test.ts`.
 *
 * Safe to import from a component. Anything touching Firestore, Sheets or `process.env`
 * belongs in `index.server.ts` instead — see the note at the bottom.
 */

// --- Scoring UI --------------------------------------------------------------
// Explaining a points figure is scoring's job, so these are part of the contract rather
// than components other domains happen to reach for. `players` and `transfers` embed
// the tooltip; `players` shows the rules panel.
export { PointsBreakdownTooltip } from './components/points-breakdown-tooltip';
export { ScoringInfo } from './components/scoring-info';
// --- The scoring engine ------------------------------------------------------
// Given a stat line and one of OUR custom positions, what is it worth. Every points
// figure in the app comes from here.
export {
    calculateAppearancePoints,
    calculateAssistPoints,
    calculateBonus,
    calculateCleanSheetPoints,
    calculateGameweekPoints,
    calculateGoalPoints,
    calculateGoalsConcededPenalty,
    calculatePenaltiesSaved,
    calculateRedCardPenalty,
    calculateSavesBonus,
    calculateYellowCardPenalty,
    convertToPlayerGameweekStats,
    formatPointsDisplay,
    generateSeasonData,
    getPositionDisplayName,
    isStatRelevant,
} from './lib';
// Defensive contribution is computed from the raw components against OUR position, never
// from FPL's aggregate. See the comments in `lib/calculations.ts`.
export type { DefensiveComponents } from './lib/calculations';
export {
    calculateDefensiveActions,
    calculateDefensiveContribution,
    calculateSeasonPoints,
    getFullBreakdown,
} from './lib/calculations';
export { POSITION_RULES } from './lib/rules';
// --- Types -------------------------------------------------------------------
// The vocabulary of points. `EnhancedPlayerData` and `PlayersByCode` are used by most
// of the app; they are on the P2.1b list to move into the shared kernel.
export type {
    EnhancedPlayerData,
    GameweekStatWithPoints,
    PlayersByCode,
    Points,
    PointsBreakdownItem,
    SeasonTotals,
} from './types/scoring-types';

// --- Server-only operations are NOT here -------------------------------------
// `getTeamsForGameweek`, the division-teams documents and `GameweekPointsService` live
// in `./index.server`. They reach `_shared/lib/firestore-cache/firebase.admin`, which
// reads `process.env` at module scope, so re-exporting them here would make this file
// unsafe to import from a component. Same split as the `draft` domain.
