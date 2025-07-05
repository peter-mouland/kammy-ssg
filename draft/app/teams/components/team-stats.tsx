// app/teams/components/team-stats.tsx
import type React from 'react';
import { useMemo, useState } from 'react';
import { parsePositionSlot } from '../../_shared/lib/position-slot-utils';
import {
    calculateRosterTotalPoints,
    getRosterTopScorer,
    getStartingXIPlayers,
    getSubstitutePlayers,
} from '../../_shared/lib/roster-conversion-utils';
import { calculateContributingStats } from '../lib/team-stats-utils';
import type { PositionSlotKey, StatsViewMode, TeamStatsData, TeamStatsProps } from '../types/team-types';
import { ContributingStats } from './contributing-stats';
import { StatsViewToggle } from './stats-view-toggle';
import styles from './team-stats.module.css';

export const TeamStats: React.FC<TeamStatsProps> = ({
    teamData,
    gameweek,
    viewMode,
    onViewModeChange,
    hideToggle = false,
}) => {
    // State for contributing stats expansion
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);

    // Calculate team statistics from roster
    const teamStats = useMemo((): TeamStatsData => {
        const { roster } = teamData;

        // Get starting XI and substitutes
        const startingXI = getStartingXIPlayers(roster);
        const substitutes = getSubstitutePlayers(roster);

        // Use the toggle state instead of isCurrentGameweek
        const useSeasonPoints = viewMode === 'season';
        const totalPoints = calculateRosterTotalPoints(roster, useSeasonPoints);

        // Calculate starting XI vs bench points
        const startingXIPoints = startingXI.reduce((sum, player) => {
            const points = useSeasonPoints ? player.season.points.total : player.gameweek.points.total;
            return sum + points;
        }, 0);

        const benchPoints = substitutes.reduce((sum, player) => {
            const points = useSeasonPoints ? player.season.points.total : player.gameweek.points.total;
            return sum + points;
        }, 0);

        // Always calculate current gameweek points for comparison
        const gameweekPoints = calculateRosterTotalPoints(roster, false);

        // Calculate average points (season total / gameweeks played)
        const averagePoints = gameweek > 0 ? totalPoints / gameweek : 0;

        // Get top scorer
        const topScorer = getRosterTopScorer(roster, useSeasonPoints);

        // Calculate position breakdown
        const positionBreakdown: Record<string, { points: number; players: number; averagePoints: number }> = {};

        Object.entries(roster).forEach(([slot, positionSlot]) => {
            if (slot === 'on_loan_0') return;
            const { position } = parsePositionSlot(slot as PositionSlotKey);
            const points = useSeasonPoints ? positionSlot.season.points.total : positionSlot.gameweek.points.total;

            if (!positionBreakdown[position]) {
                positionBreakdown[position] = { points: 0, players: 0, averagePoints: 0 };
            }

            positionBreakdown[position].points += points;
            positionBreakdown[position].players += 1;
        });

        // Calculate averages for position breakdown
        Object.values(positionBreakdown).forEach((breakdown) => {
            breakdown.averagePoints = breakdown.players > 0 ? breakdown.points / breakdown.players : 0;
        });

        // Calculate contributing stats breakdown
        const contributingStats = calculateContributingStats(roster, useSeasonPoints);

        return {
            gameweek,
            totalPoints,
            gameweekPoints,
            averagePoints,
            startingXIPoints,
            benchPoints,
            topScorer,
            positionBreakdown,
            contributingStats,
        };
    }, [teamData.roster, gameweek, viewMode]);

    // Format points display
    const formatPoints = (points: number) => {
        return points > 0 ? `+${points}` : points.toString();
    };

    // Get position display name
    const getPositionDisplayName = (position: string) => {
        const names: Record<string, string> = {
            gk: 'Goalkeeper',
            cb: 'Centre Backs',
            fb: 'Full Backs',
            wa: 'Wide Attackers',
            ca: 'Centre Attackers',
            sub: 'Substitutes',
        };
        return names[position] || position.toUpperCase();
    };

    // Handle view mode toggle
    const handleViewModeToggle = (newMode: StatsViewMode) => {
        onViewModeChange(newMode);
    };

    return (
        <div className={styles.teamStats}>
            {hideToggle ? (
                <h3 className={styles.sectionTitle}>Team Statistics</h3>
            ) : (
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Team Statistics</h3>
                    <StatsViewToggle viewMode={viewMode} onToggle={handleViewModeToggle} />
                </div>
            )}

            {/* Main Stats Grid */}
            <div className={styles.mainStatsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{teamStats.totalPoints}</div>
                    <div className={styles.statLabel}>
                        {viewMode === 'season' ? 'Season Total' : `Gameweek ${gameweek}`}
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatPoints(teamStats.gameweekPoints)}</div>
                    <div className={styles.statLabel}>Latest Gameweek</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statValue}>{teamStats.averagePoints.toFixed(1)}</div>
                    <div className={styles.statLabel}>Average per GW</div>
                </div>
            </div>

            {/* Contributing Stats */}
            <ContributingStats
                statsBreakdown={teamStats.contributingStats}
                viewMode={viewMode}
                isExpanded={isStatsExpanded}
                onToggleExpanded={() => setIsStatsExpanded(!isStatsExpanded)}
            />

            {/* Top Scorer */}
            {teamStats.topScorer && (
                <div className={styles.topScorer}>
                    <h4 className={styles.subsectionTitle}>Top Performer</h4>
                    <div className={styles.topScorerCard}>
                        <div className={styles.topScorerInfo}>
                            <div className={styles.topScorerName}>{teamStats.topScorer.player.player.playerName}</div>
                            <div className={styles.topScorerPosition}>
                                {teamStats.topScorer.player.player.playerPosition.toUpperCase()}
                            </div>
                        </div>
                        <div className={styles.topScorerPoints}>{formatPoints(teamStats.topScorer.points)}</div>
                    </div>
                </div>
            )}

            {/* Position Breakdown */}
            <div className={styles.positionBreakdown}>
                <h4 className={styles.subsectionTitle}>By Position</h4>
                <div className={styles.positionGrid}>
                    {Object.entries(teamStats.positionBreakdown).map(([position, breakdown]) => (
                        <div key={position} className={styles.positionCard}>
                            <div className={styles.positionName}>{getPositionDisplayName(position)}</div>
                            <div className={styles.positionPoints}>{formatPoints(breakdown.points)}</div>
                            <div className={styles.positionAverage}>{breakdown.averagePoints.toFixed(1)} avg</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Period Indicator */}
            <div className={styles.timePeriodIndicator}>
                {viewMode === 'season' ? (
                    <span>📊 Showing season totals through GW{gameweek}</span>
                ) : (
                    <span>📅 Showing gameweek {gameweek} data</span>
                )}
            </div>
        </div>
    );
};
