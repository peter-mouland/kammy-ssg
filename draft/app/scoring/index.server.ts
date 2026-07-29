/* Location: app/scoring/index.server.ts */

/**
 * The scoring domain's SERVER-ONLY public API.
 *
 * Split from `index.ts` because everything here reaches Firestore through
 * `_shared/lib/firestore-cache/firebase.admin`, which reads `process.env` at module
 * scope. Re-exporting any of it from `index.ts` would make the whole public API unsafe
 * to import from a component.
 *
 * Rule of thumb: if it touches Firestore, Sheets or `process.env`, it goes here.
 */

// --- Division team documents -------------------------------------------------
// The stored rosters-with-points, one document per division per gameweek. This was the
// single worst Rule 2 offender in the codebase: six domains reached straight into
// `scoring/server/services/division-teams.service` because there was no legal way to ask.
export {
    createDivisionTeamsDocument,
    divisionDocumentExists,
    getDivisionTeamsDocument,
    getTeamsForGameweek,
    updateDivisionTeamsDocument,
} from './server/services/division-teams.service';
// --- Populating points -------------------------------------------------------
// Recomputing a gameweek's points into those documents. `admin` orchestrates this.
export {
    calculateSingleTeamPoints,
    upsertDivisionTeamsDocument,
} from './server/services/division-teams-points-population.service';
// --- Gameweek points ---------------------------------------------------------
export { GameweekPointsService } from './server/services/gameweek-points.service';
// --- The player-gw-points table ----------------------------------------------
// Computes the table the `player-gw-points` sheet stores. The sheets module does not
// compute it; that separation is P2.3.
export { generatePlayerGameweekPointsTable } from './server/services/player-gw-points.service';
