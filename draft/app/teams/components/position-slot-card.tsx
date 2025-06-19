// app/teams/components/position-slot-card.tsx
import React from 'react';
import type { PositionSlotCardProps } from '../types/team-types';
import { getPositionSlotDisplayName } from '../../_shared/lib/position-slot-utils';
import styles from './position-slot-card.module.css';

export const PositionSlotCard: React.FC<PositionSlotCardProps> = ({
                                                                      slot,
                                                                      positionSlot,
                                                                      gameweek,
                                                                      isSubstitute = false,
                                                                      showPoints = true,
                                                                      isHistorical = false
                                                                  }) => {
    const { player, gameweek: gameweekData, season } = positionSlot;

    // Use gameweek points for current/selected gameweek, season for totals
    const displayPoints = showPoints ? (isHistorical ? gameweekData.points : season.points) : null;
    const displayStats = isHistorical ? gameweekData.stats : season.stats;

    // Format points display
    const formatPoints = (points: number) => {
        return points > 0 ? `+${points}` : points.toString();
    };

    // Get main stats to display
    const mainStats = [
        { label: 'Goals', value: displayStats.goals },
        { label: 'Assists', value: displayStats.assists },
        { label: 'Apps', value: displayStats.appearance > 0 ? 1 : 0 } // Show as appearance count
    ].filter(stat => stat.value > 0);

    return (
        <div className={`${styles.positionSlotCard} ${isSubstitute ? styles.substitute : ''}`}>
            {/* Player Info */}
            <div className={styles.playerInfo}>
                <div className={styles.playerName}>
                    {player.playerName}
                </div>
                <div className={styles.playerPosition}>
                    {player.playerPosition.toUpperCase()}
                </div>
            </div>

            {/* Points Display */}
            {showPoints && displayPoints && (
                <div className={`${styles.pointsDisplay} ${displayPoints.total >= 0 ? styles.positive : styles.negative}`}>
                    {formatPoints(displayPoints.total)}
                </div>
            )}

            {/* Quick Stats */}
            {mainStats.length > 0 && (
                <div className={styles.quickStats}>
                    {mainStats.map(stat => (
                        <div key={stat.label} className={styles.statItem}>
                            <span className={styles.statValue}>{stat.value}</span>
                            <span className={styles.statLabel}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Loan Indicator */}
            {player.onLoanTo && (
                <div className={styles.loanIndicator}>
                    On Loan
                </div>
            )}

            {/* Historical Indicator */}
            {isHistorical && (
                <div className={styles.historicalIndicator}>
                    GW{gameweek}
                </div>
            )}
        </div>
    );
};
