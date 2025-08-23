// app/teams/components/position-slot-card.tsx
import type React from 'react';
import { Link } from 'react-router';
import { PlayerSummary } from '../../players/components/player';
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
    teamsByCode,
    fplPlayersByCode,
}) => {
    const { player } = positionSlot;
    const displayPoints = showPoints ? positionSlot[viewMode].points : null;

    return (
        <Link
            className={`${styles.positionSlotCard} ${isSubstitute ? styles.substitute : ''}`}
            data-view-mode={viewMode}
            style={
                {
                    marginTop: '35px',
                } as React.CSSProperties
            }
            to={`/players/${player.playerCode}`}
        >
            <PlayerSummary
                player={player}
                teamsByCode={teamsByCode}
                fplPlayersByCode={fplPlayersByCode}
                view={'column'}
            />

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
        </Link>
    );
};
