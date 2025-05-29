import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData } from "react-router";
import { getDashboardData } from "../server/dashboard.server";
import type { DashboardData } from "../server/dashboard.server";
import { TopPlayers } from "../components/top-players";
import { LeagueStandings } from "../components/league-standings";
import { DivisionOverview } from "../components/division-overview";
import { QuickActions } from "../components/quick-actions";
import { RecentActivity } from "../components/recent-activity";
import { SystemStatus } from "../components/system-status";
import { GameStats } from "../components/game-stats";
import styles from './dashboard.module.css';

export const meta: MetaFunction = () => {
    return [
        { title: "Dashboard - Fantasy Football Draft" },
        { name: "description", content: "Fantasy football league dashboard with top players and standings" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const dashboardData = await getDashboardData();
        return data<DashboardData>(dashboardData);
    } catch (error) {
        console.error("Dashboard loader error:", error);
        throw new Response("Failed to load dashboard data", { status: 500 });
    }
}

export default function Dashboard() {
    const { topPlayers, leagueStandings, divisions, currentGameweek } = useLoaderData<typeof loader>();

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>
                    Fantasy Football Draft Dashboard
                </h1>
                <p className={styles.pageSubtitle}>
                    Gameweek {currentGameweek} • {divisions.length} Divisions • {leagueStandings.length}+ Teams
                </p>
            </div>

            <div className={styles.dashboardGrid}>
                <TopPlayers players={topPlayers} />

                <LeagueStandings standings={leagueStandings} />

                <DivisionOverview
                    divisions={divisions}
                    leagueStandings={leagueStandings}
                />

                <QuickActions />

                <RecentActivity
                    currentGameweek={currentGameweek}
                    divisions={divisions}
                />

                <SystemStatus />

                <GameStats
                    divisions={divisions}
                    leagueStandings={leagueStandings}
                    topPlayers={topPlayers}
                    currentGameweek={currentGameweek}
                />
            </div>
        </div>
    );
}
