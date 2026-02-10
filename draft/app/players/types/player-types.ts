// app/players/types/player-types.ts

import type { FplPlayerSeasonFixture, FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData, GameweekStatWithPoints, SeasonTotals } from '../../scoring/types/scoring-types';

export type CustomPosition = 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';
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
    defensiveContribution: number;
}

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
