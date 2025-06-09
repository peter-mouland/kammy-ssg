// app/routes/players.$playerId.tsx
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, Link } from "react-router";
import type { PlayerDetailData } from "../types";
import { PlayerGameweekTable } from "../components/player-gameweek-table";
import { PlayerHighlights } from "../components/player-highlights";
import { PageHeader } from '../components/page-header';
import { getPositionColor } from '../lib/scoring';
import styles from './player.$playerid.module.css';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const playerName = data?.player ? `${data.player.first_name} ${data.player.second_name}` : 'Player';
    return [
        { title: `${playerName} - Player Stats - Fantasy Football Draft` },
        { name: "description", content: `Detailed gameweek statistics and performance for ${playerName}` },
    ];
};

export async function loader({ params }: LoaderFunctionArgs): Promise<Response> {
    const playerId = params.playerId;

    if (!playerId || isNaN(Number(playerId))) {
        throw new Response("Invalid player ID", { status: 400 });
    }

    try {
        const { getPlayerDetailData } = await import("./server/player.$playerId.server");
        const playerDetailData = await getPlayerDetailData(Number(playerId));

        if (!playerDetailData.player) {
            throw new Response("Player not found", { status: 404 });
        }

        return data<PlayerDetailData>(playerDetailData);
    } catch (error) {
        console.error("Player detail loader error:", error);
        if (error instanceof Response) {
            throw error;
        }
        throw new Response("Failed to load player data", { status: 500 });
    }
}

export default function PlayerDetail() {
    const {
        player,
        team,
        position,
        gameweekStats,
        seasonTotals,
        currentGameweek
    } = useLoaderData<typeof loader>();

    const playerName = `${player.first_name} ${player.second_name}`;
    const positionColor = getPositionColor(position.toLowerCase());

    return (
        <div className={styles.playerDetailContainer}>
            {/* Navigation */}
            <div className={styles.breadcrumb}>
                <Link to="/players" className={styles.breadcrumbLink}>
                    ← Back to All Players
                </Link>
            </div>

            {/* Player Header */}
            <PageHeader
                title={playerName}
                subTitle={
                    <div className={styles.playerMeta}>
                        <span
                            className={styles.position}
                            style={{ backgroundColor: positionColor }}
                        >
                            {position}
                        </span>
                        <span className={styles.team}>{team.name}</span>
                        <span className={styles.price}>£{(player.now_cost / 10).toFixed(1)}m</span>
                    </div>
                }
            />

            {/* Player Highlights */}
            <PlayerHighlights
                player={player}
                seasonTotals={seasonTotals}
                currentGameweek={currentGameweek}
                position={position}
            />

            {/* Gameweek Breakdown */}
            <div className={styles.gameweekSection}>
                <h2 className={styles.sectionTitle}>
                    Gameweek Performance
                    <span className={styles.gameweekCount}>
                        {gameweekStats.length} gameweeks played
                    </span>
                </h2>

                <PlayerGameweekTable
                    gameweekStats={gameweekStats}
                    position={position}
                    currentGameweek={currentGameweek}
                />
            </div>
        </div>
    );
}
