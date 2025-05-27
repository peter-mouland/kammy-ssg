import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    // Main pages
    index("routes/_index.tsx"),
    route("my-team", "routes/my-team.tsx"),
    route("draft", "routes/draft.tsx"),
    route("generate-draft", "routes/generate-draft.tsx"),
    route("player/:playerId", "routes/player.$playerId.tsx"),

    // API routes
    route("api/sheets", "routes/api.sheets.ts"),
    route("api/live-scores", "routes/api.live-scores.ts"),

    // debugging routes
    route("debug", "routes/debug.tsx"),
] satisfies RouteConfig;

    // route("api/cron", "routes/api.cron.ts"),
    // route("player.$playerId", "routes/player.$playerId.tsx"),
