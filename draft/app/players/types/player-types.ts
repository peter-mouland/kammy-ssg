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

export interface FplPlayerData {
    code: number;
    chance_of_playing_next_round: number | null;
    chance_of_playing_this_round: number | null;
    news: string;
    news_added: string | null;
    form: string;
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
    team_code: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    starts: number;
    now_cost: number;
    element_type: number;
    selected_by_percent: string;
    total_points: number;
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
