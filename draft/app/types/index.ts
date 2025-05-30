// Division Types
export interface DivisionData {
    id: string;
    label: string;
    order: number;
}

// User Team Types
export interface UserTeamData {
    userId: string;
    userName: string;
    teamName: string;
    fplId: string;
    divisionId: string;
    currentGwPoints: number;
    totalPoints: number;
    overallRank: number;
    leagueRank: number;
    lastUpdated: Date;
}

// Weekly Points Types
export interface WeeklyPointsData {
    userId: string;
    gameweek: number;
    points: number;
    transfers: number;
    hits: number;
    captain: string;
    viceCaptain: string;
    benchBoost: boolean;
    tripleCaptain: boolean;
    wildcard: boolean;
    freeHit: boolean;
    dateRecorded: Date;
}

// Draft Types
export interface DraftPickData {
    pickNumber: number;
    round: number;
    userId: string;
    playerId: string;
    playerName: string;
    team: string;
    position: string;
    price: number;
    pickedAt: Date;
    divisionId: string;
}

export interface DraftStateData {
    isActive: boolean;
    currentPick: number;
    currentUserId: string;
    currentDivisionId: string;
    picksPerTeam: number;
    startedAt: Date | null;
    completedAt: Date | null;
}

export interface DraftOrderData {
    divisionId: string;
    position: number;
    userId: string;
    userName: string;
    generatedAt: Date;
}

// Player Stats Types
export interface PlayerGameweekStatsData {
    playerId: string;
    gameweek: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    penaltiesSaved: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    bonus: number;
    fixtureMinutes: number;
    updatedAt: Date;
}

export interface PlayerSeasonStatsData {
    playerId: string;
    season: string;
    totalMinutes: number;
    gamesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    penaltiesSaved: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    bonus: number;
    updatedAt: Date;
}

// Custom Position Types
export type CustomPosition = 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';


export interface PlayerData {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    position: string; // GK, CB, FB, MID, WA, CA
    team: string;
    fplId?: number; // FPL API ID for matching
    webName?: string; // FPL web name for matching
    // Add other fields from your spreadsheet as needed
    // Examples:
    nationality?: string;
    age?: number;
    value?: number;
    notes?: string;
}

export interface PlayerPositionData {
    playerId: string;
    customPosition: CustomPosition;
    team: string;
    name: string;
    price: number;
}

// Points Calculation Types
export interface PointsBreakdown {
    appearance: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    goalsConceded: number;
    bonus: number;
    total: number;
}

