
// Cache TTL configurations (in milliseconds)
export const CACHE_CONFIG = {
    // Static data - cache longer
    divisions: 120000,      // 2 minutes
    userTeams: 120000,      // 2 minutes
    draftOrders: 120000,    // 2 minutes

    // Dynamic data - cache shorter
    draftState: 15000,      // 15 seconds
    draftPicks: 30000,      // 30 seconds

    // Division-specific data
    divisionDraftPicks: 30000,  // 30 seconds
    divisionUserTeams: 60000,   // 1 minute
    divisionDraftOrder: 60000,  // 1 minute
};
