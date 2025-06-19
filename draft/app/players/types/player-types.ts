// app/players/types/player-types.ts

import type { GameweekStatWithPoints, SeasonTotals, EnhancedPlayerData } from '../../scoring/types/scoring-types';

export type CustomPosition = 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';

export interface PlayerSheetsData {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    position: string;
    team: string;
    fplId?: number;
    webName?: string;
}

export interface PlayerPositionData {
    playerId: string;
    customPosition: CustomPosition;
    team: string;
    name: string;
    price: number;
}

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

export interface PlayerSearchFilters {
    position?: CustomPosition;
    team?: string;
    priceRange?: {
        min: number;
        max: number;
    };
    nameSearch?: string;
    sortBy?: 'name' | 'price' | 'points' | 'position';
    sortOrder?: 'asc' | 'desc';
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
}

type Positions = {
    [K in CustomPosition]: CustomPosition;
};


export interface PlayerStatsData {
    players: EnhancedPlayerData[];
    teams: Record<number, string>;
    positions: Positions;
}
