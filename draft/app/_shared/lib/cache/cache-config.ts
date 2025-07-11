// app/_shared/lib/cache/cache-config.ts
/** biome-ignore-all lint/style/useNamingConvention: <consts in'it> */

/**
 * Cache configuration with per-endpoint TTLs and invalidation rules
 * Centralizes all cache timing decisions in one place
 */

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
    // FPL API Data - relatively static during gameWeek
    FPL_PLAYERS: 24 * 60 * 60 * 1000, // 24 hours - player data changes rarely
    FPL_TEAMS: 24 * 60 * 60 * 1000, // 24 hours - team data very static
    FPL_EVENTS: 24 * 60 * 60 * 1000, // 24 hours - gameWeek data changes rarely // todo: add cron for 11pm updates
    FPL_PLAYER_STATS: 24 * 60 * 60 * 1000, // 24 hours - detailed player stats change rarely

    // Google Sheets Data - manual data entry, changes less frequently
    SHEETS_DIVISIONS: 24 * 60 * 60 * 1000, // 24 hours - division structure rarely changes
    SHEETS_USER_TEAMS: 24 * 60 * 60 * 1000, // 24 hours - manager data rarely changes
    SHEETS_DRAFT_STATE: 5 * 60 * 1000, // 5 minutes - draft order set before draft
    SHEETS_DRAFT_ORDERS: 24 * 60 * 60 * 1000, // 24 hours - draft order set before draft
    SHEETS_DRAFT: 5 * 60 * 1000, // 5 minutes - draft order set before draft
    SHEETS_TRANSFERS: 2 * 60 * 1000, // 2 minute - can change during drafts
    SHEETS_PLAYERS: 24 * 60 * 60 * 1000, // 24 hours - player positions might be updated

    // Firebase/Firestore Data - real-time or frequently changing
    FIREBASE_DRAFT_STATE: 150 * 1000, // 150 seconds - changes rapidly during draft
    FIREBASE_DRAFT_PICKS: 300 * 1000, // 300 seconds - picks happen frequently during draft
    FIRESTORE_CACHE_STATUS: 1 * 60 * 1000, // 1 minute - cache health status

    // Transfer & Scoring Data - changes with admin actions
    DIVISION_TEAMS: 24 * 60 * 60 * 1000, // 24 hours - team rosters change with transfers/draft

    // Default fallbacks
    DEFAULT: 1 * 60 * 1000, // 1 minute default
    SHORT: 30 * 1000, // 30 seconds for frequently changing data
    MEDIUM: 5 * 60 * 1000, // 5 minutes for moderately static data
    LONG: 30 * 60 * 1000, // 30 minutes for very static data
} as const;

/**
 * Cache key patterns for organized invalidation
 */
export const CACHE_KEYS = {
    // FPL API keys
    FPL: {
        PLAYERS: 'fpl:players',
        TEAMS: 'fpl:teams',
        EVENTS: 'fpl:events',
        PLAYER_STATS: (playerId: string) => `fpl:player-stats:${playerId}`,
        BATCH_PLAYER_STATS: (playerIds: string[]) => `fpl:batch-stats:${playerIds.sort().join(',')}`,
    },

    // Google Sheets keys
    SHEETS: {
        DIVISIONS: 'sheets:divisions',
        USER_TEAMS: 'sheets:user-teams',
        DRAFT_STATE: 'sheets:draft-state',
        DRAFT_ORDERS: 'sheets:draft-orders',
        DRAFT: 'sheets:draft-picks',
        TRANSFERS: (divisionId: string) => `sheets:TRANSFERS:${divisionId}`,
        PLAYERS: 'sheets:players',
    },

    // Firebase keys
    FIREBASE: {
        DRAFT_STATE: (divisionId: string) => `firebase:draft-state:${divisionId}`,
        DRAFT_PICKS: (divisionId: string) => `firebase:draft-picks:${divisionId}`,
        CACHE_STATUS: 'firebase:cache-status',
    },

    SCORING: {
        DIVISION_TEAMS: (divisionId: string, gameWeek: number) => `scoring:teams:${divisionId}:gw${gameWeek}`,
    },
} as const;

