import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    // Main pages
    index("homepage/homepage.route.tsx"),
    route("leagues", "leagues/league-standings.route.tsx"),
    route("draft", "draft/draft.route.tsx"),
    route("players/:playerId", "players/player.route.tsx"),
    route("players", "players/players.route.tsx"),
    route("wishlists", "wishlist/wishlists.route.tsx"),

    // API routes
    route("scoring/api/gw-points", "scoring/api/api.gw-points.ts"),

    // Admin routes with nested sections
    route("admin", "admin/admin.route.tsx", [
        index("admin/admin-overview.route.tsx"),
        route("draft", "admin/admin-draft.route.tsx"),
        route("points", "admin/admin-points.route.tsx"),
        route("settings", "admin/admin-settings.route.tsx"),
    ]),
    route("admin/api/cache-status", "admin/api/api.cache-status.ts"),

    // Debug route
    route("debug", "admin/debug.route.tsx"),
] satisfies RouteConfig;
