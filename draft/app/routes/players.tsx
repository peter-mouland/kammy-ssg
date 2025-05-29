import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData } from "react-router";
import { getPlayerStatsData } from "../server/player-stats.server";
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

                <div className={styles.scoringInfo}>
                    <h3 className={styles.scoringTitle}>Custom Scoring System:</h3>
                    <div className={styles.scoringGrid}>
                        <div className={styles.scoringItem}>
                            <strong>Goals:</strong> GK: +10, CB/FB: +8, MID: +5, WA/CA: +4
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Assists:</strong> +3 pts (all positions)
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Clean Sheets:</strong> +5 pts (GK, CB, FB), +3 pts (MID)
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Appearance:</strong> +3 pts (45+ min), +1 pt (&lt;45 min)
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Saves:</strong> +1 pt per 3 saves (GK only)
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Bonus Points:</strong> Full value (CB, MID only)
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Yellow Cards:</strong> -1 pt (all positions)
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Red Cards:</strong> -3 pts (GK, CB, FB), -5 pts (MID, WA, CA)
                        </div>
                        <div className={styles.scoringItem}>
                            <strong>Goals Conceded:</strong> -1 pt per goal after 1st (GK, CB, FB only)
                        </div>
                    </div>
                    <div className={styles.positionNote}>
                        <strong>Note:</strong> Stats marked with "-" don't contribute to points for that position.
                    </div>
                </div>
            </div>

            <PlayerStatsTable players={players} teams={teams} />
        </div>
    );
}
