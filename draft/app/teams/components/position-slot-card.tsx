// app/teams/components/position-slot-card.tsx
import type React from 'react';
import { Link } from 'react-router';
import { getPositionColor } from '../../scoring/lib';
import type { PositionSlotCardProps } from '../types/team-types';
import styles from './position-slot-card.module.css';

const formatPoints = (points: number) => {
    return points > 0 ? `+${points}` : points.toString();
};

export const PositionSlotCard: React.FC<PositionSlotCardProps> = ({
    positionSlot,
    isSubstitute = false,
    showPoints = true,
    viewMode = 'season',
}) => {
    const { player } = positionSlot;
    const displayPoints = showPoints ? positionSlot[viewMode].points : null;
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.playerCode}.png`}`;
    const positionColor = getPositionColor(player.playerPosition);

    return (
        <div
            className={`${styles.positionSlotCard} ${isSubstitute ? styles.substitute : ''}`}
            data-view-mode={viewMode}
            style={
                {
                    '--position-color': positionColor,
                    '--position-color-light': `${positionColor}40`, // Add 40 for 25% opacity
                } as React.CSSProperties
            }
        >
            {/* Player Jersey/Avatar */}
            <div className={styles.playerJersey}>
                <div className={styles.jerseyNumber}>
                    <img src={img} loading="lazy" alt="" width={35} />
                </div>
            </div>

            {/* Player Info */}
            <div className={styles.playerInfo}>
                <Link to={`/players/${player.playerCode}`} className={styles.playerName}>
                    {player.playerName}
                </Link>
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

            {player.onLoanTo && <div className={styles.loanIndicator}>On Loan to {player.onLoanTo}</div>}
            {player.onLoanFrom && <div className={styles.loanIndicator}>On Loan from {player.onLoanFrom}</div>}
        </div>
    );
};
