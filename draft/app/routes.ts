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
    route("api/sheets", "routes/api.sheets.ts"),
    route("api/live-scores", "routes/api.live-scores.ts"),
    route("api/draft/poll", "routes/api.draft-poll.ts"),

    // debugging routes
    route("debug", "routes/debug.tsx"),
] satisfies RouteConfig;

// route("api/cron", "routes/api.cron.ts"),