export interface GameweekFixture {
    playerId: string;
    gameweek: number;
    fixtureMinutes: number;
    opponent: string;
    isHome: boolean;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

// FPL API Types
export interface FplPlayerData {
    id: number;
    code: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
    element_type: number;
    now_cost: number;
    total_points: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    penalties_saved: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
}

export interface FplBootstrapData {
    events: FplGameweek[];
    game_settings: FplGameSettings;
    phases: FplPhase[];
    teams: FplTeam[];
    total_players: number;
    elements: FplPlayerData[];
    element_stats: FplStat[];
    element_types: FplElementType[];
}

export interface FplGameweek {
    id: number;
    name: string;
    deadline_time: string;
    average_entry_score: number;
    finished: boolean;
    data_checked: boolean;
    highest_scoring_entry: number;
    deadline_time_epoch: number;
    deadline_time_game_offset: number;
    highest_score: number;
    is_previous: boolean;
    is_current: boolean;
    is_next: boolean;
    chip_plays: FplChipPlay[];
    most_selected: number;
    most_transferred_in: number;
    top_element: number;
    top_element_info: FplTopElementInfo;
    transfers_made: number;
    most_captained: number;
    most_vice_captained: number;
}

export interface FplGameSettings {
    league_join_private_max: number;
    league_join_public_max: number;
    league_max_size_public_h2h: number;
    league_max_size_public_classic: number;
    league_max_size_private_h2h: number;
    league_max_size_private_classic: number;
    league_max_ko_rounds_private_h2h: number;
    league_prefix_public: string;
    league_points_h2h_win: number;
    league_points_h2h_lose: number;
    league_points_h2h_draw: number;
    league_ko_first_instead_of_random: boolean;
    squad_squadplay: number;
    squad_squadsize: number;
    squad_team_limit: number;
    squad_total_spend: number;
    ui_currency_multiplier: number;
    ui_use_special_shirts: boolean;
    ui_special_shirt_exclusions: number[];
    stats_form_days: number;
    sys_vice_captain_enabled: boolean;
    transfers_cap: number;
    transfers_sell_on_fee: number;
    league_h2h_tiebreak_stats: string[];
    timezone: string;
}

export interface FplPhase {
    id: number;
    name: string;
    start_event: number;
    stop_event: number;
}

export interface FplTeam {
    code: number;
    draw: number;
    form: null;
    id: number;
    loss: number;
    name: string;
    played: number;
    points: number;
    position: number;
    short_name: string;
    strength: number;
    team_division: null;
    unavailable: boolean;
    win: number;
    strength_overall_home: number;
    strength_overall_away: number;
    strength_attack_home: number;
    strength_attack_away: number;
    strength_defence_home: number;
    strength_defence_away: number;
    pulse_id: number;
}

export interface FplStat {
    label: string;
    name: string;
}

export interface FplElementType {
    id: number;
    plural_name: string;
    plural_name_short: string;
    singular_name: string;
    singular_name_short: string;
    squad_select: number;
    squad_min_play: number;
    squad_max_play: number;
    ui_shirt_specific: boolean;
    sub_positions_locked: number[];
    element_count: number;
}

export interface FplChipPlay {
    chip_name: string;
    num_played: number;
}

export interface FplTopElementInfo {
    id: number;
    points: number;
}

// Draft Specific Types
export interface DraftPlayer extends PlayerPositionData {
    fplData?: FplPlayerData;
    isAvailable: boolean;
    isDrafted: boolean;
    draftedBy?: string;
    draftRound?: number;
    draftPick?: number;
}

export interface DraftRoom {
    divisionId: string;
    isActive: boolean;
    currentPick: number;
    currentUserId: string;
    totalPicks: number;
    draftOrder: DraftOrderData[];
    availablePlayers: DraftPlayer[];
    draftedPlayers: DraftPickData[];
    timePerPick: number;
    pickDeadline?: Date;
}

// Sheet Configuration Types
export interface SheetConfig {
    spreadsheetId: string;
    sheetName: string;
    range?: string;
    headers: string[];
}

// Error Types
export interface AppError {
    code: string;
    message: string;
    details?: unknown;
    timestamp: Date;
}

// Search and Filter Types
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

// Server-Sent Events Types
export interface SseMessage {
    type: 'draft-update' | 'pick-made' | 'turn-change' | 'draft-complete' | 'error';
    data: unknown;
    timestamp: Date;
}

export interface DraftUpdateMessage extends SseMessage {
    type: 'draft-update';
    data: {
        currentPick: number;
        currentUserId: string;
        pickDeadline?: Date;
        recentPicks: DraftPickData[];
    };
}

export interface PickMadeMessage extends SseMessage {
    type: 'pick-made';
    data: DraftPickData;
}

export interface TurnChangeMessage extends SseMessage {
    type: 'turn-change';
    data: {
        newUserId: string;
        pickNumber: number;
        pickDeadline: Date;
    };
}

export interface DraftCompleteMessage extends SseMessage {
    type: 'draft-complete';
    data: {
        completedAt: Date;
        finalPicks: DraftPickData[];
    };
}


export interface FplPlayerGameweekData {
    element: number; // player ID
    fixture: number;
    opponent_team: number;
    total_points: number;
    was_home: boolean;
    kickoff_time: string;
    team_h_score: number;
    team_a_score: number;
    round: number;
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
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
}

export interface FplPlayerSeasonData {
    history: FplPlayerGameweekData[];
    history_past: any[];
    fixtures: any[];
}
