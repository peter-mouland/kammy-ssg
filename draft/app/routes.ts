// app/routes.ts
// Add these new routes to your existing routes configuration

import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
    // Main pages
    index('homepage/homepage.route.tsx'),
    route('teams/:userId?', 'teams/team.route.tsx'),
    route('leagues/:divisionId?', 'leagues/league-standings.route.tsx'),
    route('draft', 'draft/draft.route.tsx'),
    route('players', 'players/players.route.tsx'),
    route('players.json', 'players/players-json.route.ts'),
    route('players/:playerCode.json', 'players/player-json.route.ts'),
    route('players/:playerCode', 'players/player.route.tsx'),
    route('transfers/:divisionId?', 'transfers/transfers.route.tsx'),
    route('wishlists', 'wishlist/wishlists.route.tsx'),

    // Cup (cross-division knockout)
    route('cup', 'cup/cup.route.tsx'),
    route('cup/submit', 'cup/cup-submit.route.tsx'),
    route('cup/admin', 'cup/cup-admin.route.tsx'),

    route('scoring/api/gw-points', 'scoring/api/api.gw-points.ts'),

    // NEW: Fresh transfers API for client-side fetching
    route('api/transfers/:divisionId', 'api/transfers/api.transfers.ts'),

    // NEW: Unified Cache Management API
    route('api/cache', 'api/cache/api.cache.ts'),

    // NEW: Draft sync comparison API route
    route('api/admin/draft-sync-comparisons', 'admin/api/api.admin.draft-sync-comparisons.ts'),
    // route('api/admin/draft-actions', 'admin/api/api.admin.draft-actions.ts'),

    // Admin routes with nested sections (legacy - for backward compatibility)
    route('admin-progress/:jobId', 'admin/admin-progress.route.tsx'),
    route('admin-progress-poll/:jobId', 'admin/admin-progress-poll.route.tsx'),

    route('admin', 'admin/admin.route.tsx', [
        index('admin/admin-overview.route.tsx'),
        route('draft', 'admin/admin-draft.route.tsx'),
        route('points', 'admin/admin-points.route.tsx'),
        route('settings', 'admin/admin-settings.route.tsx'),
        route('setup-new-season', 'admin/admin-setup-new-season.route.tsx'),
        route('transfers', 'admin/admin-transfers.route.tsx'),
    ]),

    // Debug route
    route('debug', 'admin/debug.route.tsx'),
] satisfies RouteConfig;
