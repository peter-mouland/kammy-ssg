// app/routes/players.$playerId.tsx
import { useLoaderData, Link } from "react-router";
import { PlayerGameweekTable } from "./components/player-gameweek-table";
import { PlayerHighlights } from "./components/player-highlights";
import { PageHeader } from '../_shared/components/page-header';
import { getPositionColor } from '../scoring/lib';
import styles from './player.page.module.css';

export const PlayerPage = () => {
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
