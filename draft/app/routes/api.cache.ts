import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { refreshPlayerCache, getPlayerStatsData, getCacheRefreshStatus, clearStuckOperations } from "../server/player-stats.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
        switch (action) {
            case "status":
                // Return cache status without refreshing
                const statsData = await getPlayerStatsData();
                const refreshStatus = await getCacheRefreshStatus();
                return data({
                    success: true,
                    cached: true,
                    playersCount: statsData.players.length,
                    isRefreshing: refreshStatus?.status === 'running',
                    refreshStatus: refreshStatus,
                    timestamp: new Date().toISOString()
                });

            case "refresh":
                const refreshResult = await refreshPlayerCache();
                return data({
                    success: true,
                    ...refreshResult,
                    timestamp: new Date().toISOString()
                });

            case "refresh-full":
                const fullRefreshResult = await refreshPlayerCache({ forceFullRefresh: true });
                return data({
                    success: true,
                    ...fullRefreshResult,
                    timestamp: new Date().toISOString()
                });

            case "clear":
                const clearResult = await refreshPlayerCache({ clearAll: true });
                return data({
                    success: true,
                    ...clearResult,
                    timestamp: new Date().toISOString()
                });

            case "clear-stuck":
                const stuckResult = await clearStuckOperations();
                return data({
                    success: true,
                    ...stuckResult,
                    message: stuckResult.wasStuck ? 'Cleared stuck operation' : 'No stuck operations found'
                });
            default:
                return data({
                    success: false,
                    message: "Invalid action. Use: status, refresh, refresh-full, or clear",
                    availableActions: ["status", "refresh", "refresh-full", "clear"]
                }, { status: 400 });
        }
    } catch (error) {
        console.error("Cache API error:", error);
        return data({
            success: false,
            message: error instanceof Error ? error.message : "Cache operation failed",
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const body = await request.json().catch(() => ({}));
    const { action, options = {} } = body;

    try {
        switch (action) {
            case "refresh":
                const refreshResult = await refreshPlayerCache(options);
                return data({
                    success: true,
                    ...refreshResult,
                    timestamp: new Date().toISOString()
                });

            case "refresh-full":
                const fullRefreshResult = await refreshPlayerCache({
                    forceFullRefresh: true,
                    ...options
                });
                return data({
                    success: true,
                    ...fullRefreshResult,
                    timestamp: new Date().toISOString()
                });

            case "clear":
                const clearResult = await refreshPlayerCache({
                    clearAll: true,
                    ...options
                });
                return data({
                    success: true,
                    ...clearResult,
                    timestamp: new Date().toISOString()
                });

            case "refresh-gameweeks":
                if (!options.specificGameweeks || !Array.isArray(options.specificGameweeks)) {
                    return data({
                        success: false,
                        message: "specificGameweeks array is required for this action"
                    }, { status: 400 });
                }

                const gameweekResult = await refreshPlayerCache({
                    specificGameweeks: options.specificGameweeks
                });
                return data({
                    success: true,
                    ...gameweekResult,
                    timestamp: new Date().toISOString()
                });

            default:
                return data({
                    success: false,
                    message: "Invalid action. Use: refresh, refresh-full, clear, or refresh-gameweeks",
                    availableActions: ["refresh", "refresh-full", "clear", "refresh-gameweeks"]
                }, { status: 400 });
        }
    } catch (error) {
        console.error("Cache API POST error:", error);
        return data({
            success: false,
            message: error instanceof Error ? error.message : "Cache operation failed",
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
