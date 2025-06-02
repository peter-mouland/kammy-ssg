// app/routes/dashboard.tsx
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData } from "react-router";
import { TopPlayers } from "../components/top-players";
import { LeagueStandings } from "../components/league-standings";
import { DivisionOverview } from "../components/division-overview";
import { QuickActions } from "../components/quick-actions";
import { RecentActivity } from "../components/recent-activity";
import { SystemStatus } from "../components/system-status";
import { GameStats } from "../components/game-stats";
import { PageHeader } from '../components/page-header';
import { LayoutGrid } from '../components/layout-grid';

export const meta: MetaFunction = () => {
    return [
        { title: "Dashboard - Fantasy Football Draft" },
        { name: "description", content: "Fantasy football league dashboard with top players and standings" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        // Dynamic import to keep server code on server
        const { getDashboardData } = await import("./server/dashboard.server");
        const dashboardData = await getDashboardData();
        return data(dashboardData);
    } catch (error) {
        console.error("Dashboard loader error:", error);
        throw new Response("Failed to load dashboard data", { status: 500 });
    }
}

export default function Dashboard() {
    const { topPlayers, leagueStandings, divisions, currentGameweek } = useLoaderData<typeof loader>();

    return (
        <div>
            <PageHeader
                title={"Fantasy Football Draft Dashboard"}
                subTitle={`Gameweek ${currentGameweek} • ${divisions.length} Divisions • ${leagueStandings.length}+ Teams`}
            />

            <LayoutGrid>
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
            </LayoutGrid>
        </div>
    );
}
