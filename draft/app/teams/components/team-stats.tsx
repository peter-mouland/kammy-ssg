// app/teams/components/team-stats.tsx
import React, { useMemo } from 'react';
import type { TeamStatsProps, TeamStatsData } from '../types/team-view-types';
import {
    calculateRosterTotalPoints,
    getRosterTopScorer,
    getStartingXIPlayers,
    getSubstitutePlayers
} from '../../_shared/lib/roster-conversion-utils';
import { parsePositionSlot } from '../../_shared/lib/position-slot-utils';
import styles from './team-stats.module.css';

export const TeamStats: React.FC<TeamStatsProps> = ({
                                                        teamData,
                                                        gameweek,
                                                        isCurrentGameweek
                                                    }) => {
    // Calculate team statistics from roster
    const teamStats = useMemo((): TeamStatsData => {
        const { roster } = teamData;

        // Get starting XI and substitutes
        const startingXI = getStartingXIPlayers(roster);
        const substitutes = getSubstitutePlayers(roster);

        // Calculate total points (season vs gameweek)
        const useSeasonPoints = isCurrentGameweek;
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

        // Calculate current gameweek points specifically
        const gameweekPoints = calculateRosterTotalPoints(roster, false);

        // Calculate average points (season total / gameweeks played)
        const averagePoints = gameweek > 0 ? totalPoints / gameweek : 0;

        // Get top scorer
        const topScorer = getRosterTopScorer(roster, useSeasonPoints);

        // Calculate position breakdown
        const positionBreakdown: Record<string, { points: number; players: number; averagePoints: number }> = {};

        Object.entries(roster).forEach(([slot, positionSlot]) => {
            const { position } = parsePositionSlot(slot as any);
            const points = useSeasonPoints ? positionSlot.season.points.total : positionSlot.gameweek.points.total;

            if (!positionBreakdown[position]) {
                positionBreakdown[position] = { points: 0, players: 0, averagePoints: 0 };
            }

            positionBreakdown[position].points += points;
            positionBreakdown[position].players += 1;
        });

        // Calculate averages for position breakdown
        Object.values(positionBreakdown).forEach(breakdown => {
            breakdown.averagePoints = breakdown.players > 0 ? breakdown.points / breakdown.players : 0;
        });

        return {
            gameweek,
            totalPoints,
            gameweekPoints,
            averagePoints,
            startingXIPoints,
            benchPoints,
            topScorer,
            positionBreakdown
        };
    }, [teamData.roster, gameweek, isCurrentGameweek]);

    // Format points display
    const formatPoints = (points: number) => {
        return points > 0 ? `+${points}` : points.toString();
    };

    // Get position display name
    const getPositionDisplayName = (position: string) => {
        const names: Record<string, string> = {
            'gk': 'Goalkeeper',
            'cb': 'Centre Backs',
            'fb': 'Full Backs',
            'wa': 'Wide Attackers',
            'ca': 'Centre Attackers',
            'sub': 'Substitutes'
        };
        return names[position] || position.toUpperCase();
    };

    return (
        <div className={styles.teamStats}>
            <h3 className={styles.sectionTitle}>Team Statistics</h3>

            {/* Main Stats Grid */}
            <div className={styles.mainStatsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{teamStats.totalPoints}</div>
                    <div className={styles.statLabel}>
                        {isCurrentGameweek ? 'Season Total' : `Total (GW${gameweek})`}
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatPoints(teamStats.gameweekPoints)}</div>
                    <div className={styles.statLabel}>This Gameweek</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statValue}>{teamStats.averagePoints.toFixed(1)}</div>
                    <div className={styles.statLabel}>Average per GW</div>
                </div>
            </div>

            {/* Starting XI vs Bench */}
            <div className={styles.teamBreakdown}>
                <h4 className={styles.subsectionTitle}>Team Breakdown</h4>
                <div className={styles.breakdownGrid}>
                    <div className={styles.breakdownCard}>
                        <div className={styles.breakdownValue}>{teamStats.startingXIPoints}</div>
                        <div className={styles.breakdownLabel}>Starting XI</div>
                    </div>
                    <div className={styles.breakdownCard}>
                        <div className={styles.breakdownValue}>{teamStats.benchPoints}</div>
                        <div className={styles.breakdownLabel}>Bench</div>
                    </div>
                </div>
            </div>

            {/* Top Scorer */}
            {teamStats.topScorer && (
                <div className={styles.topScorer}>
                    <h4 className={styles.subsectionTitle}>Top Performer</h4>
                    <div className={styles.topScorerCard}>
                        <div className={styles.topScorerInfo}>
                            <div className={styles.topScorerName}>
                                {teamStats.topScorer.player.player.playerName}
                            </div>
                            <div className={styles.topScorerPosition}>
                                {teamStats.topScorer.player.player.playerPosition.toUpperCase()}
                            </div>
                        </div>
                        <div className={styles.topScorerPoints}>
                            {formatPoints(teamStats.topScorer.points)}
                        </div>
                    </div>
                </div>
            )}

            {/* Position Breakdown */}
            <div className={styles.positionBreakdown}>
                <h4 className={styles.subsectionTitle}>By Position</h4>
                <div className={styles.positionGrid}>
                    {Object.entries(teamStats.positionBreakdown).map(([position, breakdown]) => (
                        <div key={position} className={styles.positionCard}>
                            <div className={styles.positionName}>
                                {getPositionDisplayName(position)}
                            </div>
                            <div className={styles.positionPoints}>
                                {formatPoints(breakdown.points)}
                            </div>
                            <div className={styles.positionAverage}>
                                {breakdown.averagePoints.toFixed(1)} avg
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Period Indicator */}
            <div className={styles.timePeriodIndicator}>
                {isCurrentGameweek ? (
                    <span>Showing season totals through GW{gameweek}</span>
                ) : (
                    <span>Showing historical data for GW{gameweek}</span>
                )}
            </div>
        </div>
    );
};
