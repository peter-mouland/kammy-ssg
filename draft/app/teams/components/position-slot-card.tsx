// app/teams/components/position-slot-card.tsx
import type React from 'react';
import type { PositionSlotCardProps } from '../types/team-types';
import styles from './position-slot-card.module.css';

// Format points display
const formatPoints = (points: number) => {
    return points > 0 ? `+${points}` : points.toString();
};

export const PositionSlotCard: React.FC<PositionSlotCardProps> = ({
    positionSlot,
    gameweek,
    isSubstitute = false,
    showPoints = true,
    isHistorical = false,
    viewMode = 'season',
}) => {
    const { player } = positionSlot;

    // Use view mode to determine which data to display
    // Priority: isHistorical overrides everything, then viewMode
    const displayPoints = showPoints ? positionSlot[viewMode].points : null;
    const displayStats = positionSlot[viewMode].stats;

    // Get main stats to display
    const mainStats = [
        { label: 'Goals', value: displayStats.goals },
        { label: 'Assists', value: displayStats.assists },
        { label: 'Apps', value: displayStats.appearance > 0 ? 1 : 0 },
    ].filter((stat) => stat.value > 0);

    return (
        <div
            className={`${styles.positionSlotCard} ${isSubstitute ? styles.substitute : ''}`}
            data-view-mode={viewMode}
        >
            {/* Player Info */}
            <div className={styles.playerInfo}>
                <div className={styles.playerName}>{player.playerName}</div>
                <div className={styles.playerPosition}>{player.playerPosition.toUpperCase()}</div>
            </div>

            {/* Points Display */}
            {showPoints && displayPoints && (
                <div
                    className={`${styles.pointsDisplay} ${displayPoints.total >= 0 ? styles.positive : styles.negative}`}
                >
                    {formatPoints(displayPoints.total)}
                </div>
            )}

            {/* Quick Stats */}
            {mainStats.length > 0 && (
                <div className={styles.quickStats}>
                    {mainStats.map((stat) => (
                        <div key={stat.label} className={styles.statItem}>
                            <span className={styles.statValue}>{stat.value}</span>
                            <span className={styles.statLabel}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Loan Indicator */}
            {player.onLoanTo && <div className={styles.loanIndicator}>On Loan</div>}

            {/* View Mode Indicator - Always show when not historical */}
            <div className={styles.viewModeIndicator}>{viewMode === 'gameweek' ? `GW${gameweek}` : 'Season'}</div>
        </div>
    );
};
