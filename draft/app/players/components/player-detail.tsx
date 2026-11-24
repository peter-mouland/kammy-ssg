/* Location: app/players/components/player-detail.tsx */

import { Player } from '../../_shared/components/player';
import type { PlayerDetailData } from '../types/player-types';
import styles from './player-detail.module.css';
import { PlayerFixtureTable } from './player-fixture-table';
import { PlayerGameweekTable } from './player-gameweek-table';
import { PlayerHighlights, StatCard } from './player-highlights';

interface PlayerDetailProps {
    data: PlayerDetailData;
}

/**
 * Everything about one player: the header stats, highlights, gameweek performance and
 * fixtures. Presentational: it takes the data rather than loading it, so the
 * `/players/:code` page and the transfer flow's player modal show the same thing.
 * Navigation (the page's "Back to All Players") belongs to whoever renders it.
 */
export function PlayerDetail({ data }: PlayerDetailProps) {
    const { player, team, position, gameweekStats, seasonTotals, currentGameweek, fixtures, fplEvents, fplTeamsById } =
        data;
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
        <>
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
                <h2 className={styles.sectionTitle}>Gameweek Performance</h2>

                <PlayerGameweekTable
                    gameweekStats={gameweekStats}
                    position={position}
                    currentGameweek={currentGameweek}
                />
                <br />

                <h2 className={styles.sectionTitle}>Fixtures</h2>
                <PlayerFixtureTable fixtureData={fixtureData} />
            </div>
        </>
    );
}
