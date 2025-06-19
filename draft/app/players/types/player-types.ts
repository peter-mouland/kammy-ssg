// app/players/types/player-types.ts

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
