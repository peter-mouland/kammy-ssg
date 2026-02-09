/* Location: app/players/player.page.tsx */

// app/routes/players.$playerId.tsx
import { Link, useLoaderData } from 'react-router';
import { DataSourceToggle } from './components/data-source-toggle';
import { Player } from './components/player';
import { PlayerFixtureTable } from './components/player-fixture-table';
import { PlayerGameweekTable } from './components/player-gameweek-table';
import { PlayerHighlights, StatCard } from './components/player-highlights';
import styles from './player.page.module.css';
import type { PlayerDetailData } from './types/player-types';

export const PlayerPage = () => {
    const {
        player,
        team,
        position,
        gameweekStats,
        seasonTotals,
        currentGameweek,
        dataSource,
        fixtures,
        fplEvents,
        fplTeamsById,
    } = useLoaderData<PlayerDetailData>();
    const fixtureData = fixtures.map((f) => ({
        difficulty: f.difficulty,
        is_home: f.is_home,
        kickoff_time: f.kickoff_time,
        eventId: f.event,
        event_name: f.event_name?.split(' ')[1],
        event: fplEvents[f.event],
        team_a_id: f.team_a,
        team_a: fplTeamsById[f.team_a],
        team_h_id: f.team_h_id,
        team_h: fplTeamsById[f.team_h],
    }));
    return (
        <div className={styles.playerDetailContainer}>
            {/* Navigation */}
            <div className={styles.breadcrumb}>
                <Link to="/players" className={styles.breadcrumbLink}>
                    ← Back to All Players
                </Link>
            </div>

            {/* Player Header */}
            <div className={styles.statsGrid}>
                <Player player={player} team={team} position={position} />

                <StatCard
                    title="Total Points"
                    value={player.draft?.pointsTotal}
                    subtitle={`Avg: ${seasonTotals.averageCustomPoints}/game`}
                    className={styles.customPoints}
                />

                <StatCard
                    title="Games Played"
                    value={seasonTotals.gamesPlayed.toString()}
                    subtitle={`${seasonTotals.averageMinutes} min/game`}
                    className={styles.games}
                />

                <StatCard
                    title="Form"
                    value={seasonTotals.form?.toFixed(1) || '-'}
                    subtitle="Last 5 games avg"
                    className={
                        seasonTotals.form >= 4
                            ? styles.goodForm
                            : seasonTotals.form <= 2
                              ? styles.poorForm
                              : styles.averageForm
                    }
                />
            </div>

            {/* Player Highlights */}
            <PlayerHighlights player={player} seasonTotals={seasonTotals} position={position} />

            {/* Gameweek Breakdown */}
            <div className={styles.gameweekSection}>
                <h2 className={styles.sectionTitle}>
                    Gameweek Performance
                    <DataSourceToggle dataSource={dataSource} />
                </h2>

                <PlayerGameweekTable
                    gameweekStats={gameweekStats}
                    position={position}
                    currentGameweek={currentGameweek}
                />
                <br />

                <h2 className={styles.sectionTitle}>Fixtures</h2>
                <PlayerFixtureTable fixtureData={fixtureData} />
            </div>
        </div>
    );
};
