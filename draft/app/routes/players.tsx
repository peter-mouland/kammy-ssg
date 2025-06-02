// app/routes/players.tsx
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData } from "react-router";
import type { PlayerStatsData } from "../types";
import { PlayerStatsTable } from "../components/player-stats-table";
import { ScoringInfo } from '../components/scoring-info';
import { PageHeader } from '../components/page-header';

export const meta: MetaFunction = () => {
    return [
        { title: "Player Stats - Fantasy Football Draft" },
        { name: "description", content: "Comprehensive player statistics with custom scoring system" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        // Dynamic import to keep server code on server
        const { getPlayerStatsData } = await import("./server/players.server");
        const playerStatsData = await getPlayerStatsData();
        return data<PlayerStatsData>(playerStatsData);
    } catch (error) {
        console.error("Player stats loader error:", error);
        throw new Response("Failed to load player statistics", { status: 500 });
    }
}

export default function Players() {
    const { players, teams, positions } = useLoaderData<typeof loader>();

    return (
        <div>

            <PageHeader
                title={"Player Statistics"}
                subTitle={`Comprehensive stats for all ${players.length} Premier League players with custom scoring`}
            />

            <ScoringInfo />

            <PlayerStatsTable players={players} teams={teams} positions={positions} />
        </div>
    );
}
