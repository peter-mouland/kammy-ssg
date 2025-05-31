import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    // Main pages
    index("routes/_index.tsx"),
    route("my-team", "routes/my-team.tsx"),
    route("draft", "routes/draft.tsx"),
    route("draft/admin", "routes/draft-admin.tsx"),
    route("player/:playerId", "routes/player.$playerId.tsx"),
    route("players", "routes/players.tsx"),

    // API routes
    route("api/cache/health", "routes/api/cache/health.ts"),
    route("api/cache", "routes/api/cache/management.ts"),
    route("api/players/season-stats", "routes/api/players/season-stats.ts"),
    route("api/gameweek/:gameweekId", "routes/api/players/gameweek.$gameweek.ts"),
    route("api/sheets", "routes/api/api.sheets.ts"),
    route("api/live-scores", "routes/api/api.live-scores.ts"),

    // debugging routes
    route("debug", "routes/debug.tsx"),
] satisfies RouteConfig;

// route("api/cron", "routes/api.cron.ts"),