/**
 * Cache invalidation rules - which caches to clear when certain actions happen
 */
export const CACHE_INVALIDATION_RULES = {
    // When FPL data is refreshed (e.g. cron @ 11pm)
    FPL_DATA_UPDATED: [
        CACHE_KEYS.FPL.PLAYERS,
        CACHE_KEYS.FPL.TEAMS,
        CACHE_KEYS.FPL.EVENTS,
        'fpl:player-stats:', // Pattern - invalidates all player stats
    ],

    // When transfers add submitted by managers
    TRANSFERS_UPDATED: (divisionId: string) => [CACHE_KEYS.SHEETS.TRANSFERS(divisionId)],

    // When transfers + points are processed
    TRANSFERS_PROCESSED: (divisionId: string, gameWeek: number) => [
        CACHE_KEYS.SCORING.DIVISION_TEAMS(divisionId, gameWeek),
    ],

    // When draft actions happen
    DRAFT_ACTION: (divisionId: string) => [
        CACHE_KEYS.FIREBASE.DRAFT_STATE(divisionId),
        CACHE_KEYS.FIREBASE.DRAFT_PICKS(divisionId),
        CACHE_KEYS.SHEETS.DRAFT,
        CACHE_KEYS.SHEETS.DRAFT_STATE,
        CACHE_KEYS.SHEETS.DRAFT_ORDERS,
    ],

    SHEETS_CLEAR: (divisionId: string) => [
        CACHE_KEYS.SHEETS.TRANSFERS(divisionId),
        CACHE_KEYS.SHEETS.DRAFT,
        CACHE_KEYS.SHEETS.DRAFT_STATE,
        CACHE_KEYS.SHEETS.DRAFT_ORDERS,
        CACHE_KEYS.SHEETS.PLAYERS,
        CACHE_KEYS.SHEETS.DIVISIONS,
        CACHE_KEYS.SHEETS.USER_TEAMS,
    ],
} as const;

/**
 * Get TTL for a specific cache key
 */
export function getCacheTTL(key: string): number {
    // FPL keys
    if (key.includes('fpl:players')) return CACHE_TTL.FPL_PLAYERS;
    if (key.includes('fpl:teams')) return CACHE_TTL.FPL_TEAMS;
    if (key.includes('fpl:events')) return CACHE_TTL.FPL_EVENTS;
    if (key.includes('fpl:player-stats') || key.includes('fpl:batch-stats')) return CACHE_TTL.FPL_PLAYER_STATS;

    // Sheets keys
    if (key.includes('sheets:divisions')) return CACHE_TTL.SHEETS_DIVISIONS;
    if (key.includes('sheets:user-teams')) return CACHE_TTL.SHEETS_USER_TEAMS;
    if (key.includes('sheets:players')) return CACHE_TTL.SHEETS_PLAYERS;
    if (key.includes('sheets:transfers')) return CACHE_TTL.SHEETS_TRANSFERS;
    if (key.includes('sheets:draft-state')) return CACHE_TTL.SHEETS_DRAFT_STATE;
    if (key.includes('sheets:draft-picks')) return CACHE_TTL.SHEETS_DRAFT;
    if (key.includes('sheets:draft-orders')) return CACHE_TTL.SHEETS_DRAFT_ORDERS;

    // Firebase keys
    if (key.includes('firebase:draft-state')) return CACHE_TTL.FIREBASE_DRAFT_STATE;
    if (key.includes('firebase:draft-picks')) return CACHE_TTL.FIREBASE_DRAFT_PICKS;
    if (key.includes('firebase:cache-status')) return CACHE_TTL.FIRESTORE_CACHE_STATUS;

    // Scoring keys
    if (key.includes('scoring:teams')) return CACHE_TTL.DIVISION_TEAMS;

    // Default
    return CACHE_TTL.DEFAULT;
}

/**
 * Helper to invalidate caches based on action type
 */
export function getInvalidationKeys(action: keyof typeof CACHE_INVALIDATION_RULES, ...params: any[]): string[] {
    const rule = CACHE_INVALIDATION_RULES[action];
    if (typeof rule === 'function') {
        return rule(...params);
    }
    return rule || [];
}
