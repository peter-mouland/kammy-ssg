import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data, redirect } from "react-router";
import { useLoaderData, useNavigation, Form } from "react-router";
import { getPlayerStatsData, refreshPlayerCache } from "../server/player-stats.server";
import type { PlayerStatsData } from "../server/player-stats.server";
import { PlayerStatsTable } from "../components/player-stats-table";
import styles from './players.module.css';

export const meta: MetaFunction = () => {
    return [
        { title: "Player Stats - Fantasy Football Draft" },
        { name: "description", content: "Comprehensive player statistics with custom scoring system" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const url = new URL(request.url);
        const refreshType = url.searchParams.get('refresh');

        let playerStatsData: PlayerStatsData;

        if (refreshType) {
            // Handle different refresh types from URL params
            switch (refreshType) {
                case 'full':
                    playerStatsData = await getPlayerStatsData({ forceFullRefresh: true });
                    break;
                case 'clear':
                    playerStatsData = await getPlayerStatsData({ clearAll: true });
                    break;
                case 'bypass':
                    playerStatsData = await getPlayerStatsData({ useCacheFirst: false });
                    break;
                default:
                    playerStatsData = await getPlayerStatsData();
            }
        } else {
            playerStatsData = await getPlayerStatsData();
        }

        return data<PlayerStatsData>(playerStatsData);
    } catch (error) {
        console.error("Player stats loader error:", error);
        throw new Response("Failed to load player statistics", { status: 500 });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    try {
        let result;

        switch (intent) {
            case "refresh_full":
                result = await refreshPlayerCache({ forceFullRefresh: true });
                break;
            case "refresh_clear":
                result = await refreshPlayerCache({ clearAll: true });
                break;
            case "refresh_incremental":
                result = await refreshPlayerCache({ quickRefresh: true });
                break;
            case "bypass_cache":
                // Just redirect with bypass param
                return redirect("/players?refresh=bypass");
            default:
                throw new Error("Invalid refresh intent");
        }

        // Return success response with cache info
        return data({
            success: true,
            message: result.message,
            playersCount: result.playersCount,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Cache refresh error:", error);

        // Check if it's a "already running" error
        if (error instanceof Error && error.message.includes('already in progress')) {
            return data({
                success: false,
                message: "Cache refresh is already in progress. Please wait for it to complete.",
                timestamp: new Date().toISOString()
            }, { status: 409 }); // 409 Conflict
        }

        return data({
            success: false,
            message: error instanceof Error ? error.message : "Cache refresh failed",
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export default function Players() {
    const { players, teams, positions, cacheStatus } = useLoaderData<typeof loader>();
    const navigation = useNavigation();

    const isRefreshing = navigation.state === "submitting" &&
        navigation.formData?.get("intent")?.toString().startsWith("refresh");
    const isBypassRefreshing = navigation.state === "loading" &&
        navigation.location?.search?.includes("refresh=bypass");

    // Cache is being refreshed if either form is submitting or cache status indicates refreshing
    const isCacheRefreshing = isRefreshing || cacheStatus?.isRefreshing;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Player Statistics</h1>
                    <div className={styles.cacheControls}>
                        <Form method="post" className={styles.refreshForm}>
                            <div className={styles.refreshButtons}>
                                <button
                                    type="submit"
                                    name="intent"
                                    value="refresh_incremental"
                                    disabled={isCacheRefreshing || isBypassRefreshing}
                                    className={`${styles.refreshBtn} ${styles.refreshIncremental}`}
                                    title="Update only current gameweek data (fastest)"
                                >
                                    {isRefreshing ? "Refreshing..." : "Quick Refresh"}
                                </button>

                                <button
                                    type="submit"
                                    name="intent"
                                    value="refresh_full"
                                    disabled={isCacheRefreshing || isBypassRefreshing}
                                    className={`${styles.refreshBtn} ${styles.refreshFull}`}
                                    title="Rebuild all gameweeks from cache + fresh current gameweek"
                                >
                                    {isRefreshing ? "Refreshing..." : "Full Refresh"}
                                </button>

                                <button
                                    type="submit"
                                    name="intent"
                                    value="refresh_clear"
                                    disabled={isCacheRefreshing || isBypassRefreshing}
                                    className={`${styles.refreshBtn} ${styles.refreshClear}`}
                                    title="Delete all cache and fetch everything fresh from API (slowest)"
                                >
                                    {isRefreshing ? "Clearing..." : "Clear & Rebuild"}
                                </button>

                                <button
                                    type="submit"
                                    name="intent"
                                    value="bypass_cache"
                                    disabled={isCacheRefreshing || isBypassRefreshing}
                                    className={`${styles.refreshBtn} ${styles.refreshBypass}`}
                                    title="Bypass cache completely for this request"
                                >
                                    {isBypassRefreshing ? "Loading..." : "Bypass Cache"}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>

                <div className={styles.statusSection}>
                    <p className={styles.subtitle}>
                        Comprehensive stats for all {players.length} Premier League players with custom scoring
                    </p>

                    {isCacheRefreshing && (
                        <div className={styles.cacheRefreshStatus}>
                            <div className={styles.refreshIndicator}>
                                <div className={styles.spinner}></div>
                                <div className={styles.refreshMessage}>
                                    {cacheStatus?.progress?.currentStep || "Refreshing player data..."}
                                    {cacheStatus?.progress?.playersProcessed && cacheStatus?.progress?.totalPlayers && (
                                        <span className={styles.progressCounter}>
                                            ({cacheStatus.progress.playersProcessed}/{cacheStatus.progress.totalPlayers})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className={styles.refreshNotice}>
                                Player data is being updated in the background. The data shown is from cache and may not reflect the latest changes.
                            </p>
                        </div>
                    )}
                </div>

                <div className={styles.scoringInfo}>
                    <h3 className={styles.scoringTitle}>Custom Scoring System:</h3>
                    <div className={styles.scoringGrid}>
                        <div className={styles.scoringItem}>
                            <strong>Goals:</strong>
                            <div>GK: +10, CB/FB: +8, MID: +5, WA/CA: +4</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Assists:</strong> <div>+3 pts (all positions)</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Clean Sheets:</strong>
                            <div>+5 pts (GK, CB, FB), +3 pts (MID)</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Appearance:</strong>
                            <div>+3 pts (45+ min), +1 pt (&lt;45 min)</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Saves:</strong>
                            <div>+1 pt per 3 saves (GK only)</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Bonus Points:</strong>
                            <div>Full value (CB, MID only)</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Yellow Cards:</strong>
                            <div>-1 pt (all positions)</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Red Cards:</strong>
                            <div>-3 pts (GK, CB, FB), -5 pts (MID, WA, CA)</div>
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Goals Conceded:</strong>
                            <div>-1 pt per goal after 1st (GK, CB, FB only)</div>
                        </div>
                    </div>
                </div>
            </div>

            <PlayerStatsTable players={players} teams={teams} />
        </div>
    );
}
