import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData } from "react-router";
import { getPlayerStatsData } from "./server/player-stats.server";
import type { PlayerStatsData } from "../types";
import { PlayerStatsTable } from "../components/player-stats-table";
import styles from './players.module.css';
import { ScoringInfo } from '../components/scoring-info';

export const meta: MetaFunction = () => {
    return [
        { title: "Player Stats - Fantasy Football Draft" },
        { name: "description", content: "Comprehensive player statistics with custom scoring system" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
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
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Player Statistics</h1>
                <p className={styles.subtitle}>
                    Comprehensive stats for all {players.length} Premier League players with custom scoring
                </p>

                <ScoringInfo />
            </div>

            <PlayerStatsTable players={players} teams={teams} positions={positions} />
        </div>
    );
}
