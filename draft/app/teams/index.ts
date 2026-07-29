/* Location: app/teams/index.ts */

/**
 * The teams domain's public API.
 *
 * Everything else in this domain (`components/`, `server/`, internal helpers) is private.
 * There is no `index.server.ts`: everything exposed here is pure. The stored
 * rosters-with-points that other domains actually read live behind
 * `scoring/index.server.ts`, not here.
 *
 * Note the gameweek selector is no longer here — it moved to `_shared/components` in
 * P2.5, because four domains used it and nothing about it is teams-specific.
 */

// --- Slots -------------------------------------------------------------------
// Whether a slot counts towards a gameweek's points -- a substitute or a loaned-out
// player does not.
export { isSlotScoringActive } from './lib/position-slot-utils';
// --- Rosters -----------------------------------------------------------------
// Turning stored draft picks into a 13-slot roster, and the empty shapes a slot starts
// from. `admin` and `transfers` both build rosters this way.
export {
    convertLegacyPlayersToRoster,
    createEmptyPoints,
    createEmptyStats,
    extractLoanStatus,
} from './lib/roster-conversion-utils';
export { sortPositions } from './lib/sorting-utils';
// --- Types -------------------------------------------------------------------
// The kernel owns TeamRoster, RosterPlayer and the slot shapes (P2.1b). What is left
// here is teams' own view of a division's stored documents.
export type { DivisionTeamsDocument, RosterByManagerId, TeamGameweekData } from './types/team-types';
