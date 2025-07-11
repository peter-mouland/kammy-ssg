/* Location: app/players/player.page.tsx */

// app/routes/players.$playerId.tsx
import { Link, useLoaderData } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { getPositionColor } from '../scoring/lib';
import { PlayerGameweekTable } from './components/player-gameweek-table';
import { PlayerHighlights } from './components/player-highlights';
import styles from './player.page.module.css';
import type { PlayerDetailData } from './types/player-types';

export const PlayerPage = () => {
    const { player, team, position, gameweekStats, seasonTotals, currentGameweek } = useLoaderData<PlayerDetailData>();

    const playerName = `${player.first_name} ${player.second_name}`;
    const positionColor = getPositionColor(position);
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
                title={
                    <Link target={'_blank'} to={`https://fantasy.premierleague.com/api/element-summary/${player.id}/`}>
                        {playerName}
                    </Link>
                }
                subTitle={
                    <div className={styles.playerMeta}>
                        <span className={styles.position} style={{ backgroundColor: positionColor }}>
                            {position}
                        </span>
                        <span className={styles.team}>{team.name}</span>
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
                    <span className={styles.gameweekCount}>{gameweekStats.length} gameweeks played</span>
                </h2>

                <PlayerGameweekTable
                    gameweekStats={gameweekStats}
                    position={position}
                    currentGameweek={currentGameweek}
                />
            </div>
        </div>
    );
};
