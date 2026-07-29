/* Location: app/players/index.ts */

/**
 * The players domain's public API.
 *
 * Everything else in this domain (`components/`, `server/`, internal helpers) is private.
 * There is no `index.server.ts` yet: nothing outside players needs its server code.
 *
 * Note the player *card* is no longer here — it moved to `_shared/components/player` in
 * P2.5, because eight domains rendered it and it is a genuinely shared component rather
 * than players-domain UI.
 */

// --- Copying a stat table ----------------------------------------------------
// Builds the TSV an admin pastes into a spreadsheet. Formatting a player stat line is
// this domain's job, so `admin` asks for it rather than rebuilding it.
export { buildPlayerStatsTsv } from './lib/player-stats-tsv';
// --- Types -------------------------------------------------------------------
export type { PlayerStatsData, PositionNameMap } from './types/player-types';
