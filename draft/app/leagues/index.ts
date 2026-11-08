/* Location: app/leagues/index.ts */

/**
 * The leagues domain's public API — the client-safe half.
 *
 * Everything else in this domain (`components/`, `server/`, internal helpers) is private.
 * Anything touching Firebase, Sheets or `process.env` goes in `index.server.ts`.
 */

// --- Position points ---------------------------------------------------------
// The per-position points table the homepage embeds. Ranking a division by position is
// the leagues domain's job, so this is exposed rather than promoted to _shared.
export { PositionPointsTable } from './components/position-points-table';
// --- Scoring categories ------------------------------------------------------
// Which roster slots count towards which league-table column, in table order. `transfers`
// groups a squad by these so it matches the table a manager is trying to climb.
export { POSITION_COLUMNS } from './constants/position-columns';
// --- Types -------------------------------------------------------------------
// `homepage` reads the standings loader's shape; `teams` renders team of the week;
// `transfers` shows category standings.
export type {
    CategoryStanding,
    EnhancedLeagueStandingsLoaderData,
    TeamOfTheWeekData,
    TeamOfTheWeekPlayer,
} from './types/league-standings-types';
