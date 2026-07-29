// app/_shared/types/squad-types.ts
/** biome-ignore-all lint/style/useNamingConvention: slot keys match the sheet column names */

/**
 * The data kernel, part three of three: where a player is.
 *
 *   performance-types.ts  what happened in a match
 *   player-types.ts       who a player is
 *   squad-types.ts        where a player is            <- you are here
 *
 * Which slot, since when, on loan to whom.
 *
 * RosterPlayer is a membership fact, not a player. It deliberately does not reference
 * EnhancedPlayerData: it snapshots the identity fields it needs (playerId, playerCode,
 * playerName, playerPosition) as they were **at the time of assignment**, so a later
 * change to a player's record does not rewrite history on a team sheet. That is why
 * this is a sibling of player-types.ts and not a child of it -- the two never refer to
 * each other, and both depend only on performance-types.ts.
 *
 * Adding to this file needs a note in .kiro/backlog.md. It is a shared kernel, not a
 * second dumping ground.
 */

import type { CustomPosition, RosterPosition } from './league-types';
import type { PlayerGameweekStatsData, Points } from './performance-types';

/** A player's assignment to one squad slot, snapshotted when it was made. */
export type RosterPlayer = {
    playerId: number; // FPL player ID
    playerCode: number; // FPL player code at time of assignment
    playerName: string; // web_name at time of assignment
    playerPosition: CustomPosition; // sheets position
    teamPosition: RosterPosition; // actual team slot
    teamSlotIndex: number; // 0-based index within position
    isSub: boolean;
    onLoanTo: string | null; // userId
    onLoanFrom: string | null; // userId of team lending player (NEW)
    onLoanStart: string | null; // ISO date string
    assignedAt: string; // ISO date when assigned to this slot
};

/**
 * Team position slot with player data and points
 */
export interface TeamPositionSlot {
    // Player info (from draft/transfers)
    player: RosterPlayer;

    // Points data per gameweek
    gameweek: {
        stats: PlayerGameweekStatsData;
        points: Points;
    };

    // Season totals for this position slot
    season: {
        stats: PlayerGameweekStatsData; // cumulative stats
        points: Points; // cumulative points
        seasonUpToGameweek: number; // highest gameweek included in season totals (0 = no gameweeks included)
        seasonGeneratedOn: string; // ISO date when season totals were last updated
    };
}

/**
 * Team roster structure -- the 13 fixed slots every squad has.
 */
export type TeamRoster = {
    ca_0: TeamPositionSlot;
    ca_1: TeamPositionSlot;
    cb_0: TeamPositionSlot;
    cb_1: TeamPositionSlot;
    fb_0: TeamPositionSlot;
    fb_1: TeamPositionSlot;
    gk_0: TeamPositionSlot;
    mid_0: TeamPositionSlot;
    mid_1: TeamPositionSlot;
    on_loan_0?: TeamPositionSlot;
    sub_0: TeamPositionSlot;
    wa_0: TeamPositionSlot;
    wa_1: TeamPositionSlot;
};
