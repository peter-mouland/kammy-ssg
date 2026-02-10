// ================================
/** biome-ignore-all lint/style/useNamingConvention: <fpl in it> */
// FPL DATA INTEGRATION TYPES
// ================================

export type FplFixtureData = {
    code: number; // 2561895,
    event: number; // 1,
    finished: boolean; // true,
    finished_provisional: number; // true,
    id: number; //1,
    kickoff_time: string; // "2025-08-15T19:00:00Z",
    minutes: number; //90,
    provisional_start_time: boolean; // false,
    started: boolean; // true,
    team_a: number; //4,
    team_a_score: number; //2,
    team_h: number; //12,
    team_h_score: number; //4,
    stats: any[];
    team_h_difficulty: number; //3,
    team_a_difficulty: number; //5,
    pulse_id: number; //124791
};

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
    defensive_contribution: number;
    bps: number;
    starts: number;
    now_cost: number;
    element_type: number;
    selected_by_percent: string;
    total_points: number;
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
    defensive_contribution: number;
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
    history_past: unknown[];
    fixtures: FplPlayerSeasonFixture[];
}

export type FplPlayerSeasonFixture = {
    id: number; // 25,
    code: number; // 2561919,
    team_h: number; // 12,
    team_h_score: number; // null,
    team_a: number; // 1,
    team_a_score: number; // null,
    event: number; // 3,
    finished: boolean; // false,
    minutes: number; // 0,
    provisional_start_time: boolean; // false,
    kickoff_time: string; // "2025-08-31T15:30:00Z",
    event_name: string; // "Gameweek 3",
    is_home: boolean; // false,
    difficulty: number; // 5
};

/**
 * FPL API common types (used across multiple domains)
 */
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

interface FplGameweek {
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

interface FplGameSettings {
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

interface FplPhase {
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

interface FplStat {
    label: string;
    name: string;
}

interface FplElementType {
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

interface FplChipPlay {
    chip_name: string;
    num_played: number;
}

interface FplTopElementInfo {
    id: number;
    points: number;
}

// Filtered FPL Player Data Type (absolute essentials only)
export interface FilteredFplPlayerData {
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team_code: number;
    // Remove all season stats - these should come from element summary instead
}

export interface FplLiveElement {
    id: number;
    stats: FplPlayerGameweekData;
}

export interface FplLiveData {
    elements: FplLiveElement[];
}

export interface EventData {
    deadline_time: string | Date; // Assuming it's either a string or Date object
    finished: boolean;
    id: number;
    is_current: boolean;
    is_next: boolean;
    name: string;
}

export interface GameWeekData {
    fplEvent: EventData; // You'll need to define Event interface separately
    gameWeekIndex: number;
    start: Date;
    end: Date;
    isCurrent: boolean;
    isNext: boolean;
    hasPassed: boolean;
}
