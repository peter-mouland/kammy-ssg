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

    // Admin API routes for Firestore management
    route("admin", "admin/admin-dashboard.route.tsx"),
    route("debug", "admin/debug.route.tsx"),
] satisfies RouteConfig;
