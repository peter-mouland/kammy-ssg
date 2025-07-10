/* Location: app/routes.ts */

import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
    // Main pages
    index('homepage/homepage.route.tsx'),
    route('teams/:managerId?', 'teams/team.route.tsx'),
    route('leagues/:divisionId?', 'leagues/league-standings.route.tsx'),
    route('draft', 'draft/draft.route.tsx'),
    route('players', 'players/players.route.tsx'),
    route('players/:playerCode', 'players/player.route.tsx'),
    route('transfers/:divisionId?', 'transfers/transfers.route.tsx'),
    route('wishlists', 'wishlist/wishlists.route.tsx'),

    route('scoring/api/gw-points', 'scoring/api/api.gw-points.ts'),

    // NEW: Unified Cache Management API
    route('api/cache', 'api/cache/api.cache.ts'),

    // Admin routes with nested sections (legacy - for backward compatibility)
    route('admin', 'admin/admin.route.tsx', [
        index('admin/admin-overview.route.tsx'),
        route('draft', 'admin/admin-draft.route.tsx'),
        route('points', 'admin/admin-points.route.tsx'),
        route('settings', 'admin/admin-settings.route.tsx'),
        route('transfers', 'admin/admin-transfers.route.tsx'),
    ]),

    // Debug route
    route('debug', 'admin/debug.route.tsx'),
] satisfies RouteConfig;
