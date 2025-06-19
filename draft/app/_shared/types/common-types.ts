// app/_shared/types/common-types.ts

/**
 * Common types used across multiple domains
 * These are truly shared types that don't belong to a specific domain
 */

/**
 * API response wrapper types
 */
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

/**
 * Error handling types
 */
export interface AppError {
    code: string;
    message: string;
    details?: unknown;
    timestamp: Date;
}

export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'INTERNAL_SERVER_ERROR'
    | 'FPL_API_ERROR'
    | 'SHEETS_API_ERROR'
    | 'FIREBASE_ERROR'
    | 'MISSING_SPREADSHEET_ID';

/**
 * FPL API common types (used across multiple domains)
 */
export interface FplBootstrapData {
    events: FplGameweek[];
    game_settings: FplGameSettings;
    phases: FplPhase[];
    teams: FplTeam[];
    total_players: number;
    elements: unknown[]; // Avoiding circular dependency, actual type in players domain
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
