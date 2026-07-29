// app/players/types/player-types.ts

import type { FplPlayerSeasonFixture, FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { RosterPlayer } from '../../_shared/types/squad-types';
import type { GameweekStatWithPoints, SeasonTotals } from '../../scoring/types/scoring-types';

/**
 * A player as the shared player components render it.
 *
 * The same components display players from both sides of the app: an FPL player
 * (EnhancedPlayerData, from the player list, transfers and the wishlist) and a drafted
 * squad member (RosterPlayer, from a team sheet). They read every field with a fallback
 * -- `playerCode || code`, `playerName || web_name`, `playerPosition || draft.position`
 * -- so one of the two shapes is required and the other's fields are optional.
 *
 * This was previously typed as `EnhancedPlayerData & RosterPlayer`, requiring BOTH,
 * which no caller could ever satisfy -- hence the casts and the errors at every use.
 */
export type DisplayablePlayer =
    | (EnhancedPlayerData & Partial<RosterPlayer>)
    | (RosterPlayer & Partial<EnhancedPlayerData>);

// Map position codes to their full names
export type PositionNameMap = {
    gk: 'Goalkeeper';
    fb: 'Full Back';
    cb: 'Centre Back';
    mid: 'Midfielder';
    wa: 'Wide Attacker';
    ca: 'Centre Attacker';
};

export type DataSource = 'fpl' | '2425';

export interface PlayerDetailData {
    player: EnhancedPlayerData;
    team: {
        id: number;
        name: string;
        short_name: string;
    };
    position: CustomPosition;
    gameweekStats: GameweekStatWithPoints[];
    seasonTotals: SeasonTotals;
    currentGameweek: number;
    dataSource: DataSource;
    fixtures: FplPlayerSeasonFixture[];
    fplTeamsById: Record<number, FplTeam>;
    fplEvents: GameWeekData[];
}

type Positions = {
    [K in CustomPosition]: CustomPosition;
};

export interface PlayerStatsData {
    players: EnhancedPlayerData[];
    teamsByCode: Record<number, FplTeam>;
    positions: Positions;
    currentGameweekData?: GameWeekData;
    selectedGameweekData?: GameWeekData;
    availableGameweeks?: number[];
    selectedGameweek?: number | null;
}
